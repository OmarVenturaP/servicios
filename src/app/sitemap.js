import { absoluteUrl } from "@/config/site";

export default function sitemap() {
  const lastModified = new Date();
  return [
    { url: absoluteUrl("/tonala"), lastModified, changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/preguntas-frecuentes"), lastModified, changeFrequency: "monthly", priority: 0.6 },
    { url: absoluteUrl("/terminos-condiciones"), lastModified, changeFrequency: "yearly", priority: 0.3 },
    { url: absoluteUrl("/aviso-privacidad"), lastModified, changeFrequency: "yearly", priority: 0.3 },
  ];
}
