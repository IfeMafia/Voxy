import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Admin Dashboard",
  description: "Secure management portal for Voxy platform operations and monitoring.",
  noIndex: true, // Crucial for security
});

export default function LighthouseLayout({ children }) {
  return children;
}
