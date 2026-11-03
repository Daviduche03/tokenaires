"use client";

import { useEffect, useRef } from "react";

export function HeroBackdrop() {
  const lit = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const layer = lit.current;
    const section = layer?.parentElement;
    if (!layer || !section || !window.matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    const move = (event: PointerEvent) => {
      const bounds = section.getBoundingClientRect();
      layer.style.setProperty("--mx", `${event.clientX - bounds.left}px`);
      layer.style.setProperty("--my", `${event.clientY - bounds.top}px`);
      layer.style.opacity = "1";
    };
    const leave = () => {
      layer.style.opacity = "0";
    };
    section.addEventListener("pointermove", move);
    section.addEventListener("pointerleave", leave);
    return () => {
      section.removeEventListener("pointermove", move);
      section.removeEventListener("pointerleave", leave);
    };
  }, []);
  return (
    <>
      <div className="dot-field" aria-hidden="true" />
      <div ref={lit} className="dot-field-lit" aria-hidden="true" />
    </>
  );
}
