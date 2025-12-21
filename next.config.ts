import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["lucide-react", "maplibre-gl"],
  },
  images: {
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 60,
    remotePatterns: [
      { protocol: "https", hostname: "upload.wikimedia.org" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Robots-Tag",
            value: "noai, noimageai",
          },
        ],
      },
    ];
  },
  async redirects() {
    return [
      // Redirect old state URLs to new short URLs
      {
        source: "/states/:state",
        destination: "/:state",
        permanent: true,
      },
      // Redirect old state URLs with type query params to new filter URLs
      {
        source: "/states/:state",
        has: [
          {
            type: "query",
            key: "type",
            value: "hot",
          },
        ],
        destination: "/:state/hot-springs",
        permanent: true,
      },
      {
        source: "/states/:state",
        has: [
          {
            type: "query",
            key: "type",
            value: "warm",
          },
        ],
        destination: "/:state/warm-springs",
        permanent: true,
      },
      {
        source: "/states/:state",
        has: [
          {
            type: "query",
            key: "type",
            value: "cold",
          },
        ],
        destination: "/:state/swimming-holes",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
