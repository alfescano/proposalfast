import type { NextConfig } from "next";

const pdfkitFontGlobs = [
  "./node_modules/pdfkit/js/standard-fonts/**/*",
  "./node_modules/pdfkit/js/data/**/*",
];

const blogContentGlobs = ["./content/blog/**/*.md"];

const nextConfig: NextConfig = {
  // pdfkit loads Helvetica.cjs (and Times) from disk. Bundling drops those files
  // and Vercel fails with "Cannot find module .../pdfkit/js/standard-fonts/Helvetica.cjs".
  serverExternalPackages: [
    "@prisma/client",
    "bcryptjs",
    "inngest",
    "@upstash/redis",
    "@sentry/nextjs",
    "@react-pdf/renderer",
    "@react-pdf/font",
    "pdfkit",
  ],
  outputFileTracingIncludes: {
    "/*": [...pdfkitFontGlobs, ...blogContentGlobs],
    "/proposals/[id]/pdf": pdfkitFontGlobs,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.amazonaws.com" },
      { protocol: "https", hostname: "**.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "lh3.googleusercontent.com" },
    ],
  },
  // Fallback 301 if both hosts hit this app. Prefer a Vercel domain redirect
  // from proposefast.com → https://proposalfast.ai so the hop happens at the edge.
  async redirects() {
    return [
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "proposefast.com" }],
        destination: "https://proposalfast.ai/:path*",
        permanent: true,
      },
      {
        source: "/:path*",
        has: [{ type: "host" as const, value: "www.proposefast.com" }],
        destination: "https://proposalfast.ai/:path*",
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-DNS-Prefetch-Control", value: "on" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), payment=(self)",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
