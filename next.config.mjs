/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Posters are pre-processed to fixed widths by scripts/process-posters.mjs
    deviceSizes: [640, 828, 1080, 1200, 1600, 2048, 2560],
  },
  experimental: {
    optimizePackageImports: ['@react-three/drei', 'framer-motion'],
  },
  async headers() {
    return [
      {
        source: '/posters/:path*',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=31536000, immutable' }],
      },
    ];
  },
};
export default nextConfig;
