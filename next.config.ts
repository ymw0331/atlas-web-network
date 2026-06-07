import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: '/network',
  output: 'export',
  reactStrictMode: true,
  images: {
    unoptimized: true,
  },
  transpilePackages: ['atlas-shared-web'],
};

export default nextConfig;
