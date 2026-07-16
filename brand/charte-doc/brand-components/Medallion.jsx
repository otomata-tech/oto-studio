import React from "react";

const SIZES = { sm: 28, md: 34, lg: 56 };

/**
 * The Oto mark — an open "O" (an aperture ring, opening top-right, rounded
 * caps echoing the pill buttons). NOT a typographic letter or filled disc.
 * Used small: sidebar identity, fallback avatar, login. `tone`: saffron | ink.
 */
export function Medallion({ size = "sm", tone = "saffron", style, ...rest }) {
  const px = typeof size === "number" ? size : SIZES[size];
  const stroke = tone === "ink" ? "var(--color-ink)" : "var(--color-saffron)";
  return (
    <span style={{ display: "inline-flex", flexShrink: 0, ...style }} {...rest}>
      <svg width={px} height={px} viewBox="-64 -64 128 128" role="img" aria-label="Oto">
        <circle r="44" fill="none" stroke={stroke} strokeWidth="28" strokeLinecap="round" strokeDasharray="230 46" transform="rotate(-8)" />
      </svg>
    </span>
  );
}
