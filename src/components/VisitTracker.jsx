"use client";

import { useEffect } from "react";
import { browserAttribution } from "@/lib/analytics-client";

const VISIT_WINDOW_MS = 30 * 60 * 1000;

export default function VisitTracker({ citySlug }) {
  useEffect(() => {
    const visitKey = `servicios:visit:${citySlug}:${Math.floor(Date.now() / VISIT_WINDOW_MS)}`;

    try {
      if (sessionStorage.getItem(visitKey)) {
        return;
      }
      sessionStorage.setItem(visitKey, "pending");
    } catch {
      // El servidor también evita duplicados aunque sessionStorage no esté disponible.
    }

    const attribution = browserAttribution();

    fetch("/api/visitas", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ citySlug, attribution }),
      keepalive: true,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("No se pudo registrar la visita");
        }
      })
      .catch(() => {
        try {
          sessionStorage.removeItem(visitKey);
        } catch {
          // La medición no debe impedir usar la landing.
        }
      });
  }, [citySlug]);

  return null;
}
