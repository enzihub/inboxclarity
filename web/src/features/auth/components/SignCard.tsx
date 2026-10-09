
import React from 'react'
import { GoogleButton } from './GoogleButton'
import { useState } from 'react';
export const SignCard = ({isSignup}: {isSignup? :boolean}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  return (
    <div className='flex items-center justify-center'>
      <div className='max-w-lg w-full bg-gradient-to-br from-white/15 from-10% to-white/10 rounded-3xl shadow-lg p-8'>
        <p className='text-center text-white/60 mb-8 text-xl font-normal'>
          {isSignup ? "Welcome to InboxClarity, we're excited to help you start your days with clarity and control." : "Welcome back! We're excited to help you start your days with clarity and control."}
        </p>
        <GoogleButton loading={loading} isSignup={isSignup}/>
      </div>
    </div>
  )
}
