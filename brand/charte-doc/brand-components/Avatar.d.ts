import * as React from "react";

export interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
  /** Image URL; falls back to the name initial if absent. */
  src?: string | null;
  /** Name — its first letter is the fallback. */
  name?: string | null;
  /** Size in px. @default 26 */
  size?: number;
  /** circle (user) or square/7px (org logo). @default "circle" */
  shape?: "circle" | "square";
}

/**
 * Avatar / org logo. Image or initial fallback on ink.
 * @dsCard group="Brand" name="Avatar"
 */
export function Avatar(props: AvatarProps): JSX.Element;
