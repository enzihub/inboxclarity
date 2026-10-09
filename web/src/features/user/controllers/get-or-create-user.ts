import { supabaseAdminClient } from '@/lib/supabase/supabase-admin';

export async function getOrCreateUser({ email }: { email: string }) {
  const { data, error } = await supabaseAdminClient
    .from('users')
    .select('*')
    .eq('email', email)
    .single();

  if (error || !data) {
    const userData = {
      email,
      // Add any other fields needed for the user
    } as const;

    const { data: createdUser, error: createError } = await supabaseAdminClient
      .from('users')
      .insert([userData])
      .select()

    if (createError) {
      throw createError;
    }

    return createdUser![0];
  }

  return data;
}