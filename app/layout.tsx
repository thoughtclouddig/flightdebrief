import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Script from "next/script";
import { EnvironmentBanner } from "@/components/environment-banner";
import { ThemeInitializer } from "@/components/theme-initializer";
import { resolveTitlePrefix } from "@/lib/build-info";
import "./globals.css";

// Microsoft Clarity (session recording/heatmaps) -- loaded site-wide, not
// just on marketing pages, since it needs to cover the actual product app
// pages the live demo (app/api/demo/start) drops visitors into, not just the
// /demo landing page itself.
const CLARITY_SCRIPT = `
(function(c,l,a,r,i,t,y){
    c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
    t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
    y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
})(window, document, "clarity", "script", "y7f62u4xjr");
`;

// One variable family for both display and body copy -- "Archivo Expanded"
// in the brand sheet is Archivo's own wdth axis at its max, not a second font.
const archivo = Archivo({
  variable: "--font-archivo",
  weight: "variable",
  axes: ["wdth"],
  subsets: ["latin"],
});

const BASE_TITLE = "AfterFlight — Get better every flight.";
const DESCRIPTION = "Record the debrief you're already having. AfterFlight turns it into the plan for your next flight.";

// [DEV]/[STAGING] prefix on every browser tab, not just this default title:
// title.template applies to any page's own title string too, so a page that
// sets its own `title` still gets prefixed without itself knowing about
// environments. Production sets no prefix and no template -- tabs there
// look exactly as they always have.
//
// A function, not a top-level `const` -- this used to be `const ENV_TAG =
// getAppEnv() === ...`, evaluated exactly once when this module was first
// loaded into a given server process, then frozen and reused for every
// request that process ever served afterward. On a real deployment this
// produced a live "[DEV] AfterFlight" title on the production domain: this
// layout's <EnvironmentBanner /> forces the route into per-request dynamic
// rendering (see that component's own comment), so generateMetadata now runs
// fresh on every request too, the same way any other dynamic route's
// metadata does -- getAppEnv() (via resolveTitlePrefix, lib/build-info.ts) is
// read live instead of captured once.
export async function generateMetadata(): Promise<Metadata> {
  const envTag = resolveTitlePrefix();
  return {
    title: envTag ? { default: `${envTag}${BASE_TITLE}`, template: `${envTag}%s` } : BASE_TITLE,
    description: DESCRIPTION,
  };
}

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4f5f6" },
    { media: "(prefers-color-scheme: dark)", color: "#101727" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} min-h-dvh antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col">
        <EnvironmentBanner />
        <ThemeInitializer />
        {children}
        <Script id="ms-clarity" strategy="afterInteractive">
          {CLARITY_SCRIPT}
        </Script>
      </body>
    </html>
  );
}
