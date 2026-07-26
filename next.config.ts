import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    /* PLACEHOLDER SOURCE. Unsplash-hosted stock stands in for AlUla
       photography until real, sourced images are in place. Remove this
       pattern once the placeholders are replaced with bundled files. */
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
};

export default nextConfig;
