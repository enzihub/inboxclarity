import { PropsWithChildren, ReactNode } from 'react';

interface CardProps {
  icon?: ReactNode;
  title: string;
  footer?: ReactNode;
}

export function Card({ icon, title, footer, children }: PropsWithChildren<CardProps>) {
  return (
    <div className='rounded-xl'>
      <div className='p-8'>
        <div className='flex items-center gap-3 mb-6'>
          {icon}
          <h2 className='text-lg text-white/90 font-medium'>{title}</h2>
        </div>
        <div className='py-4'>{children}</div>
      </div>
      {footer && <div className='flex justify-end rounded-b-xl '>{footer}</div>}
    </div>
  );
}
