import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import {
  BrowserRouter,
  HashRouter,
  Link,
  NavLink,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import BikeDetail from "./pages/BikeDetail";
import Compare from "./pages/Compare";
import FindMyBike from "./pages/FindMyBike";
import Results from "./pages/Results";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import { getBike } from "./data/motorcycles";
import { useScrollProgress } from "./lib/motion";

/* ─────────────────────────── comparison selection ─────────────────────────*/

export const MAX_COMPARE = 4;

interface CompareCtx {
  selected: string[];
  toggle: (id: string) => void;
  clear: () => void;
  isSelected: (id: string) => boolean;
  full: boolean;
}

const CompareContext = createContext<CompareCtx | null>(null);

export function useCompare(): CompareCtx {
  const ctx = useContext(CompareContext);
  if (!ctx) throw new Error("useCompare must be used inside CompareProvider");
  return ctx;
}

function CompareProvider({ children }: { children: React.ReactNode }) {
  const [selected, setSelected] = useState<string[]>([]);

  const toggle = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length >= MAX_COMPARE
          ? prev
          : [...prev, id],
    );
  }, []);

  const value = useMemo<CompareCtx>(
    () => ({
      selected,
      toggle,
      clear: () => setSelected([]),
      isSelected: (id) => selected.includes(id),
      full: selected.length >= MAX_COMPARE,
    }),
    [selected, toggle],
  );

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>;
}

/* ──────────────────────────────── chrome ──────────────────────────────────*/

const NAV = [
  { to: "/find-my-bike", label: "Find My Bike" },
  { to: "/explore", label: "Explore" },
  { to: "/compare", label: "Compare" },
  { to: "/about", label: "About" },
];

function Wordmark() {
  return (
    <span className="font-display text-[19px] tracking-[0.04em]">
      MOTO<span className="text-accent">MATCH</span>
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { selected } = useCompare();
  const progress = useScrollProgress();
  const location = useLocation();
  const rootRef = useRef<HTMLElement>(null);

  // Mobile menu: close on Escape and on clicks outside the header.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    const onPointer = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    document.addEventListener("touchstart", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
      document.removeEventListener("touchstart", onPointer);
    };
  }, [open]);

  // Per the approved reference the navigation floats transparently over the
  // homepage hero and gains a surface once the user scrolls.
  const overlay = location.pathname === "/" && !scrolled && !open;

  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      setScrolled(window.scrollY > 24);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      ref={rootRef}
      className={`sticky top-0 z-40 transition-colors duration-300 ${
        overlay ? "border-b border-transparent" : "border-b border-line bg-ink/90 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto grid h-14 max-w-[1400px] grid-cols-[1fr_auto] items-center px-4 md:grid-cols-[1fr_auto_1fr] md:px-8">
        <Link to="/" className="flex items-center gap-2.5 justify-self-start" onClick={() => setOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <circle cx="6" cy="16" r="4.4" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
            <circle cx="18" cy="16" r="4.4" fill="none" stroke="var(--color-fg)" strokeWidth="1.8" />
            <path d="M6 16 L11 9 L17 9 L18 16" fill="none" stroke="var(--color-fg)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <Wordmark />
        </Link>

        {/* Centered links, Find My Bike emphasized — per the reference. */}
        <nav className="hidden items-center gap-7 md:flex">
          {NAV.map((n, i) => (
            <NavLink
              key={n.to}
              to={n.to}
              className={({ isActive }) =>
                `data relative py-4 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  isActive || i === 0 ? "text-fg" : "text-dim hover:text-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  {n.to === "/compare" && selected.length > 0 && (
                    <span className="data ml-1.5 rounded bg-accent px-1.5 py-0.5 text-[10px] text-[var(--color-on-accent)]">
                      {selected.length}
                    </span>
                  )}
                  {(isActive || (i === 0 && location.pathname === "/")) && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-accent" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-2.5 justify-self-end">
          {/* Placeholder control from the approved design — accounts don't exist
              yet, and MotoMatch runs without them. Wire up when auth ships. */}
          <button
            type="button"
            aria-disabled="true"
            title="No account needed — MotoMatch runs entirely in your browser"
            className="data hidden cursor-default rounded-full border border-line-bright px-4 py-2 text-[11px] uppercase tracking-[0.16em] text-muted md:block"
          >
            Sign in
          </button>
          {/* Burger only where the desktop navigation is hidden. */}
          <button
            className="flex h-9 w-9 items-center justify-center rounded-full border border-line-bright text-fg transition-colors hover:border-accent md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label="Toggle navigation menu"
          >
            <span aria-hidden>{open ? "✕" : "☰"}</span>
          </button>
        </div>
      </div>

      {/* Scroll progress — a single hairline under the header. */}
      <div className="absolute inset-x-0 bottom-[-1px] h-[2px]" aria-hidden>
        <div
          className="h-full bg-accent"
          style={{ width: `${(progress * 100).toFixed(2)}%`, opacity: progress > 0.005 && !overlay ? 0.9 : 0 }}
        />
      </div>

      {open && (
        <nav className="menu-panel border-t border-line bg-panel px-4 py-2 md:hidden" aria-label="Mobile">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `data block px-3 py-3 text-[12px] uppercase tracking-[0.18em] ${
                  isActive ? "text-accent" : "text-muted"
                }`
              }
            >
              {n.label}
            </NavLink>
          ))}
        </nav>
      )}
    </header>
  );
}

