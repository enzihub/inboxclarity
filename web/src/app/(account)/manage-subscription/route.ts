// manage-subscription.ts

import { redirect } from 'next/navigation';
import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { getSession } from '@/features/user/controllers/get-session';
import { getCustomerId } from '@/features/user/controllers/get-customer-id';
import { getURL } from '@/shared/utils/get-url';

export const dynamic = 'force-dynamic';

export async function GET() {
  // 1. Get the user from session
  const session = await getSession();

  if (!session || !session.user.id) {
    throw Error('Could not get userId');
  }

  // 2. Retrieve or create the customer in Stripe
  const customer = await getCustomerId({
    userId: session.user.id,
  });

  if (!customer) {
    throw Error('Could not get customer');
  }

  // 3. Create portal link and redirect user
  const { url } = await stripeAdmin.billingPortal.sessions.create({
    customer,
    return_url: `${getURL()}/dashboard`,
  });

  redirect(url);
}
