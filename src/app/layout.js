import "./globals.css";

export const metadata = {
  title: "Servicios locales | Motomandados disponibles",
  description: "Encuentra motomandados disponibles en tu ciudad.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
