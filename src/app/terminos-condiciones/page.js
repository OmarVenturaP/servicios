import LegalPageLayout from "@/components/LegalPageLayout";
import { absoluteUrl, siteConfig } from "@/config/site";

export const metadata = {
  title: "Términos y Condiciones",
  description: "Términos que regulan el uso de la plataforma Servicios.",
  alternates: { canonical: absoluteUrl("/terminos-condiciones") },
  openGraph: {
    title: "Términos y Condiciones | Servicios",
    description: "Términos que regulan el uso de la plataforma Servicios.",
    url: absoluteUrl("/terminos-condiciones"),
    images: [siteConfig.assets.socialImage],
  },
};

export default function TermsPage() {
  return (
    <LegalPageLayout title="Términos y Condiciones">
      <h2>1. Introducción</h2>
      <p><strong>Servicios</strong> es una plataforma digital que facilita el contacto entre personas que buscan determinados servicios y prestadores independientes que los ofrecen. Al acceder o utilizar la plataforma, aceptas utilizarla de manera responsable y conforme a estos términos.</p>

      <h2>2. Naturaleza de la plataforma</h2>
      <p><strong>Servicios</strong> funciona principalmente como un medio para facilitar el contacto entre usuarios y prestadores independientes. No presta directamente los servicios anunciados, no es empleador de los prestadores y no administra la ejecución física de los servicios contratados entre terceros.</p>

      <h2>3. Relación entre usuario y prestador</h2>
      <p>Los acuerdos posteriores al contacto se celebran directamente entre el usuario y el prestador. Esto puede incluir precio final, forma de pago, horario, alcance, ubicación, condiciones particulares y ejecución del servicio. Cada parte es responsable de evaluar y aceptar esas condiciones.</p>

      <h2>4. Precios</h2>
      <p>Los importes mostrados como “Desde $X” son referencias obtenidas de los datos disponibles en la plataforma. El precio final puede variar por distancia, tipo de servicio, características específicas, horario y el acuerdo entre las partes. El precio mostrado no es necesariamente el precio final.</p>

      <h2>5. Disponibilidad</h2>
      <p>Los estados de disponibilidad representan la información registrada por los prestadores. <strong>Servicios</strong> no garantiza que un prestador continúe disponible en el momento exacto del contacto, ya que su disponibilidad puede cambiar.</p>

      <h2>6. Información publicada</h2>
      <p>Los prestadores son responsables de proporcionar información correcta y mantenerla actualizada, incluyendo nombre, teléfono, WhatsApp, descripción, precio base, cobertura, disponibilidad, logotipo y otros datos operativos del servicio.</p>

      <h2>7. Responsabilidad del usuario</h2>
      <p>Cada usuario es responsable de:</p>
      <ul>
        <li>decidir con quién establece contacto y evaluar la información publicada;</li>
        <li>determinar qué información personal comparte;</li>
        <li>verificar las condiciones, el precio y la forma de pago;</li>
        <li>utilizar la plataforma de forma lícita.</li>
      </ul>

      <h2>8. Prestadores independientes</h2>
      <p>Los prestadores publicados operan de manera independiente. Su aparición en <strong>Servicios</strong> no implica automáticamente una relación laboral, sociedad, representación, garantía, certificación profesional ni respaldo absoluto de <strong>Servicios</strong>.</p>

      <h2>9. Comunicación externa</h2>
      <p>El contacto puede realizarse mediante servicios externos como WhatsApp o llamada telefónica. Al salir de <strong>Servicios</strong> para comunicarte por otra plataforma, también pueden aplicar las políticas y condiciones de ese proveedor.</p>

      <h2>10. Limitación de responsabilidad</h2>
      <p><strong>Servicios</strong> busca facilitar el descubrimiento y contacto entre las partes. Sin perjuicio de los derechos reconocidos por la legislación aplicable, no garantiza la calidad, puntualidad, resultado, disponibilidad permanente, cumplimiento de acuerdos privados, seguridad absoluta de una operación entre terceros, precio final ni conducta de cada persona involucrada. Los desacuerdos sobre la ejecución del servicio deberán tratarse principalmente entre quienes celebraron el acuerdo.</p>

      <h2>11. Uso indebido</h2>
      <p>No se permite utilizar <strong>Servicios</strong> para fraude, engaño, suplantación, actividades ilegales, abuso, amenazas, información deliberadamente falsa o acciones destinadas a perjudicar a usuarios, prestadores o a la plataforma.</p>

      <h2>12. Suspensión o eliminación</h2>
      <p><strong>Servicios</strong> podrá limitar, ocultar o retirar información cuando existan motivos razonables relacionados con fraude, abuso, información falsa, uso indebido, seguridad, cumplimiento legal o incumplimiento de las reglas de la plataforma.</p>

      <h2>13. Piloto y posibles costos para prestadores</h2>
      <p>La plataforma operará un piloto durante septiembre de 2026. La participación durante este periodo permitirá evaluar el funcionamiento y los resultados reales del servicio. Al concluir el piloto, <strong>Servicios</strong> podrá establecer un pequeño costo de participación para los prestadores, definido con base en los datos obtenidos y comunicado previamente antes de que resulte aplicable. Ningún cobro posterior se aplicará de manera automática o retroactiva sin informar sus condiciones.</p>

      <h2>14. Modificaciones</h2>
      <p>Estos términos pueden actualizarse cuando sea necesario. La versión vigente se mantendrá publicada en esta misma URL.</p>

      <h2>15. Legislación aplicable</h2>
      <p>La operación de la plataforma está sujeta a la legislación aplicable en México. Esta formulación no establece renuncias de derechos ni una jurisdicción específica que no haya sido revisada profesionalmente.</p>

      <h2>16. Desarrollo y contacto</h2>
      <p><strong>Servicios</strong> es un producto desarrollado por <a href={siteConfig.creator.url} target="_blank" rel="noreferrer">{siteConfig.creator.name}</a>. Su representante legal todavía no ha sido definido.</p>
      <p className="mt-3">Para cualquier aclaración relacionada con estos términos, escribe a <a href={`mailto:${siteConfig.legalEmail}`}>{siteConfig.legalEmail}</a>.</p>
    </LegalPageLayout>
  );
}
