import QRCode from "qrcode";
import { PNG } from "pngjs";
import { QR_LOGO_PNG_BASE64 } from "./qr-logo";

// A center logo hides part of the code, so every render needs the highest
// error-correction tier (~30% of modules can be wrong and still decode).
export const QR_IMAGE_OPTIONS = {
  margin: 1,
  width: 320,
  errorCorrectionLevel: "H",
  color: {
    dark: "#071716",
    light: "#ffffff",
  },
};

// High-res render served by /api/qr/[id] (modal display + downloads), so a
// single code printed on a business card stays crisp.
export const QR_EXPORT_OPTIONS = {
  type: "png",
  margin: 2,
  width: 1024,
  errorCorrectionLevel: "H",
  color: QR_IMAGE_OPTIONS.color,
};

// Logo covers ~22% of the code's width — the accepted sweet spot for
// H-level error correction (big enough to read, small enough that the
// obscured center modules stay well inside the correctable budget).
const LOGO_SIZE_RATIO = 0.22;

let cachedLogo;

// Pre-flattened (opaque, white-backed) square PNG, so it can be pasted onto
// the QR bitmap with a direct overwrite instead of alpha compositing.
function getLogoPng() {
  if (!cachedLogo) {
    cachedLogo = PNG.sync.read(Buffer.from(QR_LOGO_PNG_BASE64, "base64"));
  }
  return cachedLogo;
}

// Box-average downsample (pure JS — no canvas/sharp, both unavailable in the
// Cloudflare Workers runtime this repo deploys to).
function resizeSquarePng(png, targetSize) {
  if (targetSize >= png.width) {
    return png;
  }

  const out = new PNG({ width: targetSize, height: targetSize });
  const scale = png.width / targetSize;

  for (let ty = 0; ty < targetSize; ty++) {
    const y0 = Math.floor(ty * scale);
    const y1 = Math.max(y0 + 1, Math.floor((ty + 1) * scale));

    for (let tx = 0; tx < targetSize; tx++) {
      const x0 = Math.floor(tx * scale);
      const x1 = Math.max(x0 + 1, Math.floor((tx + 1) * scale));

      let r = 0, g = 0, b = 0, a = 0, n = 0;
      for (let sy = y0; sy < y1; sy++) {
        for (let sx = x0; sx < x1; sx++) {
          const o = (sy * png.width + sx) * 4;
          r += png.data[o];
          g += png.data[o + 1];
          b += png.data[o + 2];
          a += png.data[o + 3];
          n++;
        }
      }

      const oo = (ty * targetSize + tx) * 4;
      out.data[oo] = Math.round(r / n);
      out.data[oo + 1] = Math.round(g / n);
      out.data[oo + 2] = Math.round(b / n);
      out.data[oo + 3] = Math.round(a / n);
    }
  }

  return out;
}

function pasteLogoCentered(qrPng) {
  const targetSize = Math.round(qrPng.width * LOGO_SIZE_RATIO);
  const logo = resizeSquarePng(getLogoPng(), targetSize);
  const offset = Math.floor((qrPng.width - logo.width) / 2);

  for (let y = 0; y < logo.height; y++) {
    for (let x = 0; x < logo.width; x++) {
      const src = (y * logo.width + x) * 4;
      const dest = ((offset + y) * qrPng.width + (offset + x)) * 4;
      qrPng.data[dest] = logo.data[src];
      qrPng.data[dest + 1] = logo.data[src + 1];
      qrPng.data[dest + 2] = logo.data[src + 2];
      qrPng.data[dest + 3] = logo.data[src + 3];
    }
  }
}

// Renders a QR PNG with the Beacon mark centered on top. Options are the
// same shape as QR_IMAGE_OPTIONS/QR_EXPORT_OPTIONS above.
export async function renderQrWithLogo(text, options) {
  const qrPng = PNG.sync.read(await QRCode.toBuffer(text, options));
  pasteLogoCentered(qrPng);
  return PNG.sync.write(qrPng);
}

export async function renderQrWithLogoDataUrl(text, options) {
  const buffer = await renderQrWithLogo(text, options);
  return `data:image/png;base64,${buffer.toString("base64")}`;
}

export function scanUrlFor(baseUrl, id) {
  return `${baseUrl}/r/${id}`;
}
