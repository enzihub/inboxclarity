import { supabaseAdminClient } from '@/lib/supabase/supabase-admin';
import { Database } from '@/lib/supabase/types';
import Stripe from 'stripe';

type Product = Database['public']['Tables']['products']['Row'];

export async function upsertProduct(product: Stripe.Product) {
  const productData: Product = {
    id: product.id,
    active: product.active,
    name: product.name,
    description: product.description ?? null,
    image: product.images?.[0] ?? null,
    metadata: product.metadata,
  };

  const { error } = await supabaseAdminClient.from('products').upsert([productData]);

  if (error) {
    throw error;
  } else {
    console.info(`Product inserted/updated: ${product.id}`);
  }
}
