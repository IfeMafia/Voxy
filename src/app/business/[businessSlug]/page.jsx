import { redirect } from 'next/navigation';

export default async function LegacyBusinessRedirect({ params }) {
  const { businessSlug } = await params;
  redirect(`/${businessSlug}`);
}
