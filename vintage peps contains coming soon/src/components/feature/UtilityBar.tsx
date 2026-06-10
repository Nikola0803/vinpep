import { useCart } from '../../context/CartContext';

export default function UtilityBar() {
  const { totalItems, setIsOpen } = useCart();

  return (
    <div className="w-full bg-espresso text-cream py-2 px-4 md:px-8 relative z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-6 text-xs font-body tracking-wide">
          <a
            href="tel:+18001234567"
            className="flex items-center gap-2 hover:text-brass transition-colors whitespace-nowrap"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-phone-line text-xs" />
            </span>
            1-800-VP-PEP-1
          </a>
          <a
            href="mailto:research@vintagepeptides.com"
            className="hidden sm:flex items-center gap-2 hover:text-brass transition-colors whitespace-nowrap"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-mail-line text-xs" />
            </span>
            research@vintagepeptides.com
          </a>
        </div>

        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-2 hover:text-brass transition-colors group"
        >
          <span className="relative">
            <span className="w-8 h-8 flex items-center justify-center rounded-full border border-brass/60 group-hover:border-brass transition-colors">
              <i className="ri-shopping-bag-line text-sm" />
            </span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-brass text-espresso text-[10px] font-bold rounded-full flex items-center justify-center font-mono">
                {totalItems}
              </span>
            )}
          </span>
          <span className="font-body text-xs tracking-widest uppercase hidden sm:inline">
            Cart
          </span>
        </button>
      </div>
    </div>
  );
}