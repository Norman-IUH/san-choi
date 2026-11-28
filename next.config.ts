import type { NextConfig } from "next";

const config: NextConfig = {
  poweredByHeader: false,
  serverExternalPackages: ["pdfkit"],
  outputFileTracingIncludes: {
    "/teaching/print/**": ["./public/fonts/*.ttf", "./public/illustrations/**/*"],
    "/classrooms/export": ["./public/fonts/*.ttf"],
  },
  async headers() {
    return [
      { source: "/:path*", headers: [{ key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Content-Security-Policy", value: "frame-ancestors 'none'" }] },
      { source: "/embed/:id", headers: [{ key: "Content-Security-Policy", value: "frame-ancestors *" },
        { key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/play/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
      { source: "/live/:path*", headers: [{ key: "Referrer-Policy", value: "no-referrer" }] },
    ];
  },
};

export default config;
