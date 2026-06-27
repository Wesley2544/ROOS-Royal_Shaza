/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: require('path').join(__dirname),
  allowedDevOrigins: ['192.168.0.100']
}

module.exports = nextConfig
