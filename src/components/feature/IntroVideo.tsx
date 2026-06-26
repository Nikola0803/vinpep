import { useState, useEffect, useRef } from 'react';

/**
 * IntroVideo — plays opening-sequence.mp4 (from /public) once per session.
 * Renders before the age gate. After video ends or user skips, component
 * unmounts and the rest of the app (including AgeGate) becomes visible.
 */
export default function IntroVideo() {
  const [visible, setVisible] = useState(false);
  const [fading, setFading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Only show once per browser session
    if (!sessionStorage.getItem('vp_intro_played')) {
      setVisible(true);
    }
  }, []);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      sessionStorage.setItem('vp_intro_played', '1');
      setVisible(false);
    }, 600);
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex items-center justify-center transition-opacity duration-600 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <video
        ref={videoRef}
        src="/opening-sequence.mp4"
        autoPlay
        muted
        playsInline
        onEnded={dismiss}
        onError={dismiss}
        className="w-full h-full object-cover"
      />

      {/* Skip button — appears after 1.5 s so it doesn't flash immediately */}
      <button
        onClick={dismiss}
        className="absolute bottom-10 right-10 font-mono text-[11px] tracking-[0.25em] uppercase text-cream/60 hover:text-cream border border-cream/20 hover:border-cream/60 px-5 py-2.5 transition-all duration-300 backdrop-blur-sm bg-black/20 animate-fade-in"
        style={{ animationDelay: '1.5s', animationFillMode: 'both' }}
      >
        Skip Intro
      </button>
    </div>
  );
}
