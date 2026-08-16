import type { Motorcycle } from "../data/types";
import { bikeName } from "../data/motorcycles";
import { useFavorites } from "../App";

export function HeartIcon({ filled, size = 17 }: { filled: boolean; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M12 20.3C7.2 16.5 3.8 13.3 3.8 9.7 3.8 7.1 5.8 5 8.3 5c1.5 0 2.9.7 3.7 1.9C12.8 5.7 14.2 5 15.7 5c2.5 0 4.5 2.1 4.5 4.7 0 3.6-3.4 6.8-8.2 10.6z" />
    </svg>
  );
}

/** The one heart control used everywhere — backed by the app-wide favorites state. */
export function FavoriteButton({ bike, className = "" }: { bike: Motorcycle; className?: string }) {
  const { isFavorite, toggleFavorite } = useFavorites();
  const on = isFavorite(bike.id);
  return (
    <button
      type="button"
      onClick={() => toggleFavorite(bike.id)}
      aria-pressed={on}
      aria-label={on ? `Remove ${bikeName(bike)} from favorites` : `Save ${bikeName(bike)} to favorites`}
      className={`flex h-8 w-8 items-center justify-center rounded-full border transition-colors ${
        on ? "border-accent text-accent" : "border-line text-dim hover:border-line-bright hover:text-muted"
      } ${className}`}
    >
      <HeartIcon filled={on} />
    </button>
  );
}
