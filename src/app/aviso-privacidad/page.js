import LegalPageLayout from "@/components/LegalPageLayout";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata = {
  title: "Aviso de Privacidad",
  description: "Información sobre el tratamiento de datos en la plataforma Servicios.",
  alternates: { canonical: absoluteUrl("/aviso-privacidad") },
  openGraph: {
    title: "Aviso de Privacidad | Servicios",
    description: "Información sobre el tratamiento de datos en la plataforma Servicios.",
    url: absoluteUrl("/aviso-privacidad"),
    images: [siteConfig.assets.socialImage],
  },
};

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Aviso de Privacidad">
      <h2>1. Responsable</h2>
      <p><strong>Servicios</strong> opera la plataforma disponible en <a href={siteConfig.url}>{siteConfig.url}</a>. El producto fue desarrollado por <a href={siteConfig.creator.url} target="_blank" rel="noreferrer">{siteConfig.creator.name}</a>. El representante legal de la plataforma todavía no ha sido definido y su identificación se incorporará cuando corresponda, sin atribuir una razón social inexistente.</p>

      <h2>2. Datos que podemos tratar</h2>
      <p>De los prestadores pueden tratarse el nombre del servicio, teléfono, WhatsApp, descripción, cobertura, precio base, disponibilidad, logotipo y datos operativos de sus unidades.</p>
      <p className="mt-3">Actualmente, los usuarios que buscan servicios no necesitan crear una cuenta. Durante el uso pueden generarse un identificador anónimo, eventos de visita, exposición e interacción con servicios, búsquedas de categorías, cambios de orden, intentos de contacto, el canal seleccionado, la posición del resultado y el precio mostrado. También pueden conservarse el sitio de referencia y parámetros de campaña UTM incluidos en el enlace.</p>

      <h2>3. Datos que actualmente no solicitamos</h2>
      <p>La versión actual no solicita al cliente ubicación GPS, tarjeta bancaria, contraseña, documentos oficiales, pagos ni ubicación en tiempo real.</p>

      <h2>4. Finalidades</h2>
      <p>La información puede utilizarse para mostrar servicios disponibles, facilitar el contacto, operar la disponibilidad, administrar unidades, mostrar precios, mejorar el funcionamiento del producto, generar estadísticas agregadas, prevenir abuso y brindar soporte al piloto.</p>

      <h2>5. Comunicación con terceros</h2>
      <p>Cuando eliges WhatsApp o llamada, la comunicación ocurre mediante proveedores externos. <strong>Servicios</strong> no controla sus políticas ni el tratamiento que esas plataformas realizan conforme a sus propios términos.</p>

      <h2>6. Cookies</h2>
      <p><strong>Servicios</strong> utiliza una cookie para conservar un identificador aleatorio y anónimo. Este identificador permite relacionar eventos operativos básicos y estimar visitas nuevas o recurrentes, pero no representa por sí mismo una identidad real. Cuando un dispositivo accede legítimamente al panel privado de una unidad, puede guardarse además una señal técnica para separar de forma aproximada el tráfico de proveedores o pruebas del tráfico público. Esta señal no identifica públicamente al repartidor ni modifica su experiencia. No se utiliza fingerprinting avanzado.</p>

      <h2>7. Conservación</h2>
      <p>La información se conservará durante el tiempo necesario para las finalidades operativas, legales o de seguridad aplicables. Los periodos concretos podrán definirse conforme evolucione la operación y sus obligaciones.</p>

      <h2>8. Seguridad</h2>
      <p>Se aplican medidas razonables para proteger la información. Ningún sistema puede garantizar seguridad absoluta, por lo que <strong>Servicios</strong> no realiza esa promesa.</p>

      <h2>9. Derechos del titular</h2>
      <p>Para ejercer derechos relacionados con tus datos personales conforme a la legislación mexicana aplicable, escribe a <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>. Al recibir una solicitud se indicará la información razonablemente necesaria para identificar el dato y atender el caso.</p>

      <h2>10. Cambios al aviso</h2>
      <p>Las modificaciones se publicarán en <a href={absoluteUrl("/aviso-privacidad")}>{absoluteUrl("/aviso-privacidad")}</a>.</p>

      <h2>11. Contacto</h2>
      <p>Para cualquier aclaración o consulta sobre privacidad, escribe a <a href={`mailto:${siteConfig.privacyEmail}`}>{siteConfig.privacyEmail}</a>.</p>
    </LegalPageLayout>
  );
}
