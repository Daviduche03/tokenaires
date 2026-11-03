import Image from "next/image";
import { BRAND } from "@/lib/constants";
import { cn } from "@/lib/utils";

export function LogoMark({ size = 22, className }: { size?: number; className?: string }) {
  return (
    <span
      className={cn(
        "inline-grid shrink-0 place-items-center rounded-[7px] bg-[hsl(240_10%_6%)] dark:bg-transparent",
        className,
      )}
      style={{ width: size + 4, height: size + 4 }}
    >
      <Image src={BRAND.markSrc} alt="" width={size} height={size} priority unoptimized />
    </span>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[16px] font-[650] tracking-[-0.03em]", className)}>
      <LogoMark />
      tokenaires
    </span>
  );
}
