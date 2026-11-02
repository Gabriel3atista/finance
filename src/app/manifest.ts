import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "pinutie",
    short_name: "pinutie",
    description: "Organize suas finanças pessoais e compartilhadas.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "hsl(225 15.38% 5.1%)",
    theme_color: "hsl(225 15.38% 5.1%)",
    icons: [
      {
        src: "/icons/pinutie-svg.svg",
        sizes: "any",
        type: "image/svg+xml",
      },
      {
        src: "/icons/pinutie-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        src: "/icons/pinutie-512.png",
        sizes: "512x512",
        type: "image/png",
      },
      {
        src: "/icons/pinutie-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icons/pinutie-maskable-icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
