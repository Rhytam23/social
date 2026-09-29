'use client';

import { useEffect } from 'react';

/**
 * Scroll reveal for the public pages, as progressive enhancement. The page is fully visible without
 * JavaScript. Once this mounts it marks the document (`js-reveal`) so elements with the `reveal` class start
 * slightly lowered and transparent, then fades each one in as it scrolls into view. Nothing here runs for
 * people who ask for reduced motion (the CSS also turns the effect off).
 */
export function RevealObserver() {
  useEffect(() => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const items = Array.from(document.querySelectorAll<HTMLElement>('.reveal'));
    if (reduce || items.length === 0 || !('IntersectionObserver' in window)) return;

    document.documentElement.classList.add('js-reveal');
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            io.unobserve(entry.target);
          }
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.08 }
    );
    items.forEach((el) => io.observe(el));

    return () => {
      io.disconnect();
      document.documentElement.classList.remove('js-reveal');
    };
  }, []);

  return null;
}
