"use client";

import * as TabsPrimitive from "@radix-ui/react-tabs";
import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";

interface SegmentedTabsProps<T extends string> {
  value: T;
  onValueChange: (value: T) => void;
  options: ReadonlyArray<{ value: T; label: string }>;
  "aria-label": string;
  className?: string;
}

export function SegmentedTabs<T extends string>({ value, onValueChange, options, className, ...props }: SegmentedTabsProps<T>) {
  const id = useId();
  return (
    <TabsPrimitive.Root
      value={value}
      onValueChange={(next) => {
        const match = options.find((option) => option.value === next);
        if (match) onValueChange(match.value);
      }}
    >
      <TabsPrimitive.List
        aria-label={props["aria-label"]}
        className={cn("inline-flex items-center gap-0.5 rounded-full border border-line bg-panel p-1", className)}
      >
        {options.map((option) => (
          <TabsPrimitive.Trigger
            key={option.value}
            value={option.value}
            className="touch-target relative h-8 rounded-full px-3.5 text-[13px] font-medium text-t3 transition-colors duration-150 hover:text-t2 data-[state=active]:text-foreground"
          >
            {option.value === value && (
              <motion.span
                layoutId={`${id}-pill`}
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
                className="absolute inset-0 rounded-full bg-foreground/[0.08]"
              />
            )}
            <span className="relative">{option.label}</span>
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
    </TabsPrimitive.Root>
  );
}
