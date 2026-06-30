import { useState } from 'react';
import { useSections } from '@/context/SectionsContext';

export default function AccordionSection() {
  const { sections } = useSections();
  const s = sections.accordion;
  const panels = s.panels;

  const [openIndices, setOpenIndices] = useState<number[]>([0, 1, 2]);

  const togglePanel = (index: number) => {
    setOpenIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <section className="py-16 md:py-24 parchment-grain">
      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
        <div className="text-center mb-12">
          <span className="text-brass text-lg">❧</span>
          <h2 className="font-display text-xl md:text-2xl tracking-[0.2em] uppercase text-espresso mt-3">
            {s.section_heading}
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {panels.map((panel, index) => {
            const isOpen = openIndices.includes(index);
            return (
              <div
                key={index}
                className={`border transition-all duration-500 cursor-pointer ${
                  isOpen
                    ? 'border-brass bg-cream/60 shadow-[0_0_20px_rgba(184,148,42,0.08)]'
                    : 'border-brass/20 bg-cream/20 hover:border-brass/40'
                }`}
                onClick={() => togglePanel(index)}
              >
                <div className="p-5 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
                      {panel.title}
                    </h3>
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-brass transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <i className="ri-arrow-down-s-line" />
                    </span>
                  </div>

                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      isOpen ? 'max-h-80 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="brass-rule mb-4" />
                    <p className="font-body text-sm text-saddle leading-relaxed">
                      {panel.content}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
