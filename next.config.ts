import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Suppress warnings for optional dependencies in pdf-parse
  serverExternalPackages: ['pdf-parse'],

  // Fix for multiple lockfiles warning
  turbopack: {
    root: process.cwd(),
  },

  async redirects() {
    return [
      {
        source: '/login',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/register',
        destination: '/auth/register',
        permanent: true,
      },
      {
        source: '/signin',
        destination: '/auth/login',
        permanent: true,
      },
      {
        source: '/signup',
        destination: '/auth/register',
        permanent: true,
      },
    ]
  },
} as any;

export default nextConfig;
