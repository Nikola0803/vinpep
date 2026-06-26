import { useState, useEffect, useRef } from 'react';

const LAUNCH_PASSWORD = import.meta.env.VITE_LAUNCH_PASSWORD ?? 'vintage2026';
const PASSWORD_REQUIRED = LAUNCH_PASSWORD.length > 0;
const UNLOCKED_KEY = 'vp_access_unlocked';

interface Props {
  onComplete: () => void;
}

export default function IntroVideo({ onComplete }: Props) {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [password, setPassword] = useState('');
  const [pwError, setPwError] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  const dismiss = () => {
    setFading(true);
    setTimeout(() => {
      setVisible(false);
      onComplete();
    }, 600);
  };

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (!PASSWORD_REQUIRED || password.trim().toLowerCase() === LAUNCH_PASSWORD.toLowerCase()) {
      dismiss();
    } else {
      setPwError(true);
      setPassword('');
    }
  };

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-[200] bg-black flex items-center justify-center transition-opacity duration-600 ${
        fading ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Background video */}
      <video
        ref={videoRef}
        src="/opening-sequence.mp4"
        autoPlay
        muted
        playsInline
        loop
        className="absolute inset-0 w-full h-full object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Access gate */}
      <div className="relative z-10 w-full max-w-sm mx-auto px-6 text-center">
        <p className="font-display text-xs tracking-[0.35em] uppercase text-brass mb-4">
          Vintage Peptides
        </p>
        <div className="w-16 mx-auto mb-6 border-t border-brass/30" />
        <h1 className="font-display text-2xl tracking-[0.15em] uppercase text-cream mb-2">
          {PASSWORD_REQUIRED ? 'Private Access' : 'Welcome'}
        </h1>
        <p className="font-body text-sm italic text-cream/50 mb-8">
          {PASSWORD_REQUIRED ? 'Enter your access code to continue.' : 'Loading experience…'}
        </p>

        {PASSWORD_REQUIRED ? (
          <form onSubmit={handleUnlock} className="flex flex-col gap-3">
            <input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setPwError(false); }}
              placeholder="Access code"
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent border border-cream/20 text-cream placeholder-cream/30 font-body text-sm px-5 py-4 text-center tracking-widest focus:outline-none focus:border-brass/60 transition-colors duration-300"
            />
            {pwError && (
              <p className="font-mono text-xs text-red-400">Incorrect access code.</p>
            )}
            <button
              type="submit"
              className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.25em] uppercase px-10 py-4 border border-brass transition-all duration-300 hover:shadow-[0_0_30px_rgba(184,148,42,0.3)]"
            >
              Enter
            </button>
          </form>
        ) : (
          // No password required — just show skip
          <button
            onClick={dismiss}
            className="font-mono text-[11px] tracking-[0.25em] uppercase text-cream/60 hover:text-cream border border-cream/20 hover:border-cream/60 px-5 py-2.5 transition-all duration-300"
          >
            Enter Site
          </button>
        )}
      </div>
    </div>
  );
}
