// login/page.tsx

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GoogleButton } from './GoogleButton';
import { SignCard } from './SignCard';

export default function LoginUI() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  return (
    <div>
        <SignCard/>
    </div>
  );
}
