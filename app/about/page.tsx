import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RevealOnScroll from "@/components/RevealOnScroll";
import { PageThemeToggle } from "@/components/ThemeToggle";
import About from "@/components/About";

export const metadata: Metadata = {
  title: "About — hope’s grocer",
  description:
    "Matthew Hope is a product designer who grew up in Jakarta, Indonesia — curious, and always down to do something new.",
};

export default function AboutPage() {
  return (
    <>
      <SiteHeader />
      <PageThemeToggle />
      <About />
      <SiteFooter />
      <RevealOnScroll />
    </>
  );
}
