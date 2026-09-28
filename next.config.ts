import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "form-action 'self'",
  "img-src 'self' data: blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline' https://unpkg.com${isProd ? "" : " 'unsafe-eval'"}`,
  `connect-src 'self'${isProd ? "" : " ws: wss:"}`,
  "worker-src 'self' blob:",
  "manifest-src 'self'"
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(self), microphone=(), geolocation=(), payment=(), usb=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "X-Permitted-Cross-Domain-Policies", value: "none" },
  ...(isProd ? [{ key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" }] : [])
];

const nextConfig: NextConfig = {
  experimental: { serverActions: { bodySizeLimit: "6mb" } },
  images: { remotePatterns: [{ protocol: "https", hostname: "res.cloudinary.com" }] },
  poweredByHeader: false,
  async headers() { return [{ source: "/(.*)", headers: securityHeaders }]; }
};
export default nextConfig;
