export const VideoPlayer = () => {
  const src = process.env.NEXT_PUBLIC_WELCOME_VIDEO_URL;
  if (!src) return null;

  return (
    <div className='mx-auto px-12 relative w-full max-w-2xl aspect-video mb-8 rounded-lg overflow-hidden'>
      <iframe
        className='absolute top-0 left-0 w-full h-full'
        src={src}
        title='Welcome video'
        allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
        allowFullScreen
      />
    </div>
  );
};
