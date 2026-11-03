import Image from "next/image";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

interface AvatarProps {
  src: string | null;
  name: string;
  size: number;
  className?: string;
  priority?: boolean;
}

export function Avatar({ src, name, size, className, priority }: AvatarProps) {
  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-panel-raised ring-1 ring-line",
        className,
      )}
      style={{ width: size, height: size }}
    >
      {src ? (
        <Image src={src} alt="" width={size} height={size} priority={priority} className="size-full object-cover" />
      ) : (
        <span className="text-[11px] font-semibold text-t3" aria-hidden="true">
          {initials(name)}
        </span>
      )}
    </span>
  );
}
