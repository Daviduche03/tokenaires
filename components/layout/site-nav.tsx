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
              "group touch-target inline-flex h-8 items-center rounded-full px-3.5 text-[13px] font-medium text-t3 transition-colors duration-150 hover:text-foreground",
              active && "bg-foreground/[0.08] text-foreground",
            )}
          >
            <span className="relative block h-[1.25em] overflow-hidden leading-[1.25em]">
              <span className="block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                {link.label}
              </span>
              <span aria-hidden="true" className="absolute inset-x-0 top-full block transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-full">
                {link.label}
              </span>
            </span>
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
