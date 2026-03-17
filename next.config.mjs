/** @type {import('next').NextConfig} */
import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  disable: process.env.NODE_ENV === "development",
  workboxOptions: {
    disableDevLogs: true,
    // Inline Workbox runtime into sw.js to avoid importScripts redirect issues on Vercel
    inlineWorkboxRuntime: true,
  },
});

const nextConfig = {
  reactStrictMode: true,
};

export default withPWA(nextConfig);
