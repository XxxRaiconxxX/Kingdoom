import type { RefObject } from "react";
import { useGSAP } from "@gsap/react";
import { gsap } from "gsap";

gsap.registerPlugin(useGSAP);

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
  useGSAP(
    () => {
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      const targets = gsap.utils.toArray<HTMLElement>(
        selector,
        containerRef.current ?? undefined
      );

      if (targets.length === 0) {
        return;
      }

      gsap.set(targets, {
        autoAlpha: 0,
        y,
        willChange: "transform,opacity",
      });

      const tween = gsap.to(targets, {
        autoAlpha: 1,
        y: 0,
        duration,
        delay,
        stagger,
        ease,
        overwrite: "auto",
        clearProps: "opacity,visibility,transform,will-change",
      });

      return () => {
        tween.kill();
      };
    },
    {
      scope: containerRef,
      dependencies: [...dependencies],
    }
  );
}
