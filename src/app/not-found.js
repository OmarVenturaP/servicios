import Link from "next/link";
import BrandMark from "@/components/BrandMark";

export const metadata = {
  title: "Página no encontrada",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#eef1f6] px-5 py-10 text-center">
      <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 shadow-[0_20px_70px_rgba(15,23,42,0.12)]">
        <BrandMark className="justify-center" />
        <p className="mt-8 text-sm font-bold text-[var(--brand-blue)]">Error 404</p>
        <h1 className="mt-2 text-2xl font-black text-[var(--brand-navy)]">No encontramos esta página</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">La dirección puede haber cambiado o todavía no está disponible.</p>
        <Link href="/" className="brand-primary-action mt-6 inline-flex min-h-11 items-center justify-center rounded-xl px-5 text-sm font-bold shadow-sm">Volver al inicio</Link>
      </section>
    </main>
  );
}
