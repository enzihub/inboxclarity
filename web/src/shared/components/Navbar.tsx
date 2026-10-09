'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useUser } from '../hooks/use-user';

const Navbar = () => {
  const pathname = usePathname();
  const { user, loading } = useUser();
  const [isOpen, setIsOpen] = useState(false);

  // Common navigation items
  const navItems = [
    ...(user
      ? [
          { href: '/dashboard', label: 'Dashboard' },
          { href: '/settings', label: 'Settings' },
        ]
      : [
          { href: '/login', label: 'Login' },
          { href: '/signup', label: 'Sign Up', isSpecial: false},
        ]),
  ];

  // Common link styles with active state
  const getLinkStyles = (href: string) => {
    const isActive = pathname === href;
    return `transition-colors duration-500 ${
      isActive ? 'text-white/90' : 'text-white/60 hover:text-white/90'
    }`;
  };

  const mobileItemStyles = 'block px-3 py-2';

  const NavLink = ({ item, isMobile = false }: any) => {
    if (item.isButton) {
      return (
        <button
          onClick={() => {
            item.onClick();
            isMobile && setIsOpen(false);
          }}
          className={`${getLinkStyles('')} ${isMobile ? `${mobileItemStyles} w-full text-left` : ''}`}
        >
          {item.label}
        </button>
      );
    }

    return (
      <Link
        href={item.href}
        onClick={() => isMobile && setIsOpen(false)}
        className={`
          ${getLinkStyles(item.href)}
          ${item.isSpecial ? 'mainButton px-6 py-2' : ''}
          ${isMobile ? mobileItemStyles : ''}
        `}
      >
        {item.label}
      </Link>
    );
  };

  return (
    <nav className='py-4 px-8 z-10 transition-all duration-500 font-medium gap-2.5'>
      <div className='mx-auto'>
        <div className='flex justify-between items-center h-16'>

          {/* logo */}
           <Link href='/' className='flex items-center'>
            <img src='/images/logo.png' alt='InboxClarity logo' className='w-12 h-auto' />
          </Link>
        

          {/* Desktop Navigation */}
          <div className='hidden md:flex bg-white/15 px-4 py-2 rounded-xl items-center space-x-6'>
            {navItems.map((item) => (
              <NavLink key={item.label} item={item} />
            ))}
          </div>


          {/* Mobile menu button */}
          <div className='md:hidden'>
            <button
              onClick={() => setIsOpen(!isOpen)}
              className='text-gray-700 focus:outline-none transition-colors duration-500'
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className={`md:hidden overflow-hidden transition-all duration-500 ease-in-out ${isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className='px-2 pt-2 pb-3 space-y-1'>
            {navItems.map((item) => (
              <NavLink key={item.label} item={item} isMobile={true} />
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
