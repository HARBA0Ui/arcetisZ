import type { Metadata } from "next";
import { AboutContent } from "./about-content";

export const metadata: Metadata = {
  title: "About Arcetis",
  description: "Learn how Arcetis turns daily activity into rewards, referrals, and sponsor campaigns."
};

export default function AboutPage() {
  return <AboutContent />;
}
