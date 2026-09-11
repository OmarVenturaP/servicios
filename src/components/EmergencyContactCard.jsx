import { CalendarCheck, Clock3, ExternalLink, MapPin, Phone, ShieldCheck } from "lucide-react";
import { EMERGENCY_TYPE_LABELS } from "@/domain/emergency-contacts";

function formattedDate(value) {
  return new Intl.DateTimeFormat("es-MX", { day: "numeric", month: "long", year: "numeric", timeZone: "America/Mexico_City" }).format(new Date(value));
}

export default function EmergencyContactCard({ contact, city }) {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-red-50 text-red-600"><ShieldCheck aria-hidden="true" size={23} /></span>
        <div className="min-w-0">
          <p className="text-xs font-extrabold uppercase tracking-wide text-red-600">{EMERGENCY_TYPE_LABELS[contact.type] ?? "Institución"}</p>
          <h2 className="mt-1 text-lg font-black leading-tight text-[var(--brand-navy)]">{contact.name}</h2>
        </div>
      </div>

      {contact.description ? <p className="mt-3 text-sm leading-6 text-slate-600">{contact.description}</p> : null}

      <p className="mt-4 text-2xl font-black tracking-tight text-[var(--brand-navy)]">{contact.phone}{contact.extension ? <span className="ml-2 text-sm font-bold text-slate-500">Ext. {contact.extension}</span> : null}</p>
      <div className="mt-3 grid gap-2 text-sm text-slate-600">
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
          {contact.schedule ? <><span className="inline-flex items-center gap-1.5"><Clock3 className="shrink-0" aria-hidden="true" size={16} />{contact.schedule}</span></> : null}
        </p>
        <p className="flex items-start gap-2"><CalendarCheck className="mt-0.5 shrink-0" aria-hidden="true" size={16} /><span>Verificado el {formattedDate(contact.verifiedAt)}</span></p>
        <a href={contact.sourceUrl} target="_blank" rel="noreferrer" className="flex min-h-10 items-center gap-2 font-bold text-[var(--brand-blue)] underline decoration-transparent underline-offset-4 hover:decoration-current"><ExternalLink aria-hidden="true" size={16} /> Consultar fuente oficial</a>
      </div>
      <a href={`tel:${contact.phone}`} className="mt-2 flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-red-600 px-4 font-extrabold text-white shadow-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-700"><Phone aria-hidden="true" size={19} /> Llamar</a>
    </article>
  );
}
