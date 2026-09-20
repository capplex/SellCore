"use client";

import { useEffect, useRef } from "react";

export function InteractiveHeroBackground() {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root || window.matchMedia("(pointer: coarse)").matches) return;

    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const bounds = root.getBoundingClientRect();
        root.style.setProperty("--hero-pointer-x", `${event.clientX - bounds.left}px`);
        root.style.setProperty("--hero-pointer-y", `${event.clientY - bounds.top}px`);
      });
    };

    window.addEventListener("pointermove", move, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
    };
  }, []);

  return <div ref={rootRef} aria-hidden="true" className="hero-ambient pointer-events-none absolute inset-0 overflow-hidden">
    <div className="hero-ambient-orb hero-ambient-orb-one"/>
    <div className="hero-ambient-orb hero-ambient-orb-two"/>
    <div className="hero-pointer-light absolute inset-0"/>
    <div className="hero-grid absolute inset-0"/>
    <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-[#050505] to-transparent"/>
  </div>;
}
