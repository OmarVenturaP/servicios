import { Landmark, Menu } from "lucide-react";

export default function Header({ cityName }) {
  return (
    <header className="relative z-10 flex h-[4.6rem] items-center justify-between px-5">
      <a href="#inicio" className="flex items-center gap-2.5" aria-label="Ir al inicio">
        <Landmark className="text-emerald-500" aria-hidden="true" size={36} strokeWidth={1.9} />
        <span className="text-[1.2rem] font-black leading-[0.88] tracking-[-0.04em] text-[#101a5c]">
          <span className="block">Servicios</span>
          <span className="block">{cityName}</span>
        </span>
      </a>
      <button
        type="button"
        className="grid size-10 place-items-center rounded-xl text-[#101a5c]"
        aria-label="Menú disponible próximamente"
        disabled
      >
        <Menu aria-hidden="true" size={25} strokeWidth={2.3} />
      </button>
    </header>
  );
}
