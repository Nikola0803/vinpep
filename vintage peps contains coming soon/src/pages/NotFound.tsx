import { useLocation, Link } from "react-router-dom";

export default function NotFound() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-parchment parchment-grain flex flex-col items-center justify-center text-center px-4">
      <div className="relative z-10 max-w-lg">
        <span className="text-brass text-lg">❧</span>
        <h1 className="font-display text-[10rem] md:text-[14rem] leading-none text-brass/15 select-none pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          404
        </h1>
        <div className="relative z-10 pt-20">
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mb-3">
            Page Not Found
          </h2>
          <p className="font-mono text-sm text-saddle mb-2">
            {location.pathname}
          </p>
          <p className="font-body text-sm italic text-saddle/70 mb-8">
            The page you are looking for does not exist in our archive.
          </p>
          <Link
            to="/"
            className="inline-block bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase px-8 py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}