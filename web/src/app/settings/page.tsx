import { redirect } from 'next/navigation';
import { getSession } from '@/features/user/controllers/get-session';
import { getSubscription } from '@/features/user/controllers/get-subscription';
import { getProducts } from '@/features/billing/controllers/get-products';
import { ProfileContent } from '@/features/user/components/profile-content';

export default async function ProfilePage() {
  const [session, subscription, products] = await Promise.all([getSession(), getSubscription(), getProducts()]);

  if (!session) {
    redirect('/login');
  }

  return <ProfileContent session={session} subscription={subscription} products={products} />;
}
