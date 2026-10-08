"use client";

import Image from "next/image";
import { Bike, Cctv, Droplet, Ellipsis, Package, Plug, Snowflake, Sparkles, Wrench } from "lucide-react";
import { useState } from "react";

const icons = { bike: Bike, cctv: Cctv, droplet: Droplet, ellipsis: Ellipsis, package: Package, plug: Plug, snowflake: Snowflake, sparkles: Sparkles, wrench: Wrench };

export default function ServiceLogo({ logoUrl, serviceName, available, categoryIcon = "bike" }) {
  const [failed, setFailed] = useState(false);
  const FallbackIcon = icons[categoryIcon] ?? Ellipsis;

  return (
    <div className={`relative grid aspect-square size-[4.15rem] shrink-0 place-items-center overflow-hidden rounded-2xl border border-slate-200 ${available ? "bg-slate-950" : "bg-slate-300"}`}>
      {logoUrl && !failed ? (
        <Image
          src={logoUrl}
          alt={`Logo de ${serviceName}`}
          fill
          sizes="67px"
          className="bg-white object-cover"
          onError={() => setFailed(true)}
        />
      ) : (
        <FallbackIcon className="text-white" aria-hidden="true" size={33} strokeWidth={2.2} />
      )}
    </div>
  );
}
