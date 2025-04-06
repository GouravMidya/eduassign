/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'standalone',
    // Disable TypeScript type checking during build
    typescript: {
      ignoreBuildErrors: true,
  },
  // Disable ESLint during build
  eslint: {
      ignoreDuringBuilds: true,
  }
}

export default nextConfig;
