import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Contact Us",
  description: "Get in touch with the Voxy team for support, demos, or partnership inquiries.",
});

export default function ContactLayout({ children }) {
  return children;
}
