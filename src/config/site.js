export const siteConfig = {
  name: "Servicios",
  url: "https://www.somosservicios.com",
  tagline: "Gente local para tu día a día",
  brandMessage: "Conecta tu día a día",
  description: "Encuentra servicios locales disponibles, compara precios desde y contacta directamente con prestadores en tu ciudad.",
  contactEmail: "somosserviciosmx@gmail.com",
  legalEmail: "somosserviciosmx@gmail.com",
  privacyEmail: "somosserviciosmx@gmail.com",
  creator: {
    name: "Servitec Tonalá",
    url: "https://servitec-tonala.es",
  },
  pilot: {
    period: " de 2026",
    whatsapp: "529619326182",
    message: "Hola, quiero que mi servicio aparezca en Servicios y me interesa unirme al piloto. ¿Me pueden compartir información?",
  },
  legalUpdatedAt: "7 de septiembre de 2026",
  assets: {
    horizontalLogo: "/brand/logo-horizontal.png",
    icon: "/brand/isotipo.png",
    socialImage: "/brand/og-image.png",
  },
  legalLinks: [
    { href: "/terminos-condiciones", label: "Términos y Condiciones" },
    { href: "/aviso-privacidad", label: "Aviso de Privacidad" },
  ],
};

export function absoluteUrl(path = "/") {
  return new URL(path, siteConfig.url).toString();
}

export function pilotWhatsappUrl() {
  return `https://wa.me/${siteConfig.pilot.whatsapp}?text=${encodeURIComponent(siteConfig.pilot.message)}`;
}
