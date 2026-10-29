import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageThemeToggle } from "@/components/ThemeToggle";
import Catalog from "@/components/Catalog";

export const metadata: Metadata = {
  title: "Catalog — hope’s grocer",
  description: "Everything else on the shelves: graphics, florals, cooking, events and photography.",
};

export default function CatalogPage() {
  return (
    <>
      <SiteHeader />
      <PageThemeToggle />
      <Catalog />
      <SiteFooter />
    </>
  );
}
