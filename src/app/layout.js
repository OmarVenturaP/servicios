import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import BottomNavigation from "@/components/BottomNavigation";
import { siteConfig } from "@/config/site";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

export const metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.seoName} | ${siteConfig.tagline}`,
    template: `%s | ${siteConfig.seoName}`,
  },
  description: siteConfig.description,
  applicationName: siteConfig.seoName,
  category: "servicios locales",
  keywords: ["servicios locales", "prestadores de servicios", "mandados", "Somos Servicios"],
  authors: [{ name: siteConfig.creator.name, url: siteConfig.creator.url }],
  creator: siteConfig.creator.name,
  publisher: siteConfig.seoName,
  referrer: "origin-when-cross-origin",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/brand/favicon-64.png", sizes: "64x64", type: "image/png" },
      { url: "/brand/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/brand/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/brand/apple-touch-icon-v3.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: `${siteConfig.seoName} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    url: siteConfig.url,
    siteName: siteConfig.seoName,
    locale: "es_MX",
    type: "website",
    images: [{ url: siteConfig.assets.socialImage, width: 1200, height: 630, alt: `${siteConfig.seoName} — ${siteConfig.brandMessage}` }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.seoName} | ${siteConfig.tagline}`,
    description: siteConfig.description,
    images: [siteConfig.assets.socialImage],
  },
};

export const viewport = {
  themeColor: "#0B172A",
  colorScheme: "light",
};

export default function RootLayout({ children }) {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${siteConfig.url}/#organization`,
        name: siteConfig.seoName,
        url: siteConfig.url,
        logo: absoluteBrandUrl(siteConfig.assets.horizontalLogo),
        email: siteConfig.contactEmail,
      },
      {
        "@type": "WebSite",
        "@id": `${siteConfig.url}/#website`,
        name: siteConfig.seoName,
        url: siteConfig.url,
        description: siteConfig.description,
        inLanguage: "es-MX",
        publisher: { "@id": `${siteConfig.url}/#organization` },
      },
    ],
  };

  return (
    <html lang="es-MX" className={`${plusJakartaSans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
        />
        {children}
        <BottomNavigation />
      </body>
    </html>
  );
}

function absoluteBrandUrl(path) {
  return new URL(path, siteConfig.url).toString();
}
