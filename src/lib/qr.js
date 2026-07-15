// "H" (~30% recoverable) because every rendered code gets the brand logo
// blotted over its center — "M" (the qrcode default) doesn't leave enough
// error-correction headroom for that to keep scanning reliably.
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

// Center logo badge (white plate + brand mark) as a fraction of the QR's
// full width — applied identically by the server export route and the
// client-side print grid so both look the same.
export const QR_LOGO_RATIO = 200 / 1024;

export function scanUrlFor(baseUrl, id) {
  return `${baseUrl}/r/${id}`;
}
