import {
  EyeIcon,
  FolderCodeIcon,
  ForbiddenCircleIcon,
  KeyMinimalisticIcon,
  LoginIcon,
  RankingIcon,
  ShieldCheckIcon,
  UploadMinimalisticIcon,
  UserBlockIcon,
} from "@solar-icons/react/linear";
import { AGENT_SOURCE_LABELS, AGENT_SOURCES, TIERS } from "@tokenaires/contracts";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { SourceIcon } from "@/components/brand/source-icon";
import { TierBadge } from "@/components/brand/tier-badge";
import { InstallCommand } from "@/components/home/install-command";
import { TerminalDemo } from "@/components/home/terminal-demo";
import { formatCompact } from "@/lib/format";
import { cn } from "@/lib/utils";
import { HONEST, RANKING, READ, SENT, SIGN_IN } from "./content";

type Icon = typeof LoginIcon;

export const metadata: Metadata = {
  title: "How it works",
  description: "What the Tokenaires CLI reads, what it uploads, and how the list stays honest.",
};

const CHECK_ICONS: Record<(typeof HONEST.checks)[number]["key"], Icon> = {
  owner: UserBlockIcon,
  signed: KeyMinimalisticIcon,
  refused: ForbiddenCircleIcon,
  review: EyeIcon,
};

function Cell({ icon: CellIcon, title, className, children }: { icon: Icon; title: string; className?: string; children: ReactNode }) {
  return (
    <li className={cn("panel flex flex-col p-5 sm:p-6", className)}>
      <div className="flex items-center gap-3">
        <span className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-soft text-accent-text">
          <CellIcon className="size-[18px]" aria-hidden="true" />
        </span>
        <h2 className="text-base font-medium tracking-[-0.02em]">{title}</h2>
      </div>
      <div className="mt-4 flex flex-1 flex-col gap-2 text-sm leading-relaxed text-t3">{children}</div>
    </li>
  );
}

function Points({ points }: { points: readonly string[] }) {
  return (
    <ul className="flex flex-col gap-2">
      {points.map((point) => (
        <li key={point}>{point}</li>
      ))}
    </ul>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="page max-w-5xl pt-14 sm:pt-20">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-fade text-[40px] font-[350] leading-[1.02] tracking-[-0.045em] sm:text-[60px]">How it works</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-t3">
          One command signs you in with GitHub, reads the usage logs your agents already keep, and sends token counts. Nothing else.
        </p>
        <InstallCommand className="mt-7" />
        <TerminalDemo className="mt-10 w-full max-w-2xl" />
      </div>
      <ul className="mt-14 grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
        <Cell icon={LoginIcon} title={SIGN_IN.title} className="lg:col-span-2">
          <Points points={SIGN_IN.points} />
        </Cell>
        <Cell icon={FolderCodeIcon} title={READ.title} className="lg:col-span-4">
          <p>{READ.lead}</p>
          <ul className="my-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3" aria-label="Supported tools">
            {AGENT_SOURCES.map((source) => (
              <li key={source} className="flex items-center gap-2 rounded-lg bg-foreground/[0.04] px-2.5 py-1.5 text-[13px] text-t2">
                <SourceIcon source={source} className="size-4" />
                <span className="truncate">{AGENT_SOURCE_LABELS[source]}</span>
              </li>
            ))}
          </ul>
          <p className="mt-auto">{READ.note}</p>
        </Cell>
        <Cell icon={UploadMinimalisticIcon} title={SENT.title} className="lg:col-span-3">
          <Points points={SENT.points} />
          <p className="mt-auto pt-2">
            <code className="rounded-md bg-foreground/[0.06] px-1.5 py-0.5 font-mono text-[12.5px] text-foreground">{SENT.scan}</code>{" "}
            {SENT.scanNote}
          </p>
        </Cell>
        <Cell icon={RankingIcon} title={RANKING.title} className="lg:col-span-3">
          <Points points={RANKING.points} />
          <ul className="mt-auto flex flex-wrap gap-1.5 pt-2" aria-label="Tiers">
            {TIERS.filter((tier) => tier.min > 0).map((tier) => (
              <li key={tier.id} className="flex items-center gap-1.5">
                <TierBadge tier={tier.id} />
                <span className="text-xs text-t4 tabular">{formatCompact(tier.min)}</span>
              </li>
            ))}
          </ul>
        </Cell>
        <Cell icon={ShieldCheckIcon} title={HONEST.title} className="sm:col-span-2 lg:col-span-6">
          <p>{HONEST.lead}</p>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {HONEST.checks.map((check) => {
              const CheckIcon = CHECK_ICONS[check.key];
              return (
                <li key={check.key} className="rounded-xl bg-foreground/[0.03] p-4">
                  <CheckIcon className="size-[18px] text-accent-text" aria-hidden="true" />
                  <h3 className="mt-3 text-[13px] font-medium text-foreground">{check.title}</h3>
                  <p className="mt-1 text-[13px] leading-relaxed text-t3">{check.text}</p>
                </li>
              );
            })}
          </ul>
        </Cell>
      </ul>
    </div>
  );
}
