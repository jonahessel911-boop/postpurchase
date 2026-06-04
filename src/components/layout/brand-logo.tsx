import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 32,
  href,
  className,
}: {
  size?: number;
  href?: string;
  className?: string;
}) {
  const logo = (
    <Image
      src="/logo.png"
      alt=""
      width={size}
      height={size}
      className={cn("shrink-0 object-contain", className)}
      priority
    />
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex shrink-0" aria-label="Home">
        {logo}
      </Link>
    );
  }

  return logo;
}

export function PoweredByLogo({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex items-center justify-center gap-1.5 border-t border-border py-1.5",
        className
      )}
    >
      <span className="text-[9px] font-medium uppercase tracking-wider text-zinc-400">
        Powered by
      </span>
      <BrandLogo size={size} />
    </div>
  );
}
