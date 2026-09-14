import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/jamjar",
  assetPrefix: "/jamjar/",
  trailingSlash: true,
  images: { unoptimized: true },
};

export default nextConfig;
