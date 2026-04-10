import path from "node:path";
import { config as loadEnv } from "dotenv";
import type { NextConfig } from "next";

/** `.env` na raiz do monorepo (Prisma / `DATABASE_URL`); o Next só lê `apps/web` por defeito. */
loadEnv({ path: path.join(__dirname, "..", "..", ".env") });

/** Hostnames permitidos no `next dev` para pedidos a `/_next/*` a partir do IP da LAN (ex.: telemóvel). */
const allowedDevOrigins =
  process.env.NEXT_DEV_ALLOWED_ORIGINS?.split(/[,;]+/)
    .map((s) => s.trim())
    .filter(Boolean) ?? ["192.168.20.14"];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  transpilePackages: ["@repo/db", "@repo/shared", "@repo/payments", "@repo/whatsapp"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**" },
      { protocol: "http", hostname: "localhost", pathname: "**" },
    ],
  },
};

export default nextConfig;
