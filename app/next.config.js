/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  transpilePackages: ['@polkadot/api', '@polkadot/api-contract', '@polkadot/extension-dapp'],
};
module.exports = nextConfig;
