"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense } from "react";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Rich list" },
  { href: "/how-it-works", label: "How it works" },
] as const;

function NavLinks({ pathname }: { pathname: string | null }) {
  return (
    <nav aria-label="Main" className="inline-flex items-center gap-0.5 rounded-full border border-line bg-panel p-1">
      {LINKS.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "touch-target inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium text-t3 transition-colors duration-150 hover:text-foreground",
              active && "bg-foreground/[0.08] text-foreground",
            )}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}

function NavWithPath() {
  return <NavLinks pathname={usePathname()} />;
}

export function SiteNav() {
  return (
    <Suspense fallback={<NavLinks pathname={null} />}>
      <NavWithPath />
    </Suspense>
  );
}
