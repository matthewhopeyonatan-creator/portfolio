import CursorTag from "@/components/CursorTag";
import VisitLogger from "@/components/VisitLogger";
import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { CartProvider } from "@/components/cart/CartContext";
import CartDrawer from "@/components/cart/CartDrawer";
import MenuDrawer from "@/components/MenuDrawer";
import SmoothScroll from "@/components/SmoothScroll";

const hostGrotesk = localFont({
  src: [
    { path: "./fonts/HostGrotesk-Variable.woff2", weight: "300 800", style: "normal" },
    { path: "./fonts/HostGrotesk-Variable-Italic.woff2", weight: "300 800", style: "italic" },
  ],
  variable: "--font-sans",
  display: "swap",
});

// Display face for the "hope's grocer" wordmark.
// NOTE: these are the Fontspring DEMO cuts — swap in licensed files before launch.
const atelierFleur = localFont({
  src: [
    { path: "./fonts/AtelierFleur-Regular.woff2", weight: "400", style: "normal" },
    { path: "./fonts/AtelierFleur-Bold.woff2", weight: "700", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

// CrowdVolt's own UI faces, only for the product screens rebuilt in its case study
// (components/TicketmasterPhones.tsx) — not preloaded, they're far down a popup
const spaceGrotesk = localFont({
  src: [{ path: "./fonts/SpaceGrotesk-Variable.woff2", weight: "300 700", style: "normal" }],
  variable: "--font-cv",
  display: "swap",
  preload: false,
});

// stand-ins for The Inquirer's own faces (Grot10 Condensed, Inquirer Headline) in its case
// study's rebuilt screens (components/PhillyForYou.tsx)
const inqCondensed = localFont({
  src: [{ path: "./fonts/BarlowCondensed-Bold.woff2", weight: "700", style: "normal" }],
  variable: "--font-inq-cond",
  display: "swap",
  preload: false,
});
const inqHeadline = localFont({
  src: [{ path: "./fonts/SourceSerif4-Variable.woff2", weight: "200 900", style: "normal" }],
  variable: "--font-inq-head",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL("https://hopesgrocer.com"),
  title: "hope’s grocer - Matthew Hope Portfolio",
  description:
    "Matthew Hope is a product designer in New York. Science-trained mind, designer's hands.",
  // the card a shared link shows (iMessage, Slack, LinkedIn…)
  openGraph: {
    title: "hope’s grocer - Matthew Hope Portfolio",
    description:
      "Matthew Hope is a product designer in New York. Science-trained mind, designer's hands.",
    siteName: "hope’s grocer",
    type: "website",
    // the picture is app/opengraph-image.png: a snapshot of the landing page
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: "#edece9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${hostGrotesk.variable} ${atelierFleur.variable} ${spaceGrotesk.variable} ${inqCondensed.variable} ${inqHeadline.variable}`}
      suppressHydrationWarning
    >
      <body>
        <CartProvider>
          <SmoothScroll />
          {children}
          <MenuDrawer />
          <CartDrawer />
          <CursorTag />
          <VisitLogger />
        </CartProvider>
      </body>
    </html>
  );
}
