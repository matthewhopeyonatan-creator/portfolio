import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import RevealOnScroll from "@/components/RevealOnScroll";
import GrocersSelects from "@/components/GrocersSelects";

export const metadata: Metadata = {
  title: "Graphics — hope’s grocer",
  description: "Some of Matthew Hope’s favourite graphic design pieces, made for play and for function.",
};

/** Grocer's Selects, the poster shelf, on a page of its own (it used to close the homepage). */
export default function GraphicsPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <GrocersSelects />
      </main>
      <SiteFooter />
      <RevealOnScroll />
    </>
  );
}
