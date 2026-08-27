import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";
import Script from "next/script";
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

const THEME_INIT_SCRIPT = `
try {
  var stored = localStorage.getItem("afterflight-theme");
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
} catch (e) {}
`;

// One variable family for both display and body copy -- "Archivo Expanded"
// in the brand sheet is Archivo's own wdth axis at its max, not a second font.
const archivo = Archivo({
  variable: "--font-archivo",
  weight: "variable",
  axes: ["wdth"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AfterFlight — Get better every flight.",
  description: "Record the debrief you're already having. AfterFlight turns it into the plan for your next flight.",
};

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
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
        <Script id="ms-clarity" strategy="afterInteractive">
          {CLARITY_SCRIPT}
        </Script>
      </head>
      <body className="min-h-dvh flex flex-col">{children}</body>
    </html>
  );
}
