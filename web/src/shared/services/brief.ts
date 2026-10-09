import { SupabaseClient } from '@supabase/supabase-js';

const DEFAULT_API_URL = process.env.NEXT_PUBLIC_CORE_API_URL;

type SendBriefOptions = {
  apiUrl?: string;
};

export const sendBriefNow = async (supabase: SupabaseClient, userId: string, email: string, options: SendBriefOptions = {}) => {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) throw new Error('No active session');

  const apiUrl = options.apiUrl || DEFAULT_API_URL;

  const response = await fetch(`${apiUrl}/send-newsletter`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ userId, email }),
  });

  if (!response.ok) throw new Error(await response.text());
  return response.json();
};
