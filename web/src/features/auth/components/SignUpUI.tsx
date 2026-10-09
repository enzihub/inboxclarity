// signup/page.tsx

'use client';

import { useState } from 'react';
import { GoogleButton } from './GoogleButton';
import { Sign } from 'crypto';
import { SignCard } from './SignCard';

export default function SignUpUI() {
  const [loading, setLoading] = useState(false);

  return (
    <div>
      <SignCard isSignup={true} />
      <div className='flex items-center justify-center max-w-xs w-full mx-auto px-4'>
        <p className="text-center text-white/40 mt-8 text-lg font-light">
          By signing up, you agree to our
          <a href="/privacy-policy" className=" hover:text-white/60"> Privacy Policy </a>
          and
          <a href="/tos" className=" hover:text-white/60"> Terms of Service </a>
        </p>
      </div>
    </div>
  );
}
