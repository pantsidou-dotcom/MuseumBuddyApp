// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Gebruik remotePatterns voor externe bronnen zoals Wikimedia/Unsplash
    remotePatterns: [
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      // Optioneel: vang extra subdomeinen van Wikimedia op
      { protocol: 'https', hostname: '**.wikimedia.org' },
      // Voeg hier later extra domeinen toe als je crawler die gebruikt
      // { protocol: 'https', hostname: 'example-museum.nl' },
    ],
  },
  i18n: {
    locales: ['en', 'nl'],
    defaultLocale: 'en',
  },
};

module.exports = nextConfig;
