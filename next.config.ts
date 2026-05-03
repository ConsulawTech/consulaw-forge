import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    // Map public proposal slugs (e.g. /batandbat-website) to the API route handler.
    // afterFiles means this only applies when no page/route already matches the path,
    // so /dashboard, /clients, /login etc. are completely unaffected.
    return {
      afterFiles: [
        {
          source: "/:slug([a-z0-9][a-z0-9-]*)",
          destination: "/api/p/:slug",
        },
      ],
    };
  },
};

export default nextConfig;
