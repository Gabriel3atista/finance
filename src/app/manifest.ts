import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Finance — finanças da família",
    short_name: "Finance",
    description: "Uma visão simples e compartilhada das finanças da família.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "hsl(225 15.38% 5.1%)",
    theme_color: "hsl(225 15.38% 5.1%)",
    icons: [
      {
        src: "/icons/finance-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/finance-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/finance-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
