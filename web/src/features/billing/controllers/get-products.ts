import { createClient } from '@/lib/supabase/server';

export async function getProducts() {
  const supabase = createClient();

  const { data, error } = await supabase
    .from('products')
    .select('*, prices(*)')
    .eq('name', 'InboxClarity')
    .eq('active', true)
    .eq('prices.active', true)
    .order('metadata->index')
    .order('unit_amount', { referencedTable: 'prices' });

  if (error) {
    console.error(error.message);
  }

  return data ?? [];
}
