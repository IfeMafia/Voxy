import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Privacy Policy",
  description: "Learn how Voxy handles and protects your business and customer data.",
});

export default function PrivacyLayout({ children }) {
  return children;
}
