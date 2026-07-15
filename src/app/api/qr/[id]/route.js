import QRCode from "qrcode";
import { PNG } from "pngjs";
import { requireAdmin } from "@/lib/admin";
import { filenameFor, getSiteUrl } from "@/lib/beacon";
import { QR_EXPORT_OPTIONS, scanUrlFor } from "@/lib/qr";
import { QR_LOGO_BADGE_PNG_BASE64 } from "@/lib/qrLogoBadge";
import { getSupabase } from "@/lib/supabase";

// Alpha-blits the pre-composited (white plate + brand logo) badge onto the
// center of a freshly-rendered QR PNG. One paste per request — the badge is
// baked at the exact export size already, so there's no runtime resize.
function withLogoBadge(qrPngBuffer) {
  const qr = PNG.sync.read(qrPngBuffer);
  const badge = PNG.sync.read(Buffer.from(QR_LOGO_BADGE_PNG_BASE64, "base64"));

  const x0 = Math.floor((qr.width - badge.width) / 2);
  const y0 = Math.floor((qr.height - badge.height) / 2);

  for (let y = 0; y < badge.height; y++) {
    for (let x = 0; x < badge.width; x++) {
      const si = (badge.width * y + x) << 2;
      const di = (qr.width * (y + y0) + (x + x0)) << 2;
      qr.data[di] = badge.data[si];
      qr.data[di + 1] = badge.data[si + 1];
      qr.data[di + 2] = badge.data[si + 2];
      qr.data[di + 3] = 255;
    }
  }

  return PNG.sync.write(qr);
}

// One QR PNG per request, generated on demand — the dashboard modal and every
// download link point here. Per-request rendering is deliberate: baking
// dozens of high-res data URLs into a single page blew the Worker's
// per-request CPU limit (Cloudflare error 1102).
//
// Not in the middleware's PUBLIC_PREFIXES, so this needs the admin cookie.
export async function GET(request, { params }) {
  await requireAdmin();
  const { id } = await params;

  const { data, error } = await getSupabase()
    .from("qr_codes")
    .select("id, label")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    return new Response("Lookup failed.", { status: 500 });
  }

  if (!data) {
    return new Response("Unknown code.", { status: 404 });
  }

  const png = await QRCode.toBuffer(
    scanUrlFor(getSiteUrl(), id),
    QR_EXPORT_OPTIONS
  );

  return new Response(withLogoBadge(png), {
    headers: {
      "Content-Type": "image/png",
      // Names browser downloads; <img> rendering ignores the disposition.
      "Content-Disposition": `attachment; filename="${filenameFor(data)}"`,
      // A code's URL never changes, so the rendered PNG never changes.
      "Cache-Control": "private, max-age=31536000, immutable",
    },
  });
}
