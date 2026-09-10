"use client";

import { useState } from "react";
import { MessageCircle, Phone } from "lucide-react";
import { browserAttribution, sendAnalyticsEvent } from "@/lib/analytics-client";

const channels = {
  whatsapp: {
    label: "WhatsApp",
    Icon: MessageCircle,
    className: "bg-emerald-700 hover:bg-emerald-800",
  },
  llamada: {
    label: "Llamar",
    Icon: Phone,
    className: "bg-[var(--brand-blue)] hover:brightness-95",
  },
};

export default function ContactButtons({ citySlug, serviceSlug, priceShown, resultPosition, disabled }) {
  const [pendingChannel, setPendingChannel] = useState(null);
  const [error, setError] = useState("");

  async function startContact(channel) {
    setPendingChannel(channel);
    setError("");
    sendAnalyticsEvent({ citySlug, serviceSlug, event: "service_interaction", resultPosition, value: channel });

    try {
      const response = await fetch("/api/contactos", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ citySlug, serviceSlug, channel, priceShown, resultPosition, attribution: browserAttribution() }),
      });
      const result = await response.json();

      if (!response.ok || !result.url) {
        throw new Error(result.error || "No se pudo iniciar el contacto");
      }

      const allowedUrl = channel === "whatsapp"
        ? result.url.startsWith("https://wa.me/")
        : result.url.startsWith("tel:");

      if (!allowedUrl) {
        throw new Error("El destino de contacto no es válido");
      }

      setPendingChannel(null);
      window.location.assign(result.url);
    } catch (contactError) {
      setError(contactError.message);
      setPendingChannel(null);
    }
  }

  return (
    <div className="mt-2.5 border-t border-slate-100 pt-2.5">
      <div className="grid grid-cols-2 gap-2">
        {Object.entries(channels).map(([channel, { label, Icon, className }]) => (
          <button
            key={channel}
            type="button"
            disabled={disabled || pendingChannel !== null}
            onClick={() => startContact(channel)}
            className={`flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-3 text-xs font-extrabold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:bg-slate-300 ${className}`}
          >
            <Icon aria-hidden="true" size={16} strokeWidth={2.3} />
            {pendingChannel === channel ? "Abriendo..." : label}
          </button>
        ))}
      </div>
      {error ? <p className="mt-2 text-xs font-semibold text-red-600" role="alert">{error}</p> : null}
    </div>
  );
}
