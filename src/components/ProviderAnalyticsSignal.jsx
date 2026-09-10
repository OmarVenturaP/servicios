"use client";

import { useEffect } from "react";

export default function ProviderAnalyticsSignal({ token }) {
  useEffect(() => {
    fetch("/api/analitica/proveedor", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
      keepalive: true,
    }).catch(() => {});
  }, [token]);
  return null;
}
