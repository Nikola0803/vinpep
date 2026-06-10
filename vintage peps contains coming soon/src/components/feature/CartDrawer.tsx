import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { items, isOpen, setIsOpen, removeItem, updateQuantity, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();

  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]"
        onClick={() => setIsOpen(false)}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-parchment z-[95] shadow-2xl flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-brass/30">
          <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso">
            Your Cart
          </h2>
          <button
            onClick={() => setIsOpen(false)}
            className="w-8 h-8 flex items-center justify-center text-saddle hover:text-espresso transition-colors"
          >
            <i className="ri-close-line" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <span className="w-12 h-12 flex items-center justify-center text-brass/40 mb-3">
                <i className="ri-shopping-bag-line text-2xl" />
              </span>
              <p className="font-body text-sm text-saddle italic">
                Your cart is empty.
              </p>
              <p className="font-body text-xs text-saddle/60 mt-1">
                Begin your research journey.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 border border-brass/30 bg-cream/50 relative"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-display text-xs tracking-wider uppercase text-espresso">
                        {item.name}
                      </h3>
                      <p className="font-body text-xs italic text-saddle mt-0.5">
                        {item.peptideCode}
                      </p>
                      <p className="font-mono text-[11px] text-leather mt-0.5">
                        {item.dosage}
                      </p>
                    </div>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="w-6 h-6 flex items-center justify-center text-saddle hover:text-red-700 transition-colors"
                    >
                      <i className="ri-close-line text-sm" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-7 h-7 flex items-center justify-center border border-brass/40 text-saddle hover:bg-brass/10 transition-colors"
                      >
                        <i className="ri-subtract-line text-xs" />
                      </button>
                      <span className="w-8 text-center font-mono text-sm text-espresso">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-7 h-7 flex items-center justify-center border border-brass/40 text-saddle hover:bg-brass/10 transition-colors"
                      >
                        <i className="ri-add-line text-xs" />
                      </button>
                    </div>
                    <span className="font-mono text-sm text-brass font-bold">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-brass/30 p-5 space-y-3">
            <div className="flex justify-between items-center">
              <span className="font-display text-xs tracking-wider uppercase text-saddle">
                Subtotal
              </span>
              <span className="font-mono text-lg text-brass font-bold">
                ${totalPrice.toFixed(2)}
              </span>
            </div>
            <p className="font-body text-[11px] italic text-saddle/70 text-center">
              Shipping & taxes calculated at checkout.
            </p>
            <button 
              onClick={() => {
                setIsOpen(false);
                navigate('/checkout');
              }}
              className="w-full bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 border border-brass transition-all duration-300 hover:shadow-[0_0_15px_rgba(184,148,42,0.3)]"
            >
              Proceed to Checkout
            </button>
            <button
              onClick={clearCart}
              className="w-full text-center font-body text-xs text-saddle hover:text-espresso transition-colors py-1"
            >
              Clear Cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}