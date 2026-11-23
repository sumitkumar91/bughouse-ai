/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  allowedDevOrigins: [
    '10.26.102.29',
    '10.26.102.29:3000',
    'localhost:3000',
    '127.0.0.1:3000',
  ],
};

export default nextConfig;
