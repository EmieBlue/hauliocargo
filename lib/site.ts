/**
 * Single source of truth for navigation, copy and destinations.
 *
 * NOTE ON ROUTES: sign-in/registration are real pages now; anything past
 * authentication (booking, the real dashboards) still doesn't exist, so those
 * destinations resolve to an on-page anchor rather than a 404. When they land,
 * change the values here — no component needs to be touched.
 */

export const SECTION_IDS = {
  home: "home",
  getStarted: "get-started",
  contact: "contact",
  services: "services",
  smartload: "smartload",
  howItWorks: "how-it-works",
  about: "about",
} as const;

export const ROUTES = {
  home: `#${SECTION_IDS.home}`,
  /** The actual homepage route — unlike `home` above, safe to link to from a different page. */
  homePage: "/",
  howItWorks: `#${SECTION_IDS.howItWorks}`,
  services: `#${SECTION_IDS.services}`,
  about: `#${SECTION_IDS.about}`,
  contact: `#${SECTION_IDS.contact}`,
  smartload: `#${SECTION_IDS.smartload}`,

  // --- Auth: real pages ---
  signin: "/sign-in",
  register: "/register",
  verify: "/verify",
  forgotPassword: "/forgot-password",
  dashboardCustomer: "/dashboard/customer",
  dashboardDriver: "/dashboard/driver",
  driverJobs: "/dashboard/driver/jobs",
  dashboardAdmin: "/dashboard/admin",
  bookMove: "/dashboard/customer/move",
  bookSend: "/dashboard/customer/send",
  bookReceive: "/dashboard/customer/receive",
  profile: "/dashboard/profile",
  bookings: "/dashboard/bookings",

  // --- Placeholders: these products do not exist yet ---
  book: `#${SECTION_IDS.getStarted}`,
  privacy: "#",
  terms: "#",
} as const;

export const BRAND = {
  name: "HaulioCargo",
  tagline: "Move it. We'll handle it.",
  heroLead: "Move it.",
  heroAccent: "We'll handle it.",
  heroSub:
    "Book the right truck to move your cargo safely, easily and confidently.",
  /* Drawn from the project blueprint's brand-positioning slide. */
  about:
    "HaulioCargo is a technology company built around one idea: moving cargo should be simple. Show us what you're moving, choose where it's going, and we help arrange the right vehicle and a verified driver.",
} as const;

export const NAV_LINKS = [
  { label: "Home", href: ROUTES.home },
  { label: "How It Works", href: ROUTES.howItWorks },
  { label: "Services", href: ROUTES.services },
  { label: "About Us", href: ROUTES.about },
  { label: "Contact Us", href: ROUTES.contact },
] as const;

export const FOOTER_COLUMNS = [
  {
    title: "Platform",
    links: [
      { label: "Home", href: ROUTES.home },
      { label: "How It Works", href: ROUTES.howItWorks },
      { label: "Services", href: ROUTES.services },
      { label: "About", href: ROUTES.about },
      { label: "Contact", href: ROUTES.contact },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy Policy", href: ROUTES.privacy },
      { label: "Terms & Conditions", href: ROUTES.terms },
    ],
  },
] as const;

/** Social handles are not registered yet — placeholders, clearly labelled. */
export const SOCIAL_LINKS = [
  { label: "HaulioCargo on X", icon: "x", href: "#" },
  { label: "HaulioCargo on Instagram", icon: "instagram", href: "#" },
  { label: "HaulioCargo on LinkedIn", icon: "linkedin", href: "#" },
  { label: "HaulioCargo on Facebook", icon: "facebook", href: "#" },
] as const;

export const HOW_IT_WORKS_STEPS = [
  {
    number: "01",
    title: "Show us your cargo",
    body: "Upload photos and tell us what you're moving.",
  },
  {
    number: "02",
    title: "Choose your truck",
    body: "HaulioCargo helps you select a suitable vehicle.",
  },
  {
    number: "03",
    title: "Move with confidence",
    body: "A verified driver picks up and delivers your cargo.",
  },
] as const;

export const TRUST_POINTS = [
  {
    title: "Verified Drivers",
    body: "Every driver is identity-checked and their vehicle documented before they can accept a trip.",
  },
  {
    title: "Transparent Pricing",
    body: "See an estimated price before you confirm. No surprises when the truck arrives.",
  },
  {
    title: "Live Trip Tracking",
    body: "Follow your cargo from pickup to delivery, with clear status at every stage.",
  },
  {
    title: "Safe & Reliable Delivery",
    body: "Cargo details are shared up front, so the right vehicle turns up prepared.",
  },
] as const;

