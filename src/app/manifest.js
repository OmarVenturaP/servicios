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
      { src: "/brand/app-icon.png", sizes: "512x512", type: "image/png", purpose: "any" },
    ],
  };
}
