// account-actions-card.tsx
import { Settings, ChevronDown, ChevronUp, LogOut } from 'lucide-react';
import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function AccountActionsCard({ user }: { user: any }) {
  const [showMoreDetails, setShowMoreDetails] = useState(false);
  const supabase = createClient();

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  return (
    <div className=' rounded-xl p-6'>
      <div className='flex items-center gap-3 mb-4'>
        <Settings className='w-5 h-5 text-[#BF8811]' />
        <h2 className='text-lg font-medium text-white/90'>Account Actions</h2>
      </div>

      <div className='space-y-3'>
        <button
          onClick={() => setShowMoreDetails(!showMoreDetails)}
          className='w-full flex items-center justify-between py-2 px-4 rounded-lg text-sm text-white/60'
        >
          Account Details
          {showMoreDetails ? <ChevronUp className='w-4 h-4' /> : <ChevronDown className='w-4 h-4' />}
        </button>

        {showMoreDetails && (
          <div className='p-3 bg-gray-900 rounded-lg space-y-2'>
            <p className='text-sm'>
              <span className='text-white/90'>ID:</span> <span className='font-mono text-white/60 px-2 py-0.5 rounded-sm'>{user.id}</span>
            </p>
            {user.role && (
              <p className='text-sm'>
                <span className='text-white/90'>Role:</span> <span className='text-white/60 px-2 py-0.5 rounded'>{user.role}</span>
              </p>
            )}
          </div>
        )}

        <button
          onClick={handleSignOut}
          className='w-full flex items-center justify-center gap-2 py-4 px-4 text-sm text-[#17999B] font-medium rounded-lg transition duration-200'
        >
          <LogOut className='w-4 h-4' />
          Sign Out
        </button>
      </div>
    </div>
  );
}
