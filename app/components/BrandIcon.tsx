import type { SVGProps } from "react";

export type BrandIconName =
  | "venture" | "invest" | "link" | "verify" | "document" | "growth"
  | "layers" | "compass" | "message" | "shield" | "spark" | "arrow"
  | "mail" | "scope" | "clock";

type Props = SVGProps<SVGSVGElement> & {
  name: BrandIconName;
  size?: number;
};

/**
 * Geometric editorial icons drawn for DealCapital.
 * All icons share the same 32px grid and intentionally use both
 * continuous and interrupted strokes rather than generic filled glyphs.
 */
export default function BrandIcon({ name, size = 32, ...props }: Props) {
  const shared = {
    width: size, height: size, viewBox: "0 0 32 32",
    fill: "none", stroke: "currentColor", strokeWidth: 1.6,
    strokeLinecap: "round" as const, strokeLinejoin: "round" as const,
    "aria-hidden": true as const, ...props,
  };
  const art: Record<BrandIconName, React.ReactNode> = {
    venture: <><path d="M5 26V7h12l10 10v9H5Z"/><path d="M17 7v10h10M10 21h7M10 16h3"/><circle cx="24.7" cy="7.3" r="2" fill="currentColor" stroke="none"/></>,
    invest: <><path d="M4 23 13 14l6 5 9-12"/><path d="M20 7h8v8M4 28h24"/><circle cx="13" cy="14" r="2" fill="currentColor" stroke="none"/></>,
    link: <><circle cx="7" cy="17" r="3.5"/><circle cx="25" cy="8" r="3.5"/><circle cx="25" cy="25" r="3.5"/><path d="m10 15 12-6M10 19l12 5M20 16l2-3"/><path d="M14 16h5" strokeDasharray="2 3"/></>,
    verify: <><path d="m16 3 11 5v8c0 7-4 11-11 13C9 27 5 23 5 16V8L16 3Z"/><path d="m11 16 3 3 7-7"/><circle cx="16" cy="16" r="12.5" strokeDasharray="2 4" opacity=".35"/></>,
    document: <><path d="M7 4h12l6 6v18H7V4Z"/><path d="M19 4v7h6M11 17h9M11 22h7"/><circle cx="23.5" cy="22.5" r="4" fill="#020817"/><path d="m22 22.5 1.1 1.1 2.2-2.2"/></>,
    growth: <><path d="M5 28V17h6v11M13 28V10h6v18M21 28V4h6v24M3 28h26"/><path d="m5 11 6-5 5 3 7-6" strokeDasharray="2 3"/></>,
    layers: <><path d="m16 3 12 7-12 7L4 10l12-7ZM4 16l12 7 12-7M4 22l12 7 12-7"/><path d="m16 7 5 3-5 3-5-3 5-3Z" opacity=".6"/></>,
    compass: <><circle cx="16" cy="16" r="12"/><path d="m21 11-3 7-7 3 3-7 7-3Z"/><path d="M16 1v4M16 27v4M1 16h4M27 16h4" strokeDasharray="1 2"/></>,
    message: <><path d="M4 7h24v16H12l-7 5v-5H4V7Z"/><path d="M9 14h14M9 18h10"/><circle cx="25" cy="5" r="3" fill="currentColor" stroke="none"/></>,
    shield: <><path d="m16 3 11 5v9c0 5.5-4 9-11 12C9 26 5 22.5 5 17V8l11-5Z"/><path d="M11 17h10M16 12v10" strokeDasharray="1 3"/><circle cx="16" cy="17" r="4"/></>,
    spark: <><path d="m16 2 3.6 10.4L30 16l-10.4 3.6L16 30l-3.6-10.4L2 16l10.4-3.6L16 2Z"/><circle cx="16" cy="16" r="3"/></>,
    arrow: <><path d="M4 16h23M17 6l10 10-10 10"/><path d="M4 8v16" strokeDasharray="2 3"/></>,
    mail: <><rect x="3" y="7" width="26" height="19" rx="2"/><path d="m3 10 13 9 13-9M3 26l9-9M29 26l-9-9"/></>,
    scope: <><circle cx="16" cy="16" r="11"/><circle cx="16" cy="16" r="5"/><path d="M16 2v6M16 24v6M2 16h6M24 16h6"/><circle cx="16" cy="16" r="1.5" fill="currentColor" stroke="none"/></>,
    clock: <><circle cx="16" cy="16" r="12"/><path d="M16 8v9l6 4M16 1v3M16 28v3"/></>,
  };
  return <svg {...shared}>{art[name]}</svg>;
}
