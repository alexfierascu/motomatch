import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { HashRouter, Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import Home from "./pages/Home";
import Browse from "./pages/Browse";
import BikeDetail from "./pages/BikeDetail";
import Compare from "./pages/Compare";
import Recommend from "./pages/Recommend";
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
  { to: "/", label: "Home", end: true },
  { to: "/browse", label: "Browse" },
  { to: "/compare", label: "Compare" },
  { to: "/recommendation", label: "Find my bike" },
];

function Wordmark() {
  return (
    <span className="font-display text-[19px] tracking-[0.04em]">
      CLUTCH<span className="text-accent">LESS</span>
    </span>
  );
}

function Header() {
  const [open, setOpen] = useState(false);
  const { selected } = useCompare();
  const progress = useScrollProgress();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-ink/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between px-4 md:px-8">
        <Link to="/" className="flex items-center gap-2.5" onClick={() => setOpen(false)}>
          <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden>
            <circle cx="6" cy="16" r="4.4" fill="none" stroke="var(--color-accent)" strokeWidth="1.8" />
            <circle cx="18" cy="16" r="4.4" fill="none" stroke="var(--color-fg)" strokeWidth="1.8" />
            <path d="M6 16 L11 9 L17 9 L18 16" fill="none" stroke="var(--color-fg)" strokeWidth="1.8" strokeLinejoin="round" />
          </svg>
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) =>
                `data relative py-4 text-[11px] uppercase tracking-[0.18em] transition-colors ${
                  isActive ? "text-fg" : "text-dim hover:text-muted"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  {n.label}
                  {n.to === "/compare" && selected.length > 0 && (
                    <span className="data ml-1.5 bg-accent px-1.5 py-0.5 text-[10px] text-white">
                      {selected.length}
                    </span>
                  )}
                  {isActive && (
                    <span className="absolute inset-x-0 bottom-0 h-[2px] bg-accent" aria-hidden />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          className="btn btn-ghost px-2.5 py-1.5 md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label="Toggle navigation menu"
        >
          <span aria-hidden>{open ? "✕" : "☰"}</span>
        </button>
      </div>

      {/* Scroll progress — a single hairline under the header. */}
      <div className="absolute inset-x-0 bottom-[-1px] h-[2px]" aria-hidden>
        <div
          className="h-full bg-accent"
          style={{ width: `${(progress * 100).toFixed(2)}%`, opacity: progress > 0.005 ? 0.9 : 0 }}
        />
      </div>

      {open && (
        <nav className="border-t border-line bg-panel px-4 py-2 md:hidden">
          {NAV.map((n) => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
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
        <div className="flex flex-wrap items-end justify-between gap-8">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xl text-xs leading-relaxed text-dim">
              Specifications are manufacturer figures. Prices are indicative on-the-road figures
              shown with a “~” unless confirmed against an official importer pricelist — always
              check the current Romanian price with the dealer before deciding. Photography:
              official manufacturer press and product images; each bike's page credits its source.
            </p>
          </div>
          <div className="text-right">
            <div className="eyebrow">Automatic motorcycles · Romania</div>
            <p className="data mt-2 text-[11px] text-dim">Last verified: August 2026</p>
          </div>
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

export default function App() {
  return (
    <HashRouter>
      <CompareProvider>
        <ScrollToTop />
        <Header />
        <main className="pb-24">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/browse" element={<Browse />} />
            <Route path="/bikes/:id" element={<BikeDetail />} />
            <Route path="/compare" element={<Compare />} />
            <Route path="/recommendation" element={<Recommend />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <CompareBar />
        <Footer />
      </CompareProvider>
    </HashRouter>
  );
}
