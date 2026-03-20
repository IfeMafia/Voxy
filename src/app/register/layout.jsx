import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Sign Up",
  description: "Create your Voxy account to build and deploy your AI business assistant in minutes.",
});

export default function RegisterLayout({ children }) {
  return children;
}
