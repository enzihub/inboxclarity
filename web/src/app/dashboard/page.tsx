'use client';

import { createClient } from '@/lib/supabase/client';
import { VideoPlayer } from '@/shared/components/VideoPlayer';
import { useUser } from '@/shared/hooks/use-user';
import { sendBriefNow } from '@/shared/services/brief';

export default function Dashboard() {
  const { user, loading } = useUser();
  const supabase = createClient();

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500'></div>
      </div>
    );
  }

  if (!user) return null;

  const getDisplayName = () => {
    if (user.user_metadata.full_name) {
      return user.user_metadata.full_name;
    }
    if (user.email) {
      return user.email.split('@')[0];
    }
    return 'there';
  };

  const handleDopamineClick = async () => {
    try {
      alert('Dopamine hit requested! Check your email shortly.');
      await sendBriefNow(supabase, user.id, user.email!);
    } catch (error) {
      console.error('Error:', error);
      alert('Failed to send dopamine hit. Please try again.');
    }
  };

  return (
    <div className='flex items-center justify-center text-center bg-black'>
      <div className='w-full items-center'>
        {/* Confirmation Message */}
        <h1 className=' flex justify-center text-5xl md:text-6xl max-w-5xl px-16 mx-auto  text-white/90'>Thanks for signing up.</h1>
        <h1 className=' flex justify-center text-5xl md:text-6xl max-w-5xl px-16 mb-8 mx-auto  text-white/90'>You will receive your email at 7am tomorrow.</h1>

        {/* Email Info */}
        <div className='flex flex-col items-center gap-4 max-w-3xl mx-auto'>
          <p className='text-xl md:text-xl mb-16 mt-4 md:px-12 mx-16 text-white/60'>
          Thanks for joining us. We’re excited to help you start your days with clarity and control.
          </p>
        </div>
        <VideoPlayer />
        
        <div className='mt-16 max-w-3xl mx-auto'>
          <p className='flex justify-center text-xl mb-4 md:px-12 mx-16 text-white/60'>
            Can’t wait until 7 AM tomorrow? Click the button below to get your executive report now!
          </p>
    
          {/* Dopamine Button */}
          <button
            onClick={handleDopamineClick}
            className='gap-2.5 px-4 py-3 mx-auto text-white/90 bg-white/15 rounded-2xl text-base hover:bg-white/20 transition-colors'
          >
          📨 Get my InboxClarity
          </button>
          
        </div>
      </div>
    </div>
  );
}
