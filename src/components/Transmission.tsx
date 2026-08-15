import type { Motorcycle } from "../data/types";
import { TRANSMISSIONS } from "../data/transmissions";

export function verdictColor(verdict: "automatic" | "semi" | "manual"): string {
  return verdict === "automatic"
    ? "var(--color-auto)"
    : verdict === "semi"
      ? "var(--color-semi)"
      : "var(--color-manual)";
}

/**
 * THE SIGNATURE ELEMENT.
 *
 * A six-position gear rail. It shows, at a glance and without reading a word,
 * how much gearbox work the rider is doing:
 *   automatic → one continuous green bar, no divisions
 *   e-clutch  → six amber cells, because you still pick every one of them
 *   manual    → six red cells plus a clutch marker on the left
 *
 * This is the one visual that answers the question the whole site exists for,
 * so it appears on every card, every table row and every detail page.
 */
export function ShiftRail({
  bike,
  size = "md",
}: {
  bike: Motorcycle;
  size?: "sm" | "md" | "lg";
}) {
  const info = TRANSMISSIONS[bike.transmission.type];
  const color = verdictColor(info.verdict);
  const h = size === "sm" ? 6 : size === "lg" ? 12 : 8;
  const gap = size === "sm" ? 2 : 3;

  if (info.verdict === "automatic") {
    return (
      <div
        className="w-full rounded-full"
        style={{
          height: h,
          background: `linear-gradient(90deg, ${color}, color-mix(in srgb, ${color} 40%, transparent))`,
          boxShadow: `0 0 14px -4px ${color}`,
        }}
        aria-hidden
      />
    );
  }

  return (
    <div className="flex w-full items-stretch" style={{ gap }} aria-hidden>
      {info.verdict === "manual" && (
        <div
          className="rounded-sm shrink-0"
          style={{ width: h * 1.6, height: h, background: color, opacity: 0.5 }}
          title="clutch lever"
        />
      )}
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <div
          key={n}
          className="flex-1 rounded-sm"
          style={{ height: h, background: color, opacity: 0.35 + n * 0.09 }}
        />
      ))}
    </div>
  );
}

export function TransmissionBadge({
  bike,
  compact = false,
}: {
  bike: Motorcycle;
  compact?: boolean;
}) {
  const info = TRANSMISSIONS[bike.transmission.type];
  const color = verdictColor(info.verdict);
  const dot = info.verdict === "automatic" ? "🟢" : info.verdict === "semi" ? "🟡" : "🔴";

  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={{ background: `${color}18`, color, border: `1px solid ${color}35` }}
      title={info.riderDoes}
    >
      <span aria-hidden>{dot}</span>
      {compact ? info.short : info.verdictLabel}
    </span>
  );
}

export function VehicleTypeBadge({ bike }: { bike: Motorcycle }) {
  const isScooter = bike.vehicleType === "scooter";
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-raised px-2.5 py-1 text-[11px] font-semibold text-muted whitespace-nowrap"
      title={isScooter ? "Scooter body, step-through" : "Motorcycle body"}
    >
      <span aria-hidden>{isScooter ? "🛵" : "🏍"}</span>
      {isScooter ? "Scooter" : "Motorcycle"}
    </span>
  );
}

export function A2Badge({ bike }: { bike: Motorcycle }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold whitespace-nowrap"
      style={
        bike.a2Compatible
          ? { background: "rgba(61,214,140,0.12)", color: "var(--color-auto)", border: "1px solid rgba(61,214,140,0.25)" }
          : { background: "rgba(242,104,92,0.12)", color: "var(--color-manual)", border: "1px solid rgba(242,104,92,0.25)" }
      }
      title={bike.a2Note ?? (bike.a2Compatible ? "Rideable on an A2 licence" : "Full A licence required")}
    >
      {bike.a2Compatible ? "A2" : "A only"}
    </span>
  );
}
