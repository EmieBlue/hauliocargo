/**
 * Single source of truth for navigation, copy and destinations.
 *
 * NOTE ON ROUTES: the landing page is the only thing built so far. Every
 * auth/booking destination below therefore resolves to an on-page anchor so
 * nothing 404s and nothing pretends to work. When the real pages land
 * (registration, sign-in, booking flow), change the values here — no component
 * needs to be touched.
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
  howItWorks: `#${SECTION_IDS.howItWorks}`,
  services: `#${SECTION_IDS.services}`,
  about: `#${SECTION_IDS.about}`,
  contact: `#${SECTION_IDS.contact}`,
  smartload: `#${SECTION_IDS.smartload}`,

  // --- Placeholders: these products do not exist yet ---
  book: `#${SECTION_IDS.getStarted}`,
  register: `#${SECTION_IDS.getStarted}`,
  signin: `#${SECTION_IDS.getStarted}`,
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
