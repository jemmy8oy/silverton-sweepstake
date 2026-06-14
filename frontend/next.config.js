/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  basePath: "/silverton-sweepstake",
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
