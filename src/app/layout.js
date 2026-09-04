import "./globals.css";

export const metadata = {
  title: "Servicios",
  description: "Base para administrar servicios con Next.js, MySQL y Drizzle ORM.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
