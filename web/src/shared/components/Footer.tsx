'use client';
import Image from 'next/image';
import Link from 'next/link';
import React from "react";

const Footer = () => {
  return (
    <footer className='mt-16 py-4 px-8 z-10 w-full transition-all duration-500 font-medium gap-2.5 text-base'>
      <div className='flex flex-col justify-center text-center items-center text-white/60 md:items-center md:flex-row md:justify-between'>

        <div className="flex flex-col md:text-start">
          <p>All Rights Reserved © 2025</p>
          <h1 className="h-10 mt-4 text-white/90 font-semibold">Need help?</h1>
          {process.env.NEXT_PUBLIC_SUPPORT_EMAIL && <p>Email us at {process.env.NEXT_PUBLIC_SUPPORT_EMAIL}.</p>}
          <p>We&apos;re here to assist you.</p>
        </div>


        <div className="flex flex-col flex-1 max-w-sm mt-8 md:text-end  md:mt-0 md:self-start">
          <p>Made with love by Enzi Studio</p>
          <p className='mt-14'><i>Our Mission:</i> Give busy professionals the clarity they need, every morning, in minutes.</p>
        </div>
      </div>


      <div className='flex flex-col md:flex-row justify-between text-lg items-center text-white/60 mt-8 md:mt-0'>
        <div className='mb-4 md:mb-0 flex items-baseline'>
          <img src='/images/logo.png' alt='InboxClarity logo' className='w-8 h-auto'/>
        </div>
        <div className="flex gap-5 justify-center md:justify-end py-8 text-base items-start text-white/70">
          <Link href="/tos" className='text-white/70 hover:text-white/70 transition-colors'>
            Terms of Service
          </Link>
          <Link href="/privacy-policy" className='text-white/70 hover:text-white/70 transition-colors'>
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;