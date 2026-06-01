import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '@/components/feature/PageLayout';
import { useCart } from '@/context/CartContext';

const paymentMethods = [
  {
    id: 'zelle',
    name: 'Zelle',
    description: 'Send payment to research@vintagepeptides.com',
    icon: 'ri-bank-card-line',
  },
  {
    id: 'cashapp',
    name: 'Cash App',
    description: 'Send to $VintagePeptides',
    icon: 'ri-money-dollar-circle-line',
  },
  {
    id: 'venmo',
    name: 'Venmo',
    description: 'Send to @VintagePeptides-Research',
    icon: 'ri-wallet-3-line',
  },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const { items, totalPrice, clearCart } = useCart();
  const [selectedPayment, setSelectedPayment] = useState('');
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zip: '',
    notes: '',
  });
  const [submitted, setSubmitted] = useState(false);

  if (items.length === 0 && !submitted) {
    return (
      <PageLayout>
        <div className="py-24 text-center parchment-grain">
          <div className="relative z-10 max-w-xl mx-auto px-4">
            <span className="w-12 h-12 flex items-center justify-center text-brass/40 mx-auto mb-4">
              <i className="ri-shopping-bag-line text-2xl" />
            </span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mb-3">
              Your Cart is Empty
            </h1>
            <p className="font-body text-sm italic text-saddle mb-6">
              Add some research compounds to your cart before proceeding to checkout.
            </p>
            <button
              onClick={() => navigate('/shop')}
              className="bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-8 border border-brass transition-all duration-300"
            >
              Browse Products
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (submitted) {
    return (
      <PageLayout>
        <div className="py-24 text-center parchment-grain">
          <div className="relative z-10 max-w-xl mx-auto px-4">
            <span className="w-16 h-16 flex items-center justify-center text-brass mx-auto mb-4 border border-brass rounded-full">
              <i className="ri-check-line text-xl" />
            </span>
            <h1 className="font-display text-xl tracking-[0.2em] uppercase text-espresso mb-3">
              Order Submitted
            </h1>
            <p className="font-body text-sm text-saddle leading-relaxed mb-2">
              Thank you for your order. We have received your request and will send a payment confirmation within 24 hours.
            </p>
            <p className="font-body text-sm text-saddle leading-relaxed mb-6">
              Please complete your payment via the selected method. Your order will be processed once payment is confirmed.
            </p>
            <div className="p-4 border border-brass/30 bg-cream/40 mb-6">
              <p className="font-mono text-xs text-saddle mb-2">Order Total: <span className="text-brass font-bold text-sm">${totalPrice.toFixed(2)}</span></p>
              <p className="font-mono text-xs text-saddle">Payment Method: <span className="text-espresso">{paymentMethods.find(p => p.id === selectedPayment)?.name}</span></p>
            </div>
            <button
              onClick={() => navigate('/shop')}
              className="bg-brass hover:bg-brass-light text-espresso font-display text-xs tracking-[0.2em] uppercase py-3 px-8 border border-brass transition-all duration-300"
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </PageLayout>
    );
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment) return;
    clearCart();
    setSubmitted(true);
  };

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <PageLayout>
      <div className="py-8 md:py-12 parchment-grain">
        <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-8">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 mb-8 font-body text-xs text-saddle">
            <button onClick={() => navigate('/')} className="hover:text-brass transition-colors">Home</button>
            <span>/</span>
            <span className="text-espresso uppercase tracking-wider">Checkout</span>
          </div>

          <h1 className="font-display text-2xl md:text-3xl tracking-[0.15em] uppercase text-espresso mb-8">
            Checkout
          </h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-12">
            {/* Left: Form */}
            <div className="lg:col-span-2">
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Contact Information */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-brass text-xs">
                      <i className="ri-user-line" />
                    </span>
                    Contact Information
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                        Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.fullName}
                        onChange={(e) => handleChange('fullName', e.target.value)}
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        placeholder="Dr. Jane Smith"
                      />
                    </div>
                    <div>
                      <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        required
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        placeholder="research@institution.edu"
                      />
                    </div>
                    <div>
                      <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        placeholder="(208) 243-9222"
                      />
                    </div>
                    <div>
                      <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                        Institution / Lab
                      </label>
                      <input
                        type="text"
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        placeholder="Boston Research Institute"
                      />
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-brass text-xs">
                      <i className="ri-truck-line" />
                    </span>
                    Shipping Address
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.address}
                        onChange={(e) => handleChange('address', e.target.value)}
                        className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                        placeholder="247 Research Way, Suite 400"
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                          City *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.city}
                          onChange={(e) => handleChange('city', e.target.value)}
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                          placeholder="Boston"
                        />
                      </div>
                      <div>
                        <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                          State *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.state}
                          onChange={(e) => handleChange('state', e.target.value)}
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                          placeholder="MA"
                        />
                      </div>
                      <div>
                        <label className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle mb-1.5 block">
                          ZIP Code *
                        </label>
                        <input
                          type="text"
                          required
                          value={formData.zip}
                          onChange={(e) => handleChange('zip', e.target.value)}
                          className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40"
                          placeholder="02118"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Method */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-brass text-xs">
                      <i className="ri-secure-payment-line" />
                    </span>
                    Payment Method
                  </h2>
                  <div className="space-y-3">
                    {paymentMethods.map((method) => (
                      <button
                        key={method.id}
                        type="button"
                        onClick={() => setSelectedPayment(method.id)}
                        className={`w-full flex items-center gap-4 p-4 border transition-all duration-300 text-left ${
                          selectedPayment === method.id
                            ? 'border-brass bg-cream/80'
                            : 'border-brass/20 bg-cream/30 hover:border-brass/40'
                        }`}
                      >
                        <span className={`w-10 h-10 flex items-center justify-center text-lg ${selectedPayment === method.id ? 'text-brass' : 'text-saddle/40'}`}>
                          <i className={method.icon} />
                        </span>
                        <div className="flex-1">
                          <p className="font-display text-xs tracking-wider uppercase text-espresso">
                            {method.name}
                          </p>
                          <p className="font-body text-xs text-saddle/70 mt-0.5">
                            {method.description}
                          </p>
                        </div>
                        <span className={`w-5 h-5 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          selectedPayment === method.id ? 'border-brass bg-brass' : 'border-brass/30'
                        }`}>
                          {selectedPayment === method.id && (
                            <i className="ri-check-line text-[10px] text-espresso" />
                          )}
                        </span>
                      </button>
                    ))}
                  </div>
                  {!selectedPayment && (
                    <p className="font-body text-xs text-red-900/70 mt-3">
                      Please select a payment method to continue.
                    </p>
                  )}
                </div>

                {/* Order Notes */}
                <div className="p-6 border border-brass/20 bg-cream/40">
                  <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5 flex items-center gap-3">
                    <span className="w-6 h-6 flex items-center justify-center text-brass text-xs">
                      <i className="ri-file-text-line" />
                    </span>
                    Order Notes
                  </h2>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => handleChange('notes', e.target.value)}
                    rows={3}
                    maxLength={500}
                    className="w-full bg-parchment border border-brass/40 font-body text-sm text-espresso py-2.5 px-3 focus:outline-none focus:border-brass placeholder:text-saddle/40 resize-none"
                    placeholder="Any special instructions for your order..."
                  />
                  <p className="font-mono text-[10px] text-saddle/50 mt-1.5 text-right">
                    {formData.notes.length}/500
                  </p>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={!selectedPayment}
                  className={`w-full font-display text-xs tracking-[0.2em] uppercase py-4 border transition-all duration-300 whitespace-nowrap ${
                    selectedPayment
                      ? 'bg-brass hover:bg-brass-light text-espresso border-brass hover:shadow-[0_0_20px_rgba(184,148,42,0.3)]'
                      : 'bg-saddle/10 text-saddle/40 border-saddle/20 cursor-not-allowed'
                  }`}
                >
                  Submit Order
                </button>

                {/* Disclaimer */}
                <div className="p-4 border border-dashed border-red-900/20 bg-red-900/[0.02]">
                  <div className="flex items-start gap-3">
                    <span className="w-5 h-5 flex items-center justify-center text-red-900/50 mt-0.5">
                      <i className="ri-error-warning-line" />
                    </span>
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-red-900/80 mb-1">
                        For Research Use Only
                      </p>
                      <p className="font-mono text-[10px] leading-relaxed text-saddle/60">
                        By submitting this order, you confirm that you are a qualified researcher aged 21 or older. All products are for laboratory research use only and not intended for human consumption, injection, or therapeutic use.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Right: Order Summary */}
            <div className="lg:col-span-1">
              <div className="sticky top-6 border border-brass/20 bg-cream/40 p-6">
                <h2 className="font-display text-sm tracking-[0.2em] uppercase text-espresso mb-5">
                  Order Summary
                </h2>

                <div className="space-y-4 mb-6">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-start gap-3">
                      <div className="w-8 h-8 bg-brass/10 flex items-center justify-center flex-shrink-0">
                        <span className="font-mono text-[10px] text-brass">{item.quantity}x</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display text-xs tracking-wider uppercase text-espresso truncate">
                          {item.name}
                        </p>
                        <p className="font-body text-[10px] italic text-saddle/70 truncate">
                          {item.peptideCode}
                        </p>
                        <p className="font-mono text-[10px] text-leather">
                          {item.dosage}
                        </p>
                      </div>
                      <span className="font-mono text-xs text-brass font-bold flex-shrink-0">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="brass-rule mb-5" />

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center">
                    <span className="font-body text-xs text-saddle">Subtotal</span>
                    <span className="font-mono text-sm text-espresso">${totalPrice.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-xs text-saddle">Shipping</span>
                    <span className="font-mono text-sm text-espresso">
                      {totalPrice >= 200 ? 'Free' : '$15.00'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="font-body text-xs text-saddle">Tax</span>
                    <span className="font-mono text-sm text-espresso">Calculated later</span>
                  </div>
                </div>

                <div className="brass-rule my-5" />

                <div className="flex justify-between items-center">
                  <span className="font-display text-xs tracking-wider uppercase text-espresso">Total</span>
                  <span className="font-mono text-xl text-brass font-bold">
                    ${(totalPrice + (totalPrice >= 200 ? 0 : 15)).toFixed(2)}
                  </span>
                </div>

                {/* Shipping note */}
                <div className="mt-5 p-3 border border-brass/10 bg-cream/30">
                  <div className="flex items-start gap-2.5">
                    <span className="w-4 h-4 flex items-center justify-center text-brass mt-0.5">
                      <i className="ri-truck-line text-xs" />
                    </span>
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Free Shipping</p>
                      <p className="font-mono text-[10px] text-saddle/70 mt-0.5">On orders over $200</p>
                    </div>
                  </div>
                </div>

                {/* Payment note */}
                <div className="mt-3 p-3 border border-brass/10 bg-cream/30">
                  <div className="flex items-start gap-2.5">
                    <span className="w-4 h-4 flex items-center justify-center text-brass mt-0.5">
                      <i className="ri-secure-payment-line text-xs" />
                    </span>
                    <div>
                      <p className="font-display text-[10px] tracking-[0.15em] uppercase text-espresso">Secure Payment</p>
                      <p className="font-mono text-[10px] text-saddle/70 mt-0.5">We accept Zelle, Cash App & Venmo</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}