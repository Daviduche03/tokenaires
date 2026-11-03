import type { Metadata } from "next";
import { InstallCommand } from "@/components/home/install-command";
import { HOW_IT_WORKS } from "./content";

export const metadata: Metadata = {
  title: "How it works",
  description: "What the Tokenaires CLI reads, what it uploads, and how the list stays honest.",
};

export default function HowItWorksPage() {
  return (
    <div className="page max-w-3xl pt-14 sm:pt-20">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-fade text-[40px] font-[350] leading-[1.02] tracking-[-0.045em] sm:text-[60px]">How it works</h1>
        <p className="mt-4 max-w-md text-[15px] leading-relaxed text-t3">
          One command signs you in with GitHub, reads the usage logs your agents already keep, and sends token counts. Nothing else.
        </p>
        <InstallCommand className="mt-7" />
      </div>
      <ol className="mt-14 grid gap-3 sm:grid-cols-2">
        {HOW_IT_WORKS.map((section, index) => (
          <li key={section.title} className="panel p-5 sm:p-6">
            <span className="inline-flex size-7 items-center justify-center rounded-full bg-accent-soft text-xs font-semibold text-accent-text tabular">
              {index + 1}
            </span>
            <h2 className="mt-4 text-base font-medium tracking-[-0.02em]">{section.title}</h2>
            <ul className="mt-3 flex flex-col gap-2 text-sm leading-relaxed text-t3">
              {section.points.map((point) => (
                <li key={point}>{point}</li>
              ))}
            </ul>
          </li>
        ))}
      </ol>
    </div>
  );
}
