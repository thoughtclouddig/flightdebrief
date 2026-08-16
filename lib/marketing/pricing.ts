export interface PricingTier {
  id: "pilot" | "cfi" | "flight-school-pro";
  name: string;
  audience: string;
  price: string;
  priceSuffix: string;
  priceNote?: string;
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

export const PRICING_TIERS: PricingTier[] = [
  {
    id: "pilot",
    name: "Pilot",
    audience: "For individual pilots and students.",
    price: "$9.99",
    priceSuffix: "/mo",
    priceNote: "or $99/year — save 17%",
    features: [
      "Unlimited debriefs",
      "FlightScore progress tracking",
      "ACS-connected feedback",
      "Custom checklists & goals",
      "Works on all devices",
      "7-day free trial",
    ],
    cta: "Start Free Trial",
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
    featuredLabel: "Free for CFIs",
    features: [
      "Guided debriefs with every student",
      "ACS-aligned feedback tools",
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
    audience: "For independent flight schools and individual training locations.",
    price: "$99",
    priceSuffix: "/month/location",
    features: [
      "School dashboard",
      "Student & CFI management",
      "Training progress visibility",
      "ACS skill trends",
      "Debrief adoption & activity",
      "Location-level reporting",
    ],
    cta: "Start Free Trial",
    signupHref: "/signup/school",
    analyticsEvent: "select_school_pro",
    upsell: {
      text: "Multiple locations, campuses, or training programs?",
      linkLabel: "Enterprise",
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
  supportingLine:
    "Need AfterFlight across multiple locations, campuses, or training programs? Let's build the right plan for your organization.",
};
