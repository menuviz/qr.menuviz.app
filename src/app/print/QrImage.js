"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { QR_IMAGE_OPTIONS, QR_LOGO_RATIO } from "@/lib/qr";

let logoImagePromise;

// Shared across every grid cell — one decode, reused for every code on the
// sheet rather than one <img> fetch per cell.
function loadLogoImage() {
  if (!logoImagePromise) {
    logoImagePromise = new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = "/logo.png";
    });
  }
  return logoImagePromise;
}

// Draws the QR onto a canvas, then a white plate + brand logo over its
// center, matching the badge baked into the server's /api/qr/[id] export
// (see QR_LOGO_RATIO in src/lib/qr.js) so the print sheet and the
// downloaded PNG look identical.
async function compositeWithLogo(qrDataUrl, size) {
  const [qrImg, logoImg] = await Promise.all([
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = qrDataUrl;
    }),
    loadLogoImage(),
  ]);

  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(qrImg, 0, 0, size, size);

  const plate = size * QR_LOGO_RATIO;
  const padding = plate * 0.05;
  const inner = plate - padding * 2;
  const origin = (size - plate) / 2;

  // Contain-fit rather than stretch — the logo isn't perfectly square, and
  // stretching it to fit would distort it.
  const logoScale = Math.min(
    inner / logoImg.naturalWidth,
    inner / logoImg.naturalHeight
  );
  const logoW = logoImg.naturalWidth * logoScale;
  const logoH = logoImg.naturalHeight * logoScale;
  const logoX = origin + padding + (inner - logoW) / 2;
  const logoY = origin + padding + (inner - logoH) / 2;

  ctx.fillStyle = "#ffffff";
  ctx.fillRect(origin, origin, plate, plate);
  ctx.drawImage(logoImg, logoX, logoY, logoW, logoH);

  return canvas.toDataURL("image/png");
}

// Encodes the QR in the visitor's browser. Encoding hundreds of PNGs inside
// one Worker request is the Cloudflare 1102 failure class (see CLAUDE.md) —
// client-side rendering costs the worker zero CPU regardless of sheet size.
export default function QrImage({ value, alt }) {
  const [src, setSrc] = useState(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(value, QR_IMAGE_OPTIONS)
      .then((url) => compositeWithLogo(url, QR_IMAGE_OPTIONS.width))
      .then(
        (composited) => {
          if (!cancelled) {
            setSrc(composited);
          }
        },
        () => {
          // Encoding a valid URL can't realistically fail; keep the placeholder.
        }
      );
    return () => {
      cancelled = true;
    };
  }, [value]);

  if (!src) {
    return <div className="qr-pending" aria-label={`${alt} (rendering)`} />;
  }

  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} />;
}
