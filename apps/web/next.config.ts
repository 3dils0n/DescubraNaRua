import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@repo/db", "@repo/shared", "@repo/payments", "@repo/whatsapp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", pathname: "**" },
    ],
  },
};

export default nextConfig;
