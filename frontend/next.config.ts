import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  eslint: {
    ignoreDuringBuilds: true, // ⚠️ Skip ESLint during build
  },
  typescript: {
    ignoreBuildErrors: false, // Still check TypeScript
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'i.imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'imgur.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.ipfs.dweb.link', // IPFS gateway
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'ipfs.io',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'gateway.pinata.cloud',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.arweave.net',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com', // For fallback images
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // For placeholder images
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // Popular for stock images
        pathname: '/**',
      },
    ],
  },
  compress: true,
}

export default nextConfig
