import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Redirect apex host -> www for canonical consistency
  redirects: async () => {
    return [
      {
        source: "/:path*",
        has: [{ type: "host", value: "askalpha.tech" }],
        destination: "https://www.askalpha.tech/:path*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
