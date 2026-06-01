import { useAgeGate } from '../../hooks/useAgeGate';

export default function AgeGate() {
  const { isConfirmed, confirm, exit } = useAgeGate();

  if (isConfirmed === null || isConfirmed === true) return null;

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="relative w-full max-w-md bg-parchment brass-double-border p-8 md:p-10 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-20 h-20 rounded-full border-2 border-brass flex items-center justify-center bg-espresso shadow-lg">
            <span className="font-display text-xl text-brass tracking-widest">
              VP
            </span>
          </div>
        </div>

        <h2 className="font-display text-center text-lg tracking-[0.2em] uppercase text-espresso mb-2">
          Age Verification
        </h2>

        <div className="flex justify-center mb-5">
          <span className="text-brass text-lg">❧</span>
        </div>

        <p className="font-body text-sm text-center text-saddle leading-relaxed mb-6">
          You must be at least <strong className="text-espresso">21 years of age</strong> to enter
          this website. All products are sold strictly for{' '}
          <strong className="text-espresso">laboratory research use only</strong> and are not for
          human consumption.
        </p>

        <div className="flex flex-col gap-3 mb-6">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" className="mt-1 w-4 h-4 accent-brass" defaultChecked readOnly />
            <span className="font-body text-xs text-saddle leading-relaxed">
              I confirm that I am 21 years of age or older and that all products purchased will be
              used for lawful research purposes only.
            </span>
          </label>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={confirm}
            className="flex-1 bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-6 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
          >
            I Confirm
          </button>
          <button
            onClick={exit}
            className="flex-1 bg-transparent text-saddle hover:text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-6 border border-saddle/30 hover:border-espresso transition-all duration-300"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}