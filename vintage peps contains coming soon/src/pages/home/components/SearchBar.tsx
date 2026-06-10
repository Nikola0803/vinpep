import { useState } from 'react';

interface SearchBarProps {
  onSearch?: (query: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <section className="py-8 md:py-12 parchment-grain">
      <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
        <form onSubmit={handleSubmit} className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 flex items-center justify-center text-brass">
            <i className="ri-search-line" />
          </span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search peptides by name, CAS number, or code..."
            className="w-full bg-parchment border border-brass py-3.5 pl-12 pr-4 font-body text-sm text-espresso placeholder:text-saddle/60 focus:outline-none focus:border-brass-light transition-colors"
          />
          <button
            type="submit"
            className="absolute right-3 top-1/2 -translate-y-1/2 font-display text-[10px] tracking-[0.2em] uppercase text-brass hover:text-brass-light transition-colors"
          >
            Search
          </button>
        </form>
      </div>
    </section>
  );
}