function CompareBar() {
  const { selected, clear } = useCompare();
  const location = useLocation();
  if (selected.length === 0 || location.pathname === "/compare") return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-panel/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1400px] items-center gap-3 px-4 py-2.5 md:px-8">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto">
          {selected.map((id) => {
            const b = getBike(id);
            if (!b) return null;
            return (
              <span
                key={id}
                className="data whitespace-nowrap border border-line bg-raised px-2.5 py-1 text-[11px] uppercase tracking-wider text-muted"
              >
                {b.model}
                {b.variant ? ` ${b.variant}` : ""}
              </span>
            );
          })}
        </div>
        <button onClick={clear} className="data text-[11px] uppercase tracking-wider text-dim hover:text-fg">
          Clear
        </button>
        <Link to="/compare" className="btn btn-primary shrink-0 px-4 py-2 text-xs">
          Compare {selected.length}
        </Link>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-24 border-t border-line">
      <div className="mx-auto max-w-[1400px] px-4 py-12 md:px-8">
        <div className="flex flex-wrap items-start justify-between gap-10">
          <div className="max-w-xl">
            <Wordmark />
            <p className="mt-3 text-xs leading-relaxed text-dim">
              Specifications are manufacturer figures. Prices are indicative European on-the-road
              figures shown with a “~” unless confirmed against an official importer pricelist —
              always check the current local price with a dealer before deciding. Photography:
              official manufacturer press and product images; each bike's page credits its source.
            </p>
            <p className="data mt-4 text-[11px] text-dim">
              © 2026 MotoMatch · Last verified: August 2026
            </p>
          </div>
          <nav className="flex gap-14" aria-label="Footer">
            <div className="flex flex-col gap-2.5">
              {[
                ["/find-my-bike", "Find My Bike"],
                ["/explore", "Explore"],
                ["/compare", "Compare"],
              ].map(([to, label]) => (
                <Link key={to} to={to} className="data text-[11px] uppercase tracking-[0.16em] text-muted hover:text-accent">
                  {label}
                </Link>
              ))}
            </div>
            <div className="flex flex-col gap-2.5">
              <Link to="/about" className="data text-[11px] uppercase tracking-[0.16em] text-muted hover:text-accent">
                About
              </Link>
              <Link to="/about" className="data text-[11px] uppercase tracking-[0.16em] text-muted hover:text-accent">
                How it works
              </Link>
            </div>
          </nav>
        </div>
      </div>
    </footer>
  );
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

/** Old deployments and bookmarks used hash routes — map them to clean URLs. */
function LegacyHashRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    const h = window.location.hash;
    if (!h.startsWith("#/")) return;
    let path = h.slice(1);
    path = path.replace(/^\/browse/, "/explore").replace(/^\/recommendation/, "/find-my-bike");
    navigate(path, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** BrowserRouter for the web; HashRouter keeps the single-file build working from file://. */
const Router = typeof window !== "undefined" && window.location.protocol === "file:" ? HashRouter : BrowserRouter;

export default function App() {
  return (
    <Router>
      <CompareProvider>
        <ScrollToTop />
        <LegacyHashRedirect />
        <Header />
        <main className="pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/find-my-bike" element={<FindMyBike />} />
            <Route path="/results" element={<Results />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/bikes/:id" element={<BikeDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/about" element={<About />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <CompareBar />
        <Footer />
      </CompareProvider>
    </Router>
  );
}
