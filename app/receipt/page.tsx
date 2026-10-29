import type { Metadata } from "next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { PageThemeToggle } from "@/components/ThemeToggle";
import Receipt from "@/components/Receipt";

export const metadata: Metadata = {
  title: "Your receipt — hope’s grocer",
  description: "A summary of your visit to hope’s grocer, Matthew Hope’s portfolio.",
  robots: { index: false },
};

export default function ReceiptPage() {
  return (
    <>
      <SiteHeader />
      <PageThemeToggle />
      <Receipt />
      <SiteFooter />
    </>
  );
}
