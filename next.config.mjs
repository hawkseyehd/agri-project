/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    outputFileTracingExcludes: {
      "*": [
        ".pnpm-store/**",
        "node_modules/.pnpm/@playwright+test*/**",
        "node_modules/.pnpm/playwright*/**",
        "Plan/**",
        "docs/**",
        ".git/**",
      ],
    },
  },
};

export default nextConfig;
