import { useLayoutEffect } from "react";
import type { RefObject } from "react";

type GsapRevealOptions = {
  selector: string;
  duration?: number;
  stagger?: number;
  y?: number;
  delay?: number;
  ease?: string;
  dependencies?: ReadonlyArray<unknown>;
};

export function useGsapStaggerReveal(
  containerRef: RefObject<HTMLElement | null>,
  {
    selector,
    duration = 0.56,
    stagger = 0.08,
    y = 16,
    delay = 0,
    ease = "power3.out",
    dependencies = [],
  }: GsapRevealOptions
) {
  useLayoutEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const container = containerRef.current;
    if (!container) {
      return;
    }

    const targets = Array.from(container.querySelectorAll<HTMLElement>(selector));
    const easing = ease === "power3.out" ? "cubic-bezier(0.22, 1, 0.36, 1)" : ease;
    const animations = targets.map((target, index) =>
      target.animate(
        [
          { opacity: 0, transform: `translateY(${y}px)` },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: duration * 1000,
          delay: (delay + stagger * index) * 1000,
          easing,
        }
      )
    );

    return () => {
      animations.forEach((animation) => animation.cancel());
    };
  }, [containerRef, delay, duration, ease, selector, stagger, y, ...dependencies]);
}
