import React from "react";

// Oto's living mark — the open "O" (an aperture ring). Framework-agnostic core
// so it can be reused outside React. viewBox padded to fit the state "corona".
const MARK_VIEWBOX = "-80 -80 160 160";
const INK = "#2c2112", HAIR = "#dccfa8", SAFF = "#f0b41e";

const MARK_DEFS =
  `<defs>` +
  `<radialGradient id="otoSaff" cx="38%" cy="30%" r="82%"><stop offset="0%" stop-color="#ffd24a"/><stop offset="55%" stop-color="#f0b41e"/><stop offset="100%" stop-color="#cf8f10"/></radialGradient>` +
  `<radialGradient id="otoOliv" cx="38%" cy="30%" r="82%"><stop offset="0%" stop-color="#c0db4e"/><stop offset="55%" stop-color="#8aa620"/><stop offset="100%" stop-color="#5c7212"/></radialGradient>` +
  `</defs>`;

// Core identity: the open O — an aperture ring (opening top-right, round caps).
function coreMark(variant) {
  let stroke;
  if (variant === "quad") stroke = "url(#otoSaff)";
  else if (variant === "olive") stroke = "url(#otoOliv)";
  else stroke = SAFF;
  return `<circle r="44" fill="none" stroke="${stroke}" stroke-width="28" stroke-linecap="round" stroke-dasharray="230 46" transform="rotate(-8)"/>`;
}

// State corona: lives outside the ring (r>58). `static` draws nothing.
function corona(state) {
  if (state === "static") return "";
  if (state === "idle") {
    return `<g class="oto-breathe"><circle r="66" fill="none" stroke="${INK}" stroke-width="1.4"/><circle r="74" fill="none" stroke="${HAIR}" stroke-width="1"/></g>`;
  }
  if (state === "think") {
    const n = 10, r = 70;
    let dots = "";
    for (let i = 0; i < n; i++) {
      const a = (2 * Math.PI * i) / n - Math.PI / 2;
      dots += `<circle cx="${(r * Math.cos(a)).toFixed(1)}" cy="${(r * Math.sin(a)).toFixed(1)}" r="3.4" fill="${SAFF}"/>`;
    }
    return `<g class="oto-orbit"><g class="oto-twinkle">${dots}</g></g>`;
  }
  const n = 36, r0 = 62, r1 = 76;
  let ticks = "";
  for (let i = 0; i < n; i++) {
    const a = (2 * Math.PI * i) / n;
    ticks += `<line x1="${(r0 * Math.cos(a)).toFixed(1)}" y1="${(r0 * Math.sin(a)).toFixed(1)}" x2="${(r1 * Math.cos(a)).toFixed(1)}" y2="${(r1 * Math.sin(a)).toFixed(1)}" style="animation-delay:${((i % 6) * 0.09).toFixed(2)}s"/>`;
  }
  return `<g class="oto-wave" stroke="${SAFF}" stroke-width="2.2" stroke-linecap="round">${ticks}</g>`;
}

// In `think`, the ring itself rotates slowly COUNTER to the orbiting dots.
const KEYFRAMES = `
.oto-mark .oto-breathe{transform-box:fill-box;transform-origin:center;animation:oto-breathe 4.2s ease-in-out infinite}
.oto-mark .oto-orbit{transform-box:fill-box;transform-origin:center;animation:oto-spin 7s linear infinite}
.oto-mark .oto-corespin{transform-box:fill-box;transform-origin:center;animation:oto-spin-rev 11s linear infinite}
.oto-mark .oto-twinkle circle{animation:oto-tw 2.2s ease-in-out infinite}
.oto-mark .oto-wave line{transform-box:fill-box;transform-origin:center;animation:oto-amp 1.1s ease-in-out infinite}
@keyframes oto-breathe{0%,100%{transform:scale(1);opacity:.85}50%{transform:scale(1.06);opacity:1}}
@keyframes oto-spin{to{transform:rotate(360deg)}}
@keyframes oto-spin-rev{to{transform:rotate(-360deg)}}
@keyframes oto-tw{0%,100%{opacity:.4}50%{opacity:1}}
@keyframes oto-amp{0%,100%{transform:scaleY(.5)}50%{transform:scaleY(1.15)}}
@media (prefers-reduced-motion:reduce){.oto-mark .oto-breathe,.oto-mark .oto-orbit,.oto-mark .oto-corespin,.oto-mark .oto-twinkle circle,.oto-mark .oto-wave line{animation:none}}`;

/**
 * Oto's living mark — the open "O". `variant`: quad (warm gradient) / mono
 * (flat saffron) / olive. `state`: static, idle (breathe), think (dots orbit
 * one way while the ring turns slowly the other), talk (wave).
 */
export function OtoMark({ variant = "quad", state = "static", size = 40, title = "Oto", style, ...rest }) {
  const core = state === "think" ? `<g class="oto-corespin">${coreMark(variant)}</g>` : coreMark(variant);
  const inner = MARK_DEFS + corona(state) + core;
  return (
    <>
      <style>{KEYFRAMES}</style>
      <svg
        className="oto-mark"
        width={size}
        height={size}
        viewBox={MARK_VIEWBOX}
        role="img"
        aria-label={title}
        style={{ display: "block", ...style }}
        dangerouslySetInnerHTML={{ __html: inner }}
        {...rest}
      />
    </>
  );
}
