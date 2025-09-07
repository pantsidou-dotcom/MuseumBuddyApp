// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // Disable Next.js image optimization so images are loaded directly
    // from their original hosts instead of being proxied through Vercel.
    // This avoids re-hosting external images.
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: '**',
        pathname: '/**',
      },
    ],
  },
  // geen "output: 'export'"
};

module.exports = nextConfig;
