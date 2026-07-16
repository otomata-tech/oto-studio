import * as React from "react";

export interface MedallionProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Preset size or explicit px. @default "sm" */
  size?: "sm" | "md" | "lg" | number;
  /** Disc color. saffron (default) or ink (inverse). */
  tone?: "saffron" | "ink";
}

/**
 * The Oto medallion — the brand's pierced disc "o" (saffron disc + cream
 * hole), not a typographic letter. Sidebar logo, fallback avatar, login card.
 * @dsCard group="Brand" name="Medallion"
 */
export function Medallion(props: MedallionProps): JSX.Element;
