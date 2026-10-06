import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hostinger's build container fails under Turbopack: its PostCSS worker
  // process for globals.css dies on startup ("node process exited before we
  // could connect"), so the build script uses --webpack instead. Hostinger also
  // reports the host's full core count, spawning more build workers than the
  // container can feed — cap it, same as zap-cruise-Client.
  experimental: {
    cpus: 2,
  },
};

export default nextConfig;
