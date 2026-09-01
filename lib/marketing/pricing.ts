export interface PricingTier {
  id: "pilot" | "cfi" | "flight-school-pro";
  name: string;
  audience: string;
  price: string;
  priceSuffix: string;
  priceNote?: string;
  /** Small orange value-anchor line shown just above the CTA button. */
  valueAnchor?: string;
  featured?: boolean;
  featuredLabel?: string;
  features: string[];
  cta: string;
  /** Pilot and CFI are individual signups (no self-serve student/CFI org exists yet -- see app/(auth)/signup/*); the school tier gets its own self-serve org-creation flow. */
  signupHref: "/signup/student" | "/signup/cfi" | "/signup/school";
  analyticsEvent: "select_pilot" | "select_cfi" | "select_school_pro";
  /** School Pro only -- points visitors managing more than one location to the Enterprise card instead of implying this plan scales to a whole academy. */
  upsell?: { text: string; linkLabel: string; href: string };
}

/**
 * THESE STRINGS ARE DISPLAY ONLY. The amount a customer is actually charged
 * lives in Stripe, behind STRIPE_PRICE_PILOT_MONTHLY / _ANNUAL (see
 * lib/stripe.ts) -- nothing here sets it. Changing a price below without
 * repointing those secrets at new Stripe Price objects makes the site
 * advertise one number and bill another, in both the workspace and the
 * Deployment scope.
 *
 * Pilot moved $9.99/$99 -> $19.99/$169 on 2026-09-01.
 *
 * Read by the homepage, /what-is-afterflight (pricing FAQ *and* its
 * product structured data) and /enterprise. A price edit here is a
 * site-wide edit. app/(product)/billing/page.tsx hardcodes its own copy and
 * does NOT read this -- it has to be changed by hand.
 */
export const PRICING_TIERS: PricingTier[] = [
  {
    id: "pilot",
    name: "Pilot",
    audience: "For student pilots and individual pilots.",
    price: "$19.99",
    priceSuffix: "/mo",
    priceNote: "or $169/year — save ~30%",
    features: [
      "Unlimited debriefs",
      "See your progress over time",
      "ACS-aligned feedback",
      "Custom checklists & goals",
      "Works on all devices",
      "First 3 flights free",
    ],
    cta: "Get Your First 3 Flights Free",
    signupHref: "/signup/student",
    analyticsEvent: "select_pilot",
  },
  {
    id: "cfi",
    name: "CFI",
    audience: "For individual flight instructors.",
    price: "Free",
    priceSuffix: "",
    featured: true,
    featuredLabel: "Always Free for CFIs",
    features: [
      "Guided debriefs with every student",
      "ACS-aligned feedback tools",
      "See student progress between lessons",
      "Works with any flight school",
      "No credit card required",
    ],
    cta: "Create Free Account",
    signupHref: "/signup/cfi",
    analyticsEvent: "select_cfi",
  },
  {
    id: "flight-school-pro",
    name: "Flight School Pro",
    audience: "For independent flight schools and training organizations.",
    price: "$99",
    priceSuffix: "/month/location",
    priceNote: "or $990/year/location — save 17%",
    features: [
      "See every student's training progress",
      "Identify recurring training gaps",
      "See debrief adoption across CFIs",
      "Spot students who may be falling behind",
      "Track ACS proficiency across the school",
      "Manage students & instructors in one place",
    ],
    cta: "Start Your 25 Free Debriefs",
    signupHref: "/signup/school",
    analyticsEvent: "select_school_pro",
    upsell: {
      text: "Multiple locations, campuses, or training programs?",
      linkLabel: "Explore AfterFlight Enterprise",
      href: "/enterprise",
    },
  },
];

export const ENTERPRISE_PRICING = {
  eyebrow: "Enterprise",
  headline: "Built for flight training at scale.",
  copy: "For multi-location flight schools, universities, aviation academies, and large training organizations.",
  priceLabel: "Custom annual pricing",
  capabilities: [
    "Multi-location management",
    "Organization-level training trends",
    "Location comparison",
    "Student continuity",
    "Integrations",
    "Enterprise licensing",
  ],
  pricingDetails: ["Multi-location deployment", "Bulk student licensing", "Integration planning", "Custom onboarding", "Enterprise support"],
  cta: "Talk to Sales",
  ctaHref: "/enterprise",
  /**
   * Distinct copy for the compact Enterprise panel inside the pricing
   * section only (components/marketing/sections/pricing.tsx) -- kept
   * separate from the fields above so the standalone /enterprise landing
   * page (app/(marketing)/enterprise/page.tsx) is unaffected.
   */
  sectionHeadlineLine1: "One training standard.",
  sectionHeadlineLine2: "Across your entire organization.",
  sectionCopy:
    "For universities, multi-location academies, and national flight training organizations that need consistent debriefs, measurable progress, and training visibility across every student, instructor, and location.",
  sectionPriceLabel: "Enterprise plans built around your program.",
  sectionSupportingLine:
    "Multi-campus university? National academy? Large Part 141 program? Let's build AfterFlight around your training operation.",
  capabilityTiles: [
    { title: "Standardized Debriefs", description: "One consistent process across every instructor and location." },
    { title: "Training Oversight", description: "See proficiency and training trends across the organization." },
    { title: "Campus Insights", description: "Compare progress and recurring training gaps by location." },
    { title: "Student Continuity", description: "Training history follows students across instructors and locations." },
    { title: "ACS Analytics", description: "Identify proficiency trends and systemic training gaps." },
    { title: "Integrations", description: "Connect AfterFlight with existing scheduling and training systems." },
  ],
  supportingLine:
    "Need AfterFlight across multiple locations, campuses, or training programs? Let's build the right plan for your organization.",
};
