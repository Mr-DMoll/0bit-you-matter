/** @type {import('next').NextConfig} */
const nextConfig = {
  compress: true,
  experimental: {
    optimizePackageImports: ["lucide-react"],
  },
  serverExternalPackages: ["@react-pdf/renderer"],
};

export default nextConfig;
