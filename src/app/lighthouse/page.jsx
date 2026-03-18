import { redirect } from 'next/navigation';

export default function LighthousePage() {
  // Should normally be handled by middleware, but redirect just in case
  redirect('/lighthouse/dashboard');
}
