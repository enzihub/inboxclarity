'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '../shared/hooks/use-user';

export default function Home() {
  const { user, loading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      router.push('/dashboard');
    }
  }, [loading, user, router]);

  return <div>Loading...</div>;
}
