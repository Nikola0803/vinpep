export default function TickerBar() {
  const items = [
    'Free Shipping $200+',
    '99%+ HPLC Purity',
    'Research Use Only',
    'Not for Human Consumption',
    'USA Made',
    'Batch COA Included',
  ];

  const tickerContent = items.map((item, i) => (
    <span key={i} className="inline-flex items-center mx-8 whitespace-nowrap">
      <span className="w-1.5 h-1.5 rounded-full bg-brass mr-3 flex-shrink-0" />
      <span className="font-body text-xs tracking-widest uppercase text-espresso">
        {item}
      </span>
    </span>
  ));

  return (
    <div className="w-full bg-cream border-b border-brass/30 overflow-hidden py-2.5 relative z-50">
      <div className="flex animate-ticker">
        <div className="flex items-center flex-shrink-0">
          {tickerContent}
        </div>
        <div className="flex items-center flex-shrink-0">
          {tickerContent}
        </div>
      </div>
    </div>
  );
}