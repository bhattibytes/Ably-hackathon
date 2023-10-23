/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    TINY_MCE_API_KEY: process.env.TINY_MCE_API_KEY,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
    AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
    AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
    TWITTER_CONSUMER_ID: process.env.TWITTER_CONSUMER_ID,
    TWITTER_CONSUMER_SECRET: process.env.TWITTER_CONSUMER_SECRET,
    GITHUB_ID: process.env.GITHUB_ID,
    GITHUB_SECRET: process.env.GITHUB_SECRET,
    SPACES_API_KEY: process.env.SPACES_API_KEY,
  }
}

module.exports = nextConfig

