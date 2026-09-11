import Header from "./Header";
import SiteFooter from "./SiteFooter";
import { siteConfig } from "@/config/site";

export default function LegalPageLayout({ title, children, eyebrow = "Información legal", showUpdatedAt = true }) {
  return (
    <div className="min-h-screen bg-[#eef1f6] py-0 text-[var(--brand-navy)] sm:py-8">
      <div className="relative mx-auto min-h-screen w-full overflow-hidden bg-[#fbfcff] shadow-[0_20px_70px_rgba(15,23,42,0.16)] sm:min-h-[840px] sm:max-w-[430px] sm:rounded-[2.25rem]">
        <Header />
        <main className="px-4 py-6 sm:px-4 sm:py-10">
          <article className="legal-content rounded-3xl border border-slate-200 bg-white px-4 py-8 shadow-[0_8px_28px_rgba(15,23,42,0.07)] sm:px-6 sm:py-12">
            <p className="text-sm font-bold text-[var(--brand-blue)]">{eyebrow}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
            {showUpdatedAt ? <p className="mt-3 text-sm text-slate-500">Última actualización: {siteConfig.legalUpdatedAt}</p> : null}
            <div className="mt-9">{children}</div>
          </article>
        </main>
        <SiteFooter />
      </div>
    </div>
  );
}
