import { siteConfig } from "@/config/site";

export default function manifest() {
  return {
    name: siteConfig.name,
    short_name: siteConfig.name,
    description: siteConfig.description,
    start_url: "/tonala",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0B172A",
    lang: "es-MX",
    icons: [
      { src: "/brand/pwa-icon-192-v3.png", sizes: "192x192", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-icon-512-v3.png", sizes: "512x512", type: "image/png", purpose: "any" },
      { src: "/brand/pwa-maskable-512-v3.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
