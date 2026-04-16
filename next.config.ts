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
  // Increase API route timeout to prevent timeouts during WebRTC operations
  experimental: {
    // Fix: Move to correct location
    optimizeCss: true,
    optimizePackageImports: ['react', 'react-dom']
  },
  // Fix: Move serverExternalPackages to correct location
  serverExternalPackages: ['socket.io'],
  // Increase timeout for API routes
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
  },
  // Handle Chrome extension hydration issues
  webpack: (config: any, { isServer }: any) => {
    if (isServer) {
      return {
        ...config,
        resolve: {
          alias: {
            ...config.resolve?.alias,
          },
          plugins: [
            ...(config.resolve?.plugins || []),
            // Remove Chrome extension attributes that cause hydration
            new (class RemoveChromeExtensionIds {
              apply(compiler: any) {
                compiler.hooks.compilation.tap('RemoveChromeExtensionIds', (compilation: any) => {
                  compilation.mainTemplate = compilation.mainTemplate?.replace(/__gchrome_uniqueid="\d+"/g, '');
                  compilation.mainTemplate = compilation.mainTemplate?.replace(/data-gchrome_uniqueid="[^"]*"/g, '');
                });
              }
            })
          ]
        }
      };
    }
    return config;
  }
};

export default nextConfig;
