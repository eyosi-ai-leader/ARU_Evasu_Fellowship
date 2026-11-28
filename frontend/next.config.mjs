/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
        pathname: "/**",
      },
    ],

    // Keep optimized images cached for 30 days (default is 60 seconds).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;