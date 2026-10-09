// profile-card.tsx
import { User } from 'lucide-react';
import { formatDate } from '../utils/date-utils';

export function ProfileDetailsCard({ user }: { user: any }) {
  return (
    <div className=' rounded-xl p-6'>
      <div className='flex items-center gap-3 mb-4'>
        <User className='w-5 h-5 text-[#BF8811]' />
        <h2 className='text-white/90 font-medium'>Profile Details</h2>
      </div>

      <div className='space-y-4'>
        <div className='flex items-center gap-4'>
          <img
            src={user.user_metadata.avatar_url || '/images/logo.png'}
            alt={user.user_metadata.full_name || 'Profile'}
            className='w-14 h-14 rounded-full'
          />
          <div>
            <p className='text-sm text-white/60'>Email</p>
            <p className='font-semibold text-white/90'>{user.email}</p>
          </div>
        </div>

        <div className='grid grid-cols-2 gap-3'>
          <div className='p-3  rounded-lg'>
            <p className='text-sm text-white/60'>Status</p>
            <p className='font-medium text-white/90'>{user.email_confirmed_at ? '✅ Active' : '⏳ Pending'}</p>
          </div>
          <div className='py-3 px-6 rounded-lg'>
            <p className='text-sm text-white/60'>Member Since</p>
            <p className='font-medium text-white/90'>{formatDate(user.created_at)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
