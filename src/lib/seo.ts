import { useEffect } from "react";

/**
 * Client-side page metadata. This is a static SPA, so tags are set at
 * runtime — enough for browsers, share sheets and the crawlers that execute
 * JS. If MotoMatch ever needs full crawler coverage, prerendering can be
 * added without changing call sites.
 */
export function usePageMeta(opts: {
  title: string;
  description?: string;
  image?: string;
}) {
  useEffect(() => {
    document.title = opts.title;

    const ensure = (attr: "name" | "property", key: string, content: string) => {
      let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (opts.description) {
      ensure("name", "description", opts.description);
      ensure("property", "og:description", opts.description);
    }
    ensure("property", "og:title", opts.title);
    ensure("property", "og:type", "website");
    ensure("property", "og:url", window.location.href);
    if (opts.image) {
      ensure("property", "og:image", new URL(opts.image, window.location.origin).href);
    }
  }, [opts.title, opts.description, opts.image]);
}
