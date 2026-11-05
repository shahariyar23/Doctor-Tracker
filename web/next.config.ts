import type { NextConfig } from "next";

function getBackendApiUrl(): string {
  const rawUrl =
    process.env.INTERNAL_API_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:5000/api/v1"
      : "https://doctor-tracker-ten-iota.vercel.app/api/v1");

  const cleanUrl = rawUrl.replace(/\/+$/, "");
  return cleanUrl.endsWith("/api/v1") ? cleanUrl : `${cleanUrl}/api/v1`;
}

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: `${getBackendApiUrl()}/:path*`,
      },
    ];
  },
};

export default nextConfig;
