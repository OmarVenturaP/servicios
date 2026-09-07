import Image from "next/image";
import Link from "next/link";

export default function BrandMark({ href = "/", inverse = false, compact = false, className = "" }) {
  const content = (
    <Image
      src={inverse ? "/brand/logo-blanco.png" : "/brand/logo-horizontal.png"}
      alt=""
      width={600}
      height={180}
      priority={compact}
      className={compact ? "h-8 w-auto" : "h-10 w-auto"}
    />
  );

  if (!href) return <div className={`inline-flex items-center ${className}`} role="img" aria-label="Servicios">{content}</div>;

  if (href.startsWith("#")) {
    return (
      <a href={href} className={`inline-flex items-center rounded-lg ${className}`} aria-label="Servicios, ir al inicio">
        {content}
      </a>
    );
  }

  return (
    <Link href={href} className={`inline-flex items-center rounded-lg ${className}`} aria-label="Servicios, ir al inicio">
      {content}
    </Link>
  );
}
