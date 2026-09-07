import Link from "next/link";
import { siteConfig } from "@/config/site";

export default function SiteFooter({ compact = false }) {
  return (
    <footer className={`border-t border-slate-200 bg-white px-5 ${compact ? "pb-20 pt-4" : "py-5"}`}>
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-3 text-xs sm:flex-row sm:items-center sm:justify-between">
        <nav className="flex flex-wrap gap-x-4 gap-y-2 font-semibold text-slate-600" aria-label="Información legal">
          {siteConfig.legalLinks.map((link) => (
            <Link key={link.href} href={link.href} className="rounded hover:text-[var(--brand-blue)]">
              {link.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-slate-500">
          <span>© {new Date().getFullYear()} {siteConfig.name}</span>
          <a href={siteConfig.creator.url} target="_blank" rel="noreferrer" className="font-semibold hover:text-[var(--brand-blue)]">Creado por SERVITEC</a>
        </div>
      </div>
    </footer>
  );
}
