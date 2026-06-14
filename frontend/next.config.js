const BASE_PATH = "/silverton-sweepstake";

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: BASE_PATH,
  env: {
    NEXT_PUBLIC_BASE_PATH: BASE_PATH,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "a.espncdn.com",
        pathname: "/i/teamlogos/countries/**"
      }
    ]
  }
};

module.exports = nextConfig;
