import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Terms of Service",
  description: "Read the terms and conditions for using Voxy AI platform.",
});

export default function TermsLayout({ children }) {
  return children;
}
