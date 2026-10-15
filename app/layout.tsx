import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

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

export const metadata: Metadata = {
  title: "Matthew Hope — Product Designer",
  description:
    "Matthew Hope is a product designer in New York. Science-trained mind, designer's hands.",
};

export const viewport: Viewport = {
  themeColor: "#edece9",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${hostGrotesk.variable} ${atelierFleur.variable}`}>
      <body>{children}</body>
    </html>
  );
}
