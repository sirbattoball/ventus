/** @type {import("next").NextConfig} */
const nextConfig = {
  // Prisma needs to be treated as external in server components
  serverExternalPackages: ["@prisma/client", "prisma"],
  experimental: {},
};

module.exports = nextConfig;
