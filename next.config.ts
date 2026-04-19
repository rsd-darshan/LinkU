import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.clerk.dev"
      }
    ]
  },
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["react", "react-dom"]
  },
  serverExternalPackages: ["socket.io"],
  async headers() {
    const securityHeaders = [
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }
    ];
    return [
      {
        source: '/api/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          ...securityHeaders
        ]
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, must-revalidate' },
          ...securityHeaders
        ]
      }
    ]
  }
};

export default nextConfig;
