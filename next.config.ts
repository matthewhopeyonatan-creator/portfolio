import type { NextConfig } from "next";

// Old Framer addresses (matthew-hope.com/…) that may still be linked from a résumé or a post land
// on their place in the new site.
const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/crowdvolt", destination: "/?project=crowdvolt", permanent: true },
      { source: "/shmood", destination: "/?project=shmood", permanent: true },
      { source: "/inky", destination: "/#seasonal-picks", permanent: true },
    ];
  },
};

export default nextConfig;
