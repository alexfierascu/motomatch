import { useEffect, useRef, useState } from "react";

/**
 * Motion system.
 *
 * Everything scroll-linked lives here: parallax offsets, reveal-on-scroll and
 * number count-ups. Three rules apply everywhere:
 *   1. rAF-throttled — no layout work outside an animation frame.
 *   2. transform/opacity only — nothing that forces reflow.
 *   3. `prefers-reduced-motion` disables the lot, in JS and in CSS.
 */

export function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Scroll-linked parallax. Attach the ref to an element; it is translated
 * vertically in proportion to its distance from the viewport centre.
 *
 * speed  0     = static
 * speed  0.15  = drifts gently against the scroll (background feel)
 * speed -0.1   = moves with the scroll slightly faster (foreground feel)
 */
export function useParallax<T extends HTMLElement>(speed: number, maxPx = 120) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || speed === 0 || prefersReducedMotion()) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      // -1 when the element centre is a viewport below centre, +1 above.
      const progress = (vh / 2 - (rect.top + rect.height / 2)) / vh;
      const offset = Math.max(-maxPx, Math.min(maxPx, progress * speed * vh));
      el.style.transform = `translate3d(0, ${offset.toFixed(1)}px, 0)`;
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
      el.style.transform = "";
    };
  }, [speed, maxPx]);

  return ref;
}

/**
 * Reveal-on-scroll. Attach to a container that has the `.reveal` class (or
 * whose children do, with `selector`). Adds `.is-visible` once, when it enters
 * the viewport. With reduced motion the class is added immediately.
 */
export function useReveal<T extends HTMLElement>(selector?: string) {
  const ref = useRef<T | null>(null);

  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const targets: Element[] = selector ? Array.from(root.querySelectorAll(selector)) : [root];
    if (targets.length === 0) return;

    if (prefersReducedMotion() || typeof IntersectionObserver === "undefined") {
      targets.forEach((t) => t.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-visible");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
    );
    targets.forEach((t) => io.observe(t));
    return () => io.disconnect();
  }, [selector]);

  return ref;
}

/**
 * Count a number up from 0 when the element scrolls into view.
 * Returns [ref, displayValue]. Reduced motion jumps straight to the target.
 */
export function useCountUp<T extends HTMLElement>(target: number, durationMs = 900, decimals = 0) {
  const ref = useRef<T | null>(null);
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const run = () => {
      if (started.current) return;
      started.current = true;
      if (prefersReducedMotion()) {
        setValue(target);
        return;
      }
      const t0 = performance.now();
      const tick = (t: number) => {
        const p = Math.min(1, (t - t0) / durationMs);
        const eased = 1 - Math.pow(1 - p, 3);
        setValue(Number((target * eased).toFixed(decimals)));
        if (p < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };

    if (typeof IntersectionObserver === "undefined") {
      run();
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          run();
          io.disconnect();
        }
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [target, durationMs, decimals]);

  return [ref, value] as const;
}

/** 0–1 scroll progress of the whole document, rAF-throttled. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? Math.min(1, window.scrollY / max) : 0);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return progress;
}
