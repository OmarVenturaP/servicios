import "./globals.css";

export const metadata = {
  title: "Servicios Tonalá | Motomandados locales",
  description: "Encuentra y contacta motomandados locales en Tonalá, Chiapas.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
