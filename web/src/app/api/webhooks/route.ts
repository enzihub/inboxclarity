import Stripe from 'stripe';

import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { upsertPrice } from '@/features/billing/controllers/upsert-price';
import { upsertProduct } from '@/features/billing/controllers/upsert-product';
import { upsertUserSubscription } from '@/features/user/controllers/upsert-user-subscription';
import { getEnvVar } from '@/shared/utils/get-env-var';
import { getOrCreateUser } from '@/features/user/controllers/get-or-create-user';

const relevantEvents = new Set([
  'product.created',
  'product.updated',
  'price.created',
  'price.updated',
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
]);

export async function POST(req: Request) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature') as string;
  const webhookSecret = getEnvVar(process.env.STRIPE_WEBHOOK_SECRET, 'STRIPE_WEBHOOK_SECRET');
  let event: Stripe.Event;

  try {
    if (!sig || !webhookSecret) return;
    event = stripeAdmin.webhooks.constructEvent(body, sig, webhookSecret);
  } catch (error) {
    return Response.json(`Webhook Error: ${(error as any).message}`, { status: 400 });
  }

  if (relevantEvents.has(event.type)) {
    try {
      // Add this check to filter for InboxClarity products
      if ((event.data.object as any)?.metadata.app_code !== 'inboxclarity') return Response.json({ received: true });

      switch (event.type) {
        case 'product.created':
        case 'product.updated':
          await upsertProduct(event.data.object as Stripe.Product);
          break;
        case 'price.created':
        case 'price.updated':
          await upsertPrice(event.data.object as Stripe.Price);
          break;
        case 'customer.subscription.created':
        case 'customer.subscription.updated':
        case 'customer.subscription.deleted':
          const subscription = event.data.object as Stripe.Subscription;
          await upsertUserSubscription({
            subscriptionId: subscription.id,
            customerId: subscription.customer as string,
            isCreateAction: false,
          });
          break;
        case 'checkout.session.completed':
          const checkoutSession = event.data.object as Stripe.Checkout.Session;

          const customerId = checkoutSession.customer as string;

          // Get the customer details including the email
          const customer: any = await stripeAdmin.customers.retrieve(customerId);

          if (checkoutSession.mode === 'subscription') {
            const subscriptionId = checkoutSession.subscription;

            // 2. Retrieve or create the customer in Stripe
            await getOrCreateUser({
              email: customer.email,
            });

            await upsertUserSubscription({
              email: customer.email as string,
              subscriptionId: subscriptionId as string,
              customerId: checkoutSession.customer as string,
              isCreateAction: true,
            });
          }
          break;
        default:
          throw new Error('Unhandled relevant event!');
      }
    } catch (error) {
      console.error(error);
      return Response.json('Webhook handler failed. View your nextjs function logs.', {
        status: 400,
      });
    }
  }
  return Response.json({ received: true });
}
