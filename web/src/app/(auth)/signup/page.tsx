import SignUpUI from '@/features/auth/components/SignUpUI';
import { getSession } from '@/features/user/controllers/get-session';
import { getSubscription } from '@/features/user/controllers/get-subscription';
import { redirect } from 'next/navigation';

export default async function SignUpPage() {
  const session = await getSession();
  const subscription = await getSubscription();

  if (session) {
    redirect('/dashboard');
  }

  // if (session && subscription) {
  //   redirect('/dashboard');
  // }

  // if (session && !subscription) {
  //   redirect('/pricing');
  // }

  return <SignUpUI />;
}
