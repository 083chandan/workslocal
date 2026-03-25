import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['@workslocal/shared'],
  output: 'standalone',
  reactStrictMode: true,
};

export default nextConfig;
