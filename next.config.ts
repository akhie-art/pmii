import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/:role(peserta|anggota|kader)",
        destination: "/kader",
      },
      {
        source: "/:role(peserta|anggota|kader)/:path*",
        destination: "/kader/:path*",
      },
      {
        source: "/:role(admin|cabang|pc|pengurus|instruktur|superadmin|super_admin)",
        destination: "/dashboard",
      },
      {
        source: "/:role(admin|cabang|pc|pengurus|instruktur|superadmin|super_admin)/:path*",
        destination: "/dashboard/:path*",
      },
    ];
  },
};

export default nextConfig;
