import { constructMetadata } from "@/lib/seo";

export const metadata = constructMetadata({
  title: "Login",
  description: "Sign in to your Voxy account to manage your business AI assistant and customer conversations.",
});

export default function LoginLayout({ children }) {
  return children;
}
