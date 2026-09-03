import type { Metadata, Viewport } from "next";
import { Inter, Sora } from "next/font/google";
import { MotionProvider } from "@/components/providers/MotionProvider";
import { BRAND } from "@/lib/site";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.heroSub,
  applicationName: BRAND.name,
  keywords: [
    "cargo booking",
    "truck booking",
    "moving trucks",
    "logistics platform",
    "HaulioCargo",
  ],
  openGraph: {
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.heroSub,
    siteName: BRAND.name,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.heroSub,
  },
};

export const viewport: Viewport = {
  themeColor: "#050505",
  colorScheme: "dark",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * `suppressHydrationWarning` covers attributes injected onto <html> before
     * React loads — password managers, translation tools and mobile in-app
     * browsers all do it (one was seen adding `__gcrremoteframetoken`). React
     * would otherwise log a hydration mismatch we cannot fix, since the markup
     * is altered outside our control. This applies to THIS element only and
     * does not mask mismatches anywhere else in the tree.
     */
    <html
      lang="en"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
      className={`${sora.variable} ${inter.variable}`}
    >
      <body className="bg-ink-950 antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-100 focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2.5 focus:font-display focus:text-sm focus:font-semibold focus:text-black"
        >
          Skip to content
        </a>
        <MotionProvider>{children}</MotionProvider>
      </body>
    </html>
  );
}
