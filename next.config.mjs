/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // Keep heavy Node packages out of the webpack bundle.
    serverComponentsExternalPackages: ['puppeteer', 'pdfkit', 'bullmq', 'ioredis', '@prisma/client', 'cheerio'],
  },
};

export default nextConfig;