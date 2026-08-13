import type { Metadata, Viewport } from "next";
import { Big_Shoulders, Public_Sans } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const THEME_INIT_SCRIPT = `
try {
  var stored = localStorage.getItem("flightbrief-theme");
  var theme = stored === "light" || stored === "dark"
    ? stored
    : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  document.documentElement.setAttribute("data-theme", theme);
} catch (e) {}
`;

const bigShoulders = Big_Shoulders({
  variable: "--font-big-shoulders",
  weight: ["600", "700", "800"],
  subsets: ["latin"],
});

const publicSans = Public_Sans({
  variable: "--font-public-sans",
  weight: ["400", "500", "600", "700", "800"],
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlightBrief — Never lose a lesson",
  description: "Record the debrief you're already having. FlightBrief turns it into the plan for your next flight.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f1f4f6" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f1a" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${bigShoulders.variable} ${publicSans.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        <Script id="theme-init" strategy="beforeInteractive">
          {THEME_INIT_SCRIPT}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
