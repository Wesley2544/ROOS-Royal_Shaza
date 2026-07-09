/** @type {import('next').NextConfig} */
const nextConfig = {
  // Only silence the local Windows lockfile warning outside of Vercel —
  // this setting caused a build-packaging mismatch when left on for
  // production, so it's now scoped to local dev only.
  ...(process.env.VERCEL ? {} : { outputFileTracingRoot: require('path').join(__dirname) }),
}

module.exports = nextConfig