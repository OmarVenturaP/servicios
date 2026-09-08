import { absoluteUrl, siteConfig } from "@/config/site";
import { serviceCategories } from "@/config/service-categories";

export const seoCategories = Object.fromEntries(serviceCategories.map((category) => [category.key, category]));

const publishedCitySlugs = new Set(["tonala"]);
const developmentSources = new Set(["seed_desarrollo", "demo", "prueba"]);

export function cityDisplayName(city) {
  return [city.name, city.state, city.country].filter(Boolean).join(", ");
}

export function isRealPublicService(service) {
  return !developmentSources.has(String(service.source || "").toLowerCase());
}

export function isIndexableCity(city, services = []) {
  return Boolean(
    city
      && publishedCitySlugs.has(city.slug)
      && services.some(isRealPublicService),
  );
}

export function isIndexableCategory(city, category, services = []) {
  return Boolean(
    isIndexableCity(city, services)
      && category?.published
      && category?.indexable,
  );
}

export function generateCityMetadata(city, services = []) {
  const location = cityDisplayName(city);
  const title = `Servicios y Mandados en ${city.name}, ${city.state} | ${siteConfig.seoName}`;
  const description = `Encuentra mandaditos, motomandados y servicios locales en ${location}. Consulta disponibilidad, cobertura y precios de referencia y contacta directamente al proveedor.`;
  const url = absoluteUrl(`/${city.slug}`);
  const indexable = isIndexableCity(city, services);
  const image = {
    url: absoluteUrl(siteConfig.assets.socialImage),
    width: 1200,
    height: 630,
    alt: `${siteConfig.seoName}: servicios locales en ${city.name}, ${city.state}`,
  };

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: url },
    robots: { index: indexable, follow: indexable },
    openGraph: {
      title,
      description,
      url,
      siteName: siteConfig.seoName,
      locale: "es_MX",
      type: "website",
      images: [image],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image.url],
    },
  };
}

export function safeJsonLd(value) {
  return JSON.stringify(value).replaceAll("<", "\\u003c");
}
