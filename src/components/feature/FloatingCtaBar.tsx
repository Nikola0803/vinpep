import { useCart } from '../../context/CartContext';
import { useNavigate } from 'react-router-dom';

export default function FloatingCtaBar() {
  const { items, totalItems, totalPrice, setIsOpen } = useCart();
  const navigate = useNavigate();

  if (items.length === 0) {
    return (
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-espresso border-t border-brass/40 md:hidden">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
              <i className="ri-truck-line" />
            </span>
            <span className="font-mono text-[10px] text-cream/70 tracking-wider">
              Free Shipping on Orders $200+
            </span>
          </div>
          <button
            onClick={() => navigate('/shop')}
            className="font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-4 py-2 hover:bg-brass hover:text-espresso transition-colors"
          >
            Shop Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-espresso border-t border-brass/40 md:hidden">
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 flex items-center justify-center text-brass text-xs">
            <i className="ri-truck-line" />
          </span>
          <span className="font-mono text-[10px] text-cream/70 tracking-wider">
            {totalPrice >= 200 ? (
              <span className="text-brass">Free shipping unlocked</span>
            ) : (
              <>${(200 - totalPrice).toFixed(0)} from free shipping</>
            )}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/shop')}
            className="font-display text-[10px] tracking-[0.2em] uppercase text-brass border border-brass/40 px-3 py-2 hover:bg-brass hover:text-espresso transition-colors"
          >
            Shop
          </button>

          <button
            onClick={() => setIsOpen(true)}
            className="relative flex items-center gap-2 bg-brass text-espresso font-display text-[10px] tracking-[0.2em] uppercase px-4 py-2 hover:bg-brass-light transition-colors"
          >
            <span className="w-4 h-4 flex items-center justify-center">
              <i className="ri-shopping-bag-line" />
            </span>
            Cart
            {totalItems > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-espresso border border-brass text-cream text-[9px] flex items-center justify-center font-mono">
                {totalItems}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}