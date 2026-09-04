import { redirect } from 'next/navigation';

export default async function LegacyChatRedirect({ params }) {
  const { businessSlug } = await params;
  redirect(`/${businessSlug}/chat`);
}
