import type { Metadata } from "next";
import { PrivacyContent } from "./privacy-content";

export const metadata: Metadata = {
  title: "Arcetis Privacy Policy",
  description: "Understand what data Arcetis collects, how it is used, and what controls members have."
};

export default function PrivacyPage() {
  return <PrivacyContent />;
}
