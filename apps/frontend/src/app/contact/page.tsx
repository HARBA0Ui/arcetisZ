import type { Metadata } from "next";
import { ContactContent } from "./contact-content";

export const metadata: Metadata = {
  title: "Contact Arcetis",
  description: "Support, partnerships, and compliance contact information for Arcetis."
};

export default function ContactPage() {
  return <ContactContent />;
}
