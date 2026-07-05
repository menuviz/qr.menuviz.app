import { dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;

// Enables the OpenNext Cloudflare bindings (env) inside `next dev`. Gated to
// dev only: the helper boots miniflare/workerd, which has no place in a
// production `next build` and must never be able to fail one.
// See https://opennext.js.org/cloudflare
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

if (process.env.NODE_ENV === "development") {
  initOpenNextCloudflareForDev().catch(() => {});
}
