/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    inlineWorkboxRuntime: true,
    // Only cache static assets — never navigation requests for authenticated pages
    runtimeCaching: [],
    skipWaiting: true,
    clientsClaim: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
