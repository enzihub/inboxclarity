export const NeedAssistance = () => {
  const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL;
  if (!supportEmail) return null;

  return (
    <div>
      <div className='mt-8 max-w-3xl mx-auto flex flex-col items-center'>
        <p className='flex justify-center text-lg text-center px-12 mx-16 text-white/60'>Need assistance with anything?</p>
        <a
          href={`mailto:${supportEmail}`}
          className='mt-4 gap-2.5 px-4 py-3 mx-auto text-white/90 bg-white/15 rounded-2xl text-base hover:bg-white/20 transition-colors'
        >
          🛠️ Contact Support
        </a>
      </div>
    </div>
  );
};