/** Cargo categories — doubles as the "Services" framing for the nav anchor. */
export const CARGO_CATEGORIES = [
  { title: "Household Moves", body: "Boxes, beds, wardrobes and everything in between." },
  { title: "Furniture & Appliances", body: "Sofas, fridges, tables, TVs — handled with care." },
  { title: "Business Goods", body: "Stock, equipment and deliveries for your operation." },
  { title: "Building Materials", body: "Heavier loads matched to a vehicle that can take them." },
] as const;

/**
 * The actual truck sizes a booking is made against — the final answer on
 * Move With You, reached either via SmartLoad™'s AI suggestion or picked
 * manually. Literal truck lengths (matching the size-guide reference the
 * user sent) rather than relative labels — a 20ft truck is a 20ft truck
 * regardless of what's being moved, so the size itself stays the same
 * across every cargo category; only the caption next to it changes (see
 * `TRUCK_SIZE_GUIDE` below). Mirrored in
 * `supabase/functions/analyze-cargo/index.ts` (Deno can't import this file
 * directly) — keep both in sync if these ever change.
 */
export const TRUCK_SIZES = [
  { title: "10ft" },
  { title: "15ft" },
  { title: "20ft" },
  { title: "26ft" },
] as const;

/**
 * Typical carrying capacity per truck size — standard box-truck figures,
 * not this fleet's measured numbers. Used only for the "this may be too
 * much for a Xft truck" hint on Move With You (see TruckSizePicker's
 * caller) when the customer enters a weight or volume; replace with real
 * fleet numbers if they differ.
 */
export const TRUCK_SPECS: Record<string, { maxWeightKg: number; maxVolumeM3: number }> = {
  "10ft": { maxWeightKg: 1400, maxVolumeM3: 14 },
  "15ft": { maxWeightKg: 1800, maxVolumeM3: 23 },
  "20ft": { maxWeightKg: 2600, maxVolumeM3: 34 },
  "26ft": { maxWeightKg: 4500, maxVolumeM3: 48 },
};

/**
 * Move With You's optional "need help loading?" step, asked after a truck
 * size is chosen. Same four-option shape as `TRUCK_SIZES` for the same 2×2
 * card-grid convention — "4+" rather than an open-ended number input, since
 * an exact headcount beyond that doesn't change how the request gets
 * handled yet.
 */
export const LOADING_ASSISTANT_COUNTS = [
  { title: "1" },
  { title: "2" },
  { title: "3" },
  { title: "4+" },
] as const;

/**
 * One "Best for" caption per truck size, per cargo category — same order as
 * `TRUCK_SIZES`. The reference image the user sent only covers household
 * moves ("Studio / 1 Bedroom / 2–3 Bedroom / 3–4 Bedroom"); this extends
 * that same idea to the other three categories with wording suited to what
 * they actually carry.
 */
export const TRUCK_SIZE_GUIDE: Record<(typeof CARGO_CATEGORIES)[number]["title"], readonly string[]> = {
  "Household Moves": ["studio / small apartment", "1 bedroom home", "2–3 bedroom home", "3–4 bedroom home"],
  "Furniture & Appliances": [
    "a single large item — sofa, fridge or wardrobe",
    "a few pieces of furniture",
    "a living room or bedroom set",
    "a full house of furniture & appliances",
  ],
  "Business Goods": [
    "a small stock run or a few parcels",
    "pallet-sized stock or equipment",
    "a shop's worth of stock",
    "bulk stock or heavy equipment",
  ],
  "Building Materials": [
    "a few bags, boards or pipes",
    "a small renovation's worth",
    "a room's worth of materials",
    "a full building-materials load",
  ],
};

/**
 * Fallback truck size per category, used on the AI (Yes) path when a cargo
 * type is known but no photo was ever analyzed (or analysis didn't return a
 * size) — the SmartLoad Suggestion banner always has something concrete to
 * say once a category is picked, not just when a photo happened to be
 * involved. Reasonable picks per category; the user's own spec only gave
 * one worked example (Household Moves → 20ft).
 */
export const DEFAULT_TRUCK_SIZE: Record<(typeof CARGO_CATEGORIES)[number]["title"], string> = {
  "Household Moves": "20ft",
  "Furniture & Appliances": "15ft",
  "Business Goods": "20ft",
  "Building Materials": "26ft",
};
