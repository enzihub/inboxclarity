import LoginUI from '@/features/auth/components/LoginUI';
import { getSession } from '@/features/user/controllers/get-session';
import { getSubscription } from '@/features/user/controllers/get-subscription';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session && subscription) {
    redirect('/dashboard');
  }

  // if (session && subscription) {
  //   redirect('/dashboard');
  // }

  // if (session && !subscription) {
  //   redirect('/pricing');
  // }

  return <LoginUI />;
}
