import React from 'react';
import Image from 'next/image';
import { handleGoogleAuth } from '../services/auth';

export const GoogleButton = ({ loading , isSignup }: { loading?: boolean , isSignup? : boolean}) => {
  return (
    <div className='flex justify-center mx-auto w-fit'>
      <button
        onClick={handleGoogleAuth}
        disabled={loading}
        className='w-full px-12 py-2.5 rounded-xl hover:bg-white/10 bg-white/15 text-white/90 flex items-center justify-center space-x-2 transition-colors duration-300
         '
      >
       {isSignup ? 'Sign up with Google' : 'Sign in with Google'}  
      </button>
    </div>
  );
};
