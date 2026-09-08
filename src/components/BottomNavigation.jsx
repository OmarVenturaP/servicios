"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Home, Menu, Search, X } from "lucide-react";
import { pilotWhatsappUrl, siteConfig } from "@/config/site";

export default function BottomNavigation() {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef(null);
  const triggerRef = useRef(null);
  const pathname = usePathname();

  const isCityPage = pathname && pathname.split("/").length === 2 && !["admin", "aviso-privacidad", "terminos-condiciones", "preguntas-frecuentes", "u"].includes(pathname.split("/")[1]);

  useEffect(() => {
    if (!open) return;
    const dialog = dialogRef.current;
    const trigger = triggerRef.current;
    const focusable = dialog?.querySelectorAll('a[href], button:not([disabled])');
    focusable?.[0]?.focus();

    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !focusable?.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      {open ? (
        <div className="fixed inset-0 z-30 bg-slate-950/25" onClick={() => setOpen(false)}>
          <section
            id="more-menu-dialog"
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="more-menu-title"
            className="absolute bottom-[calc(4.2rem+env(safe-area-inset-bottom))] left-1/2 w-[calc(100%-2rem)] max-w-[398px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <h2 id="more-menu-title" className="font-semibold text-[var(--brand-navy)]">Más información</h2>
              <button type="button" onClick={() => setOpen(false)} className="grid size-10 place-items-center rounded-xl text-slate-500 hover:bg-slate-100" aria-label="Cerrar menú">
                <X aria-hidden="true" size={20} />
              </button>
            </div>
            <nav className="mt-2 grid gap-1" aria-label="Más información">
              {isCityPage ? (
                <a href="#como-funciona" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  ¿Cómo funciona?
                </a>
              ) : (
                <Link href="/#como-funciona" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  ¿Cómo funciona?
                </Link>
              )}
              <Link href="/preguntas-frecuentes" onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                Preguntas frecuentes
              </Link>
              {siteConfig.legalLinks.map((link) => (
                <Link key={link.href} href={link.href} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  {link.label}
                </Link>
              ))}
              <a href={pilotWhatsappUrl()} target="_blank" rel="noreferrer" onClick={() => setOpen(false)} className="brand-primary-action rounded-xl px-3 py-3 text-sm font-semibold shadow-sm">
                Quiero publicar mi servicio
              </a>
            </nav>
          </section>
        </div>
      ) : null}

      <div className="h-[calc(4.2rem+env(safe-area-inset-bottom))]" aria-hidden="true" />
      <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-[430px] -translate-x-1/2 border-t border-slate-200 bg-white/95 px-7 pb-[max(0.55rem,env(safe-area-inset-bottom))] pt-2 shadow-[0_-5px_18px_rgba(15,23,42,0.06)] backdrop-blur" aria-label="Navegación principal">
        <div className="grid grid-cols-3">
          {isCityPage ? (
            <a href="#inicio" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold text-[var(--brand-blue)]">
              <Home aria-hidden="true" size={20} fill="currentColor" /> Inicio
            </a>
          ) : (
            <Link href="/" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold text-[var(--brand-blue)]">
              <Home aria-hidden="true" size={20} fill="currentColor" /> Inicio
            </Link>
          )}
          {isCityPage ? (
            <a href="#categorias" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold text-slate-500">
              <Search aria-hidden="true" size={20} /> Buscar
            </a>
          ) : (
            <Link href="/#categorias" className="flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold text-slate-500">
              <Search aria-hidden="true" size={20} /> Buscar
            </Link>
          )}
          <button ref={triggerRef} type="button" onClick={() => setOpen((current) => !current)} aria-expanded={open} aria-controls="more-menu-dialog" className={`flex min-h-12 flex-col items-center justify-center gap-0.5 text-[0.6rem] font-bold ${open ? "text-[var(--brand-blue)]" : "text-slate-500"}`}>
            <Menu aria-hidden="true" size={20} /> Más
          </button>
        </div>
      </nav>
    </>
  );
}
