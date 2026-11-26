import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.supabase.co",
        pathname: "/storage/v1/object/**",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
        pathname: "/**",
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: "/:role(peserta|anggota|kader)",
        destination: "/anggota",
      },
      {
        source: "/:role(peserta|anggota|kader)/:path*",
        destination: "/anggota/:path*",
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
