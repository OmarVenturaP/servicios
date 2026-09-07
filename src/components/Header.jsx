import BrandMark from "./BrandMark";

export default function Header({ href = "/" }) {
  return (
    <header className="relative z-10 flex h-[4.6rem] items-center px-5">
      <BrandMark href={href} compact />
    </header>
  );
}
