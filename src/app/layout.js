import "./globals.css";

export const metadata = {
  title: "Beacon",
  description: "Dynamic scan-to-program QR codes with server-side redirects and analytics.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
