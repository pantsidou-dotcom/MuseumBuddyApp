// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Voor Capacitor hebben we een statische export nodig
  output: 'export',

  // Zet images op 'unoptimized' zodat Next/Image geen server nodig heeft
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '**.wikimedia.org' },
    ],
  },

  // Let op: i18n is tijdelijk verwijderd omdat output: 'export' geen i18n ondersteunt
};

module.exports = nextConfig;
