import { isContentPublic } from "@/lib/content/visibility";
import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";
import Image from "next/image";
import { MarketingNav } from "@/components/marketing/nav";
import { ReferralTracker } from "@/components/marketing/referral-tracker";
import { appOrigin } from "@/lib/email";

// The Resources/Research column is added only when the content surface is
// public -- see lib/content/visibility.ts. Linking to gated pages from the
// footer of every page would be the most visible possible dead end.
const CONTENT_COLUMN = {
  title: "Resources",
  links: [
    { href: "/resources", label: "Resources" },
    { href: "/research", label: "Research" },
  ],
};

const FOOTER_COLUMNS = [
  {
    title: "Product",
    links: [
      { href: "/#how-it-works", label: "Features" },
      { href: "/#pricing", label: "Pricing" },
      { href: "/what-is-afterflight", label: "What Is AfterFlight?" },
    ],
  },

  {
    title: "Who It's For",
    links: [
      { href: "/instructors", label: "For CFIs" },
      { href: "/schools", label: "For Schools" },
      { href: "/enterprise", label: "Enterprise" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/login", label: "Log In" },
      { href: "/signup", label: "Sign Up" },
      // A visible way to reach a human. Someone weighing a $990/yr plan checks
      // whether there's a real company behind it, and every other support
      // address on the site is buried in the legal pages.
      { href: "mailto:support@getafterflight.com", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/terms", label: "Terms of Service" },
    ],
  },
];

/**
 * The marketing site has its own fixed light brand identity, independent of
 * the app's dark/light theme toggle (the old marketing page was the same
 * idea, just fixed to dark instead -- see git history). Most sections use
 * pinned hex values directly, but shared app components rendered here (e.g.
 * FlightScoreGauge, reused per the design brief for consistency) read
 * theme-reactive CSS custom properties internally -- pinning those variables
 * to their light-mode values on this wrapper makes shared components render
 * correctly here too, regardless of the visitor's site-wide theme state,
 * without touching the components themselves.
 *
 * Overriding the base tokens (--good, --hairline, etc.) alone isn't enough:
 * Tailwind's `@theme inline` utility variables (--color-good, --color-
 * hairline, etc, generated from those base tokens) get their computed value
 * frozen where they're first resolved (:root) and inherit as an already-
 * resolved value from there -- overriding the base token deeper in the tree
 * doesn't retroactively change it. Both sets need overriding here.
 */
const LIGHT_SCOPE_STYLE = {
  "--good": "#2f7a4e",
  "--good-ink": "#1d4e31",
  "--good-soft": "#dceee2",
  "--amber": "#b87621",
  "--amber-ink": "#6b4413",
  "--amber-soft": "#f3e3c8",
  "--danger": "#c0362b",
  "--danger-ink": "#7a2019",
  "--danger-soft": "#f8dcd8",
  "--foreground": "#101727",
  "--foreground-soft": "#56636f",
  "--foreground-faint": "#8c97a2",
  "--hairline": "#c7ccd1",
  "--surface": "#ffffff",
  "--surface-sunken": "#e9ebed",
  "--background": "#f4f5f6",
  "--color-good": "#2f7a4e",
  "--color-good-ink": "#1d4e31",
  "--color-good-soft": "#dceee2",
  "--color-amber": "#b87621",
  "--color-amber-ink": "#6b4413",
  "--color-amber-soft": "#f3e3c8",
  "--color-danger": "#c0362b",
  "--color-danger-ink": "#7a2019",
  "--color-danger-soft": "#f8dcd8",
  "--color-foreground": "#101727",
  "--color-foreground-soft": "#56636f",
  "--color-foreground-faint": "#8c97a2",
  "--color-hairline": "#c7ccd1",
  "--color-surface": "#ffffff",
  "--color-surface-sunken": "#e9ebed",
  "--color-background": "#f4f5f6",
} as CSSProperties;

export default function MarketingLayout({ children }: { children: ReactNode }) {
  const origin = appOrigin() ?? "https://getafterflight.com";
  const footerColumns = isContentPublic()
    ? [FOOTER_COLUMNS[0], CONTENT_COLUMN, ...FOOTER_COLUMNS.slice(1)]
    : FOOTER_COLUMNS;
  const siteJsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": `${origin}/#organization`,
        name: "AfterFlight",
        url: origin,
        logo: `${origin}/brand/afterflight-lockup-dark.svg`,
      },
      {
        "@type": "WebSite",
        "@id": `${origin}/#website`,
        name: "AfterFlight",
        url: origin,
        publisher: { "@id": `${origin}/#organization` },
      },
    ],
  };

  return (
    <div className="bg-white font-medium" style={LIGHT_SCOPE_STYLE}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(siteJsonLd) }} />
      <ReferralTracker />
      <MarketingNav />
      {children}
      <footer id="resources" className="border-t border-slate-200 bg-white px-6 pb-8 pt-16 text-sm">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-12 sm:flex-row sm:justify-between">
            <div className="max-w-xs">
              <Link href="/" className="flex items-center">
                <Image
                  src="/brand/afterflight-lockup-dark.svg"
                  alt="AfterFlight"
                  width={166}
                  height={26}
                  className="h-8 w-auto"
                />
              </Link>
              <p className="mt-4 text-pretty text-[#56636f]">
                AfterFlight captures the post-flight debrief and turns it into a structured plan for the next
                lesson&mdash;for students, CFIs, and flight schools.
              </p>
            </div>

            <div className="flex flex-wrap gap-x-12 gap-y-8">
              {footerColumns.map((column) => (
                <div key={column.title}>
                  <p className="text-xs font-bold uppercase tracking-wide text-[#101727]">{column.title}</p>
                  <ul className="mt-3 flex flex-col gap-2">
                    {column.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className="text-[#56636f] hover:text-[#101727]">
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-14 border-t border-slate-200 pt-8">
            <p className="text-xs text-[#56636f]">&copy; {new Date().getFullYear()} AfterFlight. Get better every flight.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
