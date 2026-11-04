"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

const QUERY =
  "(hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference) and (forced-colors: none)";

const TEXT_FIELD =
  'input:not([type="checkbox"], [type="radio"], [type="range"], [type="button"], [type="submit"], [type="reset"], [type="color"], [type="file"], [type="image"]), textarea, [contenteditable]:not([contenteditable="false"])';

const INTERACTIVE =
  'a[href], button, summary, label[for], [role="button"], [role="link"], [role="tab"], [role="option"], [role="menuitem"], [role="checkbox"], [role="radio"], [role="switch"], [role="slider"], [data-cursor="pointer"]';

type CursorTarget = "default" | "interactive" | "disabled" | "text";

function targetOf(node: EventTarget | null): CursorTarget {
  if (!(node instanceof Element)) return "default";
  if (node.closest(TEXT_FIELD)) return "text";
  const hit = node.closest(INTERACTIVE);
  if (!hit) return "default";
  return hit.matches(':disabled, [aria-disabled="true"]') ? "disabled" : "interactive";
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(QUERY);
  media.addEventListener("change", onChange);
  return () => media.removeEventListener("change", onChange);
}

const getSnapshot = () => window.matchMedia(QUERY).matches;
const getServerSnapshot = () => false;

export function CustomCursor() {
  const enabled = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return enabled ? <Cursor /> : null;
}

function Cursor() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const html = document.documentElement;
    let visible = false;

    const setVisible = (next: boolean) => {
      if (visible === next) return;
      visible = next;
      root.dataset.visible = String(next);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") {
        setVisible(false);
        return;
      }
      root.style.transform = `translate3d(${event.clientX}px, ${event.clientY}px, 0)`;
      if (!visible) root.dataset.target = targetOf(event.target);
      setVisible(true);
    };

    const onOver = (event: PointerEvent) => {
      if (event.pointerType === "mouse") root.dataset.target = targetOf(event.target);
    };

    const onDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") root.dataset.pressed = "true";
    };

    const release = () => {
      delete root.dataset.pressed;
    };

    const onOut = (event: MouseEvent) => {
      if (!event.relatedTarget) setVisible(false);
    };

    html.classList.add("custom-cursor");
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerover", onOver, { passive: true });
    window.addEventListener("pointerdown", onDown, { passive: true });
    window.addEventListener("pointerup", release, { passive: true });
    window.addEventListener("pointercancel", release, { passive: true });
    window.addEventListener("blur", release);
    document.addEventListener("mouseout", onOut);

    return () => {
      html.classList.remove("custom-cursor");
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerover", onOver);
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
      window.removeEventListener("blur", release);
      document.removeEventListener("mouseout", onOut);
    };
  }, []);

  return (
    <div ref={rootRef} aria-hidden="true" className="custom-cursor-root">
      <svg className="custom-cursor-mark" viewBox="47 66.5 290 251" width="20" height="17.3">
        <path
          d="M47 107.5H205V66.5H337V182.5H241V317.5H145V182.5H47Z"
          vectorEffect="non-scaling-stroke"
          strokeWidth="3"
          strokeLinejoin="round"
          paintOrder="stroke"
        />
      </svg>
    </div>
  );
}
