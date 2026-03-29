import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "arcetis backoffice",
  description: "Arcetis admin backoffice"
};

export default function BackofficeLayout({ children }: { children: React.ReactNode }) {
  return children;
}
