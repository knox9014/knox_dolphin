/** @type {import('next').NextConfig} */
const nextConfig = {
  // node:sqlite is a built-in Node module; keep it external so Next doesn't bundle it.
  serverExternalPackages: ["node:sqlite"],
};

module.exports = nextConfig;
