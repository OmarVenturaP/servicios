"use client";

import Image from "next/image";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { AD_INTERVAL_MS } from "@/domain/advertisements";
import { adIndexForSlot, adSlotForIndex, canonicalAdSlot } from "@/domain/advertisement-carousel";

export default function AdvertisementCarousel({ ads = [] }) {
  const [index, setIndex] = useState(0);
  const viewportRef = useRef(null);
  const indexRef = useRef(0);
  const gestureRef = useRef({ x: 0, y: 0, dragged: false });
  const [paused, setPaused] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(true);
  const [failed, setFailed] = useState([]);
  const visibleAds = ads.filter((ad) => !failed.includes(ad.id));
  const count = visibleAds.length;
  const current = index % Math.max(count, 1);
  const slides = count > 1
    ? [{ ad: visibleAds[count - 1], clone: true }, ...visibleAds.map((ad) => ({ ad, clone: false })), { ad: visibleAds[0], clone: true }]
    : visibleAds.map((ad) => ({ ad, clone: false }));

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const updateMotion = () => setReducedMotion(media.matches);
    const updateVisibility = () => setHidden(document.hidden);
    updateMotion();
    updateVisibility();
    media.addEventListener("change", updateMotion);
    document.addEventListener("visibilitychange", updateVisibility);
    return () => { media.removeEventListener("change", updateMotion); document.removeEventListener("visibilitychange", updateVisibility); };
  }, []);

  const goToAd = useCallback((position) => {
    const viewport = viewportRef.current;
    if (!viewport || !visibleAds.length) return;
    const slot = adSlotForIndex(position, visibleAds.length);
    const next = adIndexForSlot(slot, visibleAds.length);
    indexRef.current = next;
    setIndex(next);
    viewport.scrollTo({ left: viewport.clientWidth * slot, behavior: reducedMotion ? "instant" : "smooth" });
  }, [visibleAds.length, reducedMotion]);

  useLayoutEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const align = () => {
      const next = Math.min(indexRef.current, Math.max(visibleAds.length - 1, 0));
      viewport.scrollTo({ left: viewport.clientWidth * adSlotForIndex(next, visibleAds.length), behavior: "instant" });
    };
    align();
    const observer = new ResizeObserver(align);
    observer.observe(viewport);
    return () => observer.disconnect();
  }, [visibleAds.length]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport || count < 2) return;
    let timer;
    function settle() {
      window.clearTimeout(timer);
      if (!viewport.clientWidth) return;
      const slot = Math.round(viewport.scrollLeft / viewport.clientWidth);
      const canonical = canonicalAdSlot(slot, count);
      // Wait for snapping to finish; never interrupt an in-progress swipe.
      if (canonical !== slot && Math.abs(viewport.scrollLeft - slot * viewport.clientWidth) < 1) {
        viewport.scrollTo({ left: canonical * viewport.clientWidth, behavior: "instant" });
      }
    }
    function scheduleSettle() {
      window.clearTimeout(timer);
      timer = window.setTimeout(settle, 180);
    }
    viewport.addEventListener("scrollend", settle);
    viewport.addEventListener("scroll", scheduleSettle, { passive: true });
    return () => {
      window.clearTimeout(timer);
      viewport.removeEventListener("scrollend", settle);
      viewport.removeEventListener("scroll", scheduleSettle);
    };
  }, [count]);

  useEffect(() => {
    if (visibleAds.length < 2 || paused || hidden || reducedMotion) return;
    const timer = window.setInterval(() => goToAd(indexRef.current + 1), AD_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [visibleAds.length, paused, hidden, reducedMotion, goToAd]);

  function syncScroll() {
    const viewport = viewportRef.current;
    if (!viewport?.clientWidth) return;
    const next = adIndexForSlot(Math.round(viewport.scrollLeft / viewport.clientWidth), visibleAds.length);
    indexRef.current = next;
    setIndex(next);
  }

  if (!visibleAds.length) return null;

  return (
    <section aria-label="Publicidad local" aria-roledescription="carrusel" className="mb-0">
      <div ref={viewportRef} tabIndex={0} aria-label="Anuncios: desliza horizontalmente o usa las flechas izquierda y derecha"
        onScroll={syncScroll}
        onKeyDown={(event) => {
          if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
          event.preventDefault();
          goToAd(indexRef.current + (event.key === "ArrowRight" ? 1 : -1));
        }}
        onPointerDown={(event) => { gestureRef.current = { x: event.clientX, y: event.clientY, dragged: false }; }}
        onPointerMove={(event) => {
          if (event.buttons || event.pointerType === "touch") {
            const gesture = gestureRef.current;
            if (Math.abs(event.clientX - gesture.x) > 8 || Math.abs(event.clientY - gesture.y) > 8) gesture.dragged = true;
          }
        }}
        onPointerCancel={() => { gestureRef.current.dragged = true; }}
        onClickCapture={(event) => { if (gestureRef.current.dragged) { if (event.detail !== 0) event.preventDefault(); gestureRef.current.dragged = false; } }}
        className="flex aspect-[5/1] snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-xl bg-white ring-1 ring-slate-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slides.map(({ ad, clone }, position) => <a key={`${ad.id}-${position}`} href={ad.destinationUrl} target="_blank" rel="sponsored noopener noreferrer"
          aria-label={`${ad.title}. Abre en otra pestaña.`} aria-hidden={clone || undefined} tabIndex={!clone && adIndexForSlot(position, count) === current ? 0 : -1} draggable={false}
          className="relative block h-full w-full shrink-0 snap-start">
          <Image src={ad.imageUrl} alt={ad.title} draggable={false} fill sizes="(max-width: 430px) calc(100vw - 40px), 390px" className="object-contain" onError={() => setFailed((values) => values.includes(ad.id) ? values : [...values, ad.id])} />
        </a>)}
      </div>
      <div className="grid h-6 grid-cols-[1fr_auto_1fr] items-center">
        <span className="text-[0.6rem] text-slate-500">Publicidad</span>
        <div className="flex justify-center" role="group" aria-label="Seleccionar anuncio">
          {visibleAds.length > 1 ? visibleAds.map((ad, position) => <button key={ad.id} type="button" aria-label={`Ver anuncio ${position + 1}: ${ad.title}`} aria-pressed={position === current}
            onClick={() => goToAd(position)} className="grid size-6 place-items-center rounded-full">
            <span className={`size-1 rounded-full ${position === current ? "bg-[var(--brand-blue)]" : "bg-slate-300"}`} />
          </button>) : null}
        </div>
        {visibleAds.length > 1 && !reducedMotion ? <button type="button" className="grid size-6 place-items-center justify-self-end rounded-md text-slate-600" onClick={() => setPaused((value) => !value)} aria-label={paused ? "Reanudar anuncios" : "Pausar anuncios"} title={paused ? "Reanudar anuncios" : "Pausar anuncios"}>{paused ? <Play size={12} aria-hidden="true" /> : <Pause size={12} aria-hidden="true" />}</button> : <span />}
      </div>
    </section>
  );
}
