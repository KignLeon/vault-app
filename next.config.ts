import type { NextConfig } from "next";

const securityHeaders = [
  // Prevent your site from being embedded in iframes (clickjacking protection)
  { key: "X-Frame-Options", value: "DENY" },
  // Stop browsers guessing content types (MIME sniffing attacks)
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Don't send the full URL in the Referer header to other sites
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Disable browser features that aren't needed
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  // XSS Protection (legacy browsers)
  { key: "X-XSS-Protection", value: "1; mode=block" },
  // Force HTTPS for 1 year (only effective in production)
  { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        // Apply security headers to all non-API pages
        source: "/((?!api/).*)",
        headers: securityHeaders,
      },
    ];
  },
  experimental: {
    // Increase the server-side body size limit for the upload route.
    // This covers image uploads via /api/upload (10 MB limit).
    // Video uploads bypass this entirely via client-side direct Cloudinary upload.
    serverActions: {
      bodySizeLimit: "20mb",
    },
  },
};

export default nextConfig;
