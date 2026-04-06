import Image from "next/image";
import Link from "next/link";

type Props = {
  href?: string;
  /** Altura visual em px (largura segue proporção) */
  heightClass?: string;
  className?: string;
};

export function SiteLogo({ href = "/", heightClass = "h-9 md:h-11", className = "" }: Props) {
  const img = (
    <Image
      src="/logo_rifa.jpeg"
      alt="Descubra na Rua"
      width={220}
      height={80}
      className={`w-auto object-contain object-left ${heightClass} ${className}`}
      priority
    />
  );
  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0 items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 rounded-sm">
        {img}
      </Link>
    );
  }
  return <span className="inline-flex shrink-0 items-center">{img}</span>;
}
