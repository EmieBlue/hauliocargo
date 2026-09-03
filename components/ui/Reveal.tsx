"use client";

import { motion, type Transition, type Variants } from "framer-motion";
import type { ReactNode } from "react";
import { riseIn, staggerParent, VIEWPORT } from "@/lib/motion";

export type Tag =
  | "div"
  | "section"
  | "article"
  | "span"
  | "ul"
  | "li"
  | "p"
  | "h2"
  | "h3";

/**
 * Only the props these wrappers actually pass. Element-specific prop types
 * (`onPlay` on a `ul` vs a `div`, say) are incompatible with each other, so a
 * wide `ComponentProps<typeof motion.div>` cannot be spread onto every tag.
 */
type MotionTagProps = {
  tag: Tag;
  id?: string;
  className?: string;
  children?: ReactNode;
  variants?: Variants;
  initial?: string;
  animate?: string;
  whileInView?: string;
  viewport?: typeof VIEWPORT;
  transition?: Transition;
};

/**
 * Renders one concrete motion component per tag.
 *
 * Deliberately a switch rather than a `motion[tag]` lookup: building a
 * component inside render produces a new component type on every pass, which
 * remounts the subtree and loses its state.
 */
function MotionTag({ tag, ...props }: MotionTagProps) {
  switch (tag) {
    case "section":
      return <motion.section {...props} />;
    case "article":
      return <motion.article {...props} />;
    case "span":
      return <motion.span {...props} />;
    case "ul":
      return <motion.ul {...props} />;
    case "li":
      return <motion.li {...props} />;
    case "p":
      return <motion.p {...props} />;
    case "h2":
      return <motion.h2 {...props} />;
    case "h3":
      return <motion.h3 {...props} />;
    default:
      return <motion.div {...props} />;
  }
}

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Delay before this element starts, in seconds. */
  delay?: number;
  as?: Tag;
  variants?: Variants;
  /** Set when the element doubles as a scroll anchor target. */
  id?: string;
};

/** Single element that rises in when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  as = "div",
  variants = riseIn,
  id,
}: RevealProps) {
  return (
    <MotionTag
      tag={as}
      id={id}
      className={className}
      variants={variants}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
      transition={{ delay }}
    >
      {children}
    </MotionTag>
  );
}

type RevealGroupProps = {
  children: ReactNode;
  className?: string;
  stagger?: number;
  delayChildren?: number;
  as?: Tag;
};

/**
 * Wraps a set of `<RevealItem>`s and cascades them in. Prefer this over
 * hand-tuned delays so every section shares one rhythm.
 */
export function RevealGroup({
  children,
  className,
  stagger = 0.09,
  delayChildren = 0,
  as = "div",
}: RevealGroupProps) {
  return (
    <MotionTag
      tag={as}
      className={className}
      variants={staggerParent(stagger, delayChildren)}
      initial="hidden"
      whileInView="show"
      viewport={VIEWPORT}
    >
      {children}
    </MotionTag>
  );
}

/** Child of a `<RevealGroup>`. Timing is inherited from the parent. */
export function RevealItem({
  children,
  className,
  as = "div",
  variants = riseIn,
  id,
}: Omit<RevealProps, "delay">) {
  return (
    <MotionTag tag={as} id={id} className={className} variants={variants}>
      {children}
    </MotionTag>
  );
}
