import { stripeAdmin } from '@/lib/stripe/stripe-admin';
import { supabaseAdminClient } from '@/lib/supabase/supabase-admin';
import { Database } from '@/lib/supabase/types';
import { toDateTime } from '@/shared/utils/to-date-time';
import { AddressParam } from '@stripe/stripe-js';

import Stripe from 'stripe';

export async function upsertUserSubscription({email,
  subscriptionId,
  customerId,
  isCreateAction,
}: {
  email?: string;
  subscriptionId: string;
  customerId: string;
  isCreateAction?: boolean;
}) {
  // Get customer's userId from mapping table.
  // const { data: customerData, error: noCustomerError } = await supabaseAdminClient
  //   .from('customers')
  //   .select('id')
  //   .eq('stripe_customer_id', customerId)
  //   .single();
  // if (noCustomerError) throw noCustomerError;

  // const { id: userId } = customerData!;

  let userData = null;
  if (email) {
    let { data: data, error: noCustomerError } = await supabaseAdminClient
      .from('users')
      .select('id')
      .eq('email', email)
      .single();
    if (noCustomerError) throw noCustomerError;

    userData = data;
  }

  const { id: userId } = userData!;

  const subscription = await stripeAdmin.subscriptions.retrieve(subscriptionId, {
    expand: ['default_payment_method'],
  });

  // Upsert the latest status of the subscription object.
  if (subscription && subscription.items && subscription.items.data.length > 0) {
    const subscriptionData: Omit<Database['public']['Tables']['subscriptions']['Insert'], 'email'> = {
      id: subscription.id,
      user_id: userId,
      metadata: subscription.metadata,
      status: subscription.status,
      price_id: subscription.items.data[0].price.id,
      cancel_at_period_end: subscription.cancel_at_period_end,
      cancel_at: subscription.cancel_at ? toDateTime(subscription.cancel_at).toISOString() : null,
      canceled_at: subscription.canceled_at ? toDateTime(subscription.canceled_at).toISOString() : null,
      current_period_start: toDateTime(subscription.current_period_start).toISOString(),
      current_period_end: toDateTime(subscription.current_period_end).toISOString(),
      created: toDateTime(subscription.created).toISOString(),
      ended_at: subscription.ended_at ? toDateTime(subscription.ended_at).toISOString() : null,
      trial_start: subscription.trial_start ? toDateTime(subscription.trial_start).toISOString() : null,
      trial_end: subscription.trial_end ? toDateTime(subscription.trial_end).toISOString() : null,
    };

    const finalSubscriptionData: Database['public']['Tables']['subscriptions']['Insert'] = {
      ...subscriptionData,
      ...(email && { email }), // Conditionally add email if it exists
    };

    const { error } = await supabaseAdminClient.from('subscriptions').upsert([finalSubscriptionData]);
      if (error) {
        throw error;
      }
  } else {
    console.error('Invalid subscription data or empty items array');
  }


  // console.info(`Inserted/updated subscription [${subscription.id}] for user [${userId}]`);

  // TODO: check below function
  // // For a new subscription copy the billing details to the customer object.
  // // NOTE: This is a costly operation and should happen at the very end.
  // if (isCreateAction && subscription.default_payment_method && userId) {
  //   await copyBillingDetailsToCustomer(userId, subscription.default_payment_method as Stripe.PaymentMethod);
  // }
}

// const copyBillingDetailsToCustomer = async (userId: string, paymentMethod: Stripe.PaymentMethod) => {
//   const customer = paymentMethod.customer;
//   if (typeof customer !== 'string') {
//     throw new Error('Customer id not found');
//   }
//
//   const { name, phone, address } = paymentMethod.billing_details;
//   if (!name || !phone || !address) return;
//
//   await stripeAdmin.customers.update(customer, { name, phone, address: address as AddressParam });
//
//   const { error } = await supabaseAdminClient
//     .from('users')
//     .update({
//       billing_address: { ...address },
//       payment_method: { ...paymentMethod[paymentMethod.type] },
//     })
//     .eq('id', userId);
//
//   if (error) {
//     throw error;
//   }
// };
