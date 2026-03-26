import { Variants } from "framer-motion";

// The BGFI easing — smooth out, soft land
// Inspired by Linear/Stripe: fast initial movement, natural deceleration
export const bgfiEase = [0.22, 1, 0.36, 1] as const;

// Stagger children — used on any parent container
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
};

// Default entrance — fade up
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// Slide from left — sidebar items, ranked lists
export const fadeLeft: Variants = {
  hidden: { opacity: 0, x: -16 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

// Scale reveal — cards and images
export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.96 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  },
};

// Accent line draws from left
export const lineGrow: Variants = {
  hidden: { scaleX: 0, originX: 0 },
  visible: {
    scaleX: 1,
    transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  },
};

// Card hover shadow — plum-tinted depth
export const cardHover = {
  y: -3,
  boxShadow:
    "0 4px 6px -1px rgba(59, 16, 66, 0.06), 0 20px 40px -8px rgba(59, 16, 66, 0.12), 0 0 0 1px rgba(155, 112, 181, 0.08)",
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

export const cardHoverDark = {
  y: -3,
  boxShadow:
    "0 4px 6px -1px rgba(0, 0, 0, 0.3), 0 20px 40px -8px rgba(155, 112, 181, 0.15), 0 0 0 1px rgba(155, 112, 181, 0.1)",
  transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
};

// Card press — subtle scale-down on click
export const cardTap = {
  scale: 0.985,
  transition: { duration: 0.1 },
};

// Image zoom on hover
export const imageZoom = {
  scale: 1.04,
  transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
};

// Like button spring
export const likeTap = {
  scale: 1.3,
  transition: { type: "spring" as const, stiffness: 500, damping: 15 },
};

// Bookmark tilt
export const bookmarkTap = {
  scale: 1.2,
  rotate: -12,
  transition: { type: "spring" as const, stiffness: 400, damping: 10 },
};

// Dropdown enter/exit
export const dropdownVariants: Variants = {
  hidden: { opacity: 0, y: -8, scale: 0.98 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.2, ease: [0.22, 1, 0.36, 1] },
  },
  exit: {
    opacity: 0,
    y: -4,
    scale: 0.99,
    transition: { duration: 0.15, ease: "easeIn" },
  },
};
