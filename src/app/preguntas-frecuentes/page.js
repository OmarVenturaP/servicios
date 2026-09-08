import Link from "next/link";
import LegalPageLayout from "@/components/LegalPageLayout";
import { absoluteUrl, pilotWhatsappUrl, siteConfig } from "@/config/site";

const questions = [
  {
    question: "¿Qué es Servicios?",
    answer: "Servicios es una plataforma que ayuda a encontrar prestadores locales y contactar directamente con ellos. La plataforma facilita el descubrimiento y el contacto, pero no realiza físicamente los servicios anunciados.",
  },
  {
    question: "¿Cómo encuentro un servicio de mandados en Tonalá?",
    answer: "Entra a Servicios en Tonalá, revisa los mandaditos o motomandados disponibles y compara su cobertura y precio desde. Después contacta directamente al proveedor que prefieras por WhatsApp o llamada.",
  },
  {
    question: "¿Qué significa “Disponible ahora”?",
    answer: "Significa que al menos una unidad del prestador registró disponibilidad vigente. Ese estado puede cambiar, por lo que recomendamos confirmar directamente al establecer contacto.",
  },
  {
    question: "¿El precio mostrado es el precio final?",
    answer: "No necesariamente. “Desde $X” es una referencia basada en las unidades disponibles. El precio final puede variar según distancia, horario, características del servicio y el acuerdo entre el cliente y el prestador.",
  },
  {
    question: "¿Servicios procesa pagos o contrataciones?",
    answer: "No. El contacto, la contratación, la forma de pago y las condiciones del trabajo se acuerdan directamente entre el cliente y el prestador.",
  },
  {
    question: "¿Necesito crear una cuenta para buscar?",
    answer: "No. Actualmente puedes consultar los servicios y contactar a un prestador sin crear una cuenta de cliente.",
  },
  {
    question: "¿Los proveedores trabajan en todo Tonalá?",
    answer: "No necesariamente. Cada proveedor define su propia zona de cobertura. Consulta la cobertura indicada en su tarjeta y confírmala directamente al iniciar el contacto.",
  },
  {
    question: "¿Por qué algunas categorías dicen “Próximamente”?",
    answer: "Mandados es la primera categoría disponible. Las demás muestran los tipos de servicio que podrán incorporarse conforme la plataforma crezca y existan prestadores preparados para atenderlos.",
  },
  {
    question: "¿Cómo puedo publicar mi servicio?",
    answer: "Durante el piloto puedes solicitar información por WhatsApp. El equipo revisará contigo los datos operativos necesarios antes de publicar el servicio.",
  },
];

function BrandText({ children }) {
  return children.split(/(Somos Servicios|Servicios)/g).map((part, index) => (
    part === "Servicios" || part === "Somos Servicios"
      ? <strong key={`${part}-${index}`}>{part}</strong>
      : part
  ));
}

export const metadata = {
  title: "Preguntas frecuentes",
  description: "Respuestas sobre cómo buscar, comparar y contactar prestadores locales en Servicios.",
  alternates: { canonical: absoluteUrl("/preguntas-frecuentes") },
  openGraph: {
    title: "Preguntas frecuentes | Servicios",
    description: "Conoce cómo funciona Servicios y cómo contactar prestadores locales.",
    url: absoluteUrl("/preguntas-frecuentes"),
    images: [siteConfig.assets.socialImage],
  },
};

export default function FrequentlyAskedQuestionsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map(({ question, answer }) => ({
      "@type": "Question",
      name: question,
      acceptedAnswer: {
        "@type": "Answer",
        text: answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replaceAll("<", "\\u003c") }}
      />
      <LegalPageLayout title="Preguntas frecuentes" eyebrow="Conoce Servicios" showUpdatedAt={false}>
        <p>Encuentra respuestas rápidas sobre el funcionamiento de la plataforma, la disponibilidad y el contacto con prestadores.</p>

      <div className="mt-7 space-y-3">
        {questions.map(({ question, answer }, index) => (
          <details key={question} className="group rounded-2xl border border-slate-200 bg-slate-50 open:border-[color:color-mix(in_srgb,var(--brand-blue)_22%,white)] open:bg-[color:color-mix(in_srgb,var(--brand-blue)_4%,white)]">
            <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-4 py-4 font-semibold text-[var(--brand-navy)] marker:content-none">
              <span><BrandText>{question}</BrandText></span>
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-white text-[var(--brand-blue)] shadow-sm transition group-open:rotate-45" aria-hidden="true">+</span>
            </summary>
            <p className="px-4 pb-4 pr-12"><BrandText>{answer}</BrandText></p>
            {index === questions.length - 1 ? (
              <a href={pilotWhatsappUrl()} target="_blank" rel="noreferrer" className="brand-primary-action mx-4 mb-4 inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-bold shadow-sm">
                Quiero publicar mi servicio
              </a>
            ) : null}
          </details>
        ))}
      </div>

        <div className="mt-8 rounded-2xl bg-slate-50 p-4 text-center">
          <p>¿Quieres regresar a consultar los servicios disponibles?</p>
          <Link href="/tonala" className="mt-2 inline-flex min-h-11 items-center rounded-xl px-4">Volver a <strong className="mx-1">Servicios</strong> en Tonalá</Link>
        </div>
      </LegalPageLayout>
    </>
  );
}
