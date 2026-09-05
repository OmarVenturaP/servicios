"use client";

import Image from "next/image";
import { Bike } from "lucide-react";
import { useState } from "react";

export default function ServiceLogo({ logoUrl, serviceName, available }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className={`relative grid size-[4.15rem] shrink-0 place-items-center overflow-hidden rounded-full ${available ? "bg-slate-950" : "bg-slate-300"}`}>
      {logoUrl && !failed ? (
        <Image
          src={logoUrl}
          alt={`Logo de ${serviceName}`}
          fill
          sizes="67px"
          className="bg-white object-contain p-1.5"
          onError={() => setFailed(true)}
        />
      ) : (
        <Bike className="text-white" aria-hidden="true" size={33} strokeWidth={2.2} />
      )}
    </div>
  );
}
