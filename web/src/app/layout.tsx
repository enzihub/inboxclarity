'use client';

import localFont from 'next/font/local';
import './globals.css';
import { GoogleAnalytics, GoogleTagManager } from '@next/third-parties/google';
import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
});

const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
});

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang='en'>
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
      <div className='flex flex-col min-h-screen bg-black'>
        <div className='flex-1 flex flex-col max-w-5xl mx-auto px-4 w-full'>
          <Navbar/>
          <main className='flex-1 flex items-center justify-center'>{children}</main>
          <Footer/>
        </div>
      </div>
      {process.env.NEXT_PUBLIC_GA_ID && <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID}/>}
      {process.env.NEXT_PUBLIC_GTM_ID && <GoogleTagManager gtmId={process.env.NEXT_PUBLIC_GTM_ID}/>}
      </body>
    </html>
  );
}
