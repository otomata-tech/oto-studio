import * as React from "react";

export type MarkVariant = "quad" | "mono" | "olive";
export type MarkState = "static" | "idle" | "think" | "talk";

/**
 * OtoMark props.
 * @startingPoint section="Brand" subtitle="Oto living mark — quad / mono / olive, animated states" viewport="700x220"
 */
export interface OtoMarkProps extends React.SVGProps<SVGSVGElement> {
  /** quad = four-color favicon disc; mono = saffron; olive. @default "quad" */
  variant?: MarkVariant;
  /**
   * Activity: static (rest), idle (breathe), think (orbiting dots — for
   * loading), talk (wave). Corona only draws when ≠ static.
   * @default "static"
   */
  state?: MarkState;
  /** Size in px. @default 40 */
  size?: number;
  /** Accessible label. @default "Oto" */
  title?: string;
}

/**
 * Oto's living brand mark — the warm pierced disc "o". The `quad` variant is
 * the canonical four-color favicon; use `mono` in topbars. `state` expresses
 * activity and should only move where motion is meaningful (e.g. loading).
 * @dsCard group="Brand" name="OtoMark"
 */
export function OtoMark(props: OtoMarkProps): JSX.Element;
