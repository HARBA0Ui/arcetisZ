import type { Metadata } from "next";
import { TermsContent } from "./terms-content";

export const metadata: Metadata = {
  title: "Arcetis Terms & Conditions",
  description: "Terms governing account usage, rewards, sponsored campaigns, and member conduct on Arcetis."
};

export default function TermsPage() {
  return <TermsContent />;
}
