import { useState } from 'react';
import PageLayout from '@/components/feature/PageLayout';

const faqs = [
  {
    question: 'What purity standards does Vintage Peptides maintain?',
    answer: 'Every batch is tested to a minimum of 99% purity via HPLC. Most batches exceed 99.2%. We also perform Mass Spectrometry identity confirmation, endotoxin screening, residual solvent analysis, and heavy metals testing on every lot.',
  },
  {
    question: 'Do you provide Certificates of Analysis?',
    answer: 'Yes. Every order includes a lot-specific Certificate of Analysis (COA) that details the analytical results for that exact batch. COAs are dated, signed by the testing laboratory, and digitally archived for five years.',
  },
  {
    question: 'Are your peptides synthesized in the USA-Lyophilized?',
    answer: 'Yes. All peptides are lyophilized in certified US-based facilities operating under GMP-adjacent protocols. Domestic production ensures full traceability, faster shipping, and compliance with US research standards.',
  },
  {
    question: 'How should I store lyophilized peptides?',
    answer: 'Lyophilized vials should be stored at -20°C in a desiccated environment away from light. Avoid repeated freeze-thaw cycles. Reconstituted solutions should be stored at 2-8°C and are typically stable for 14 days.',
  },
  {
    question: 'What is your shipping policy?',
    answer: 'We ship nationwide using temperature-controlled packaging with cold packs and insulated liners. Orders over $200 qualify for free expedited shipping. All orders placed before 2 PM EST ship same-day.',
  },
  {
    question: 'Can I return a product?',
    answer: 'Due to the sensitive nature of research materials, we cannot accept returns on opened or used products. Unopened products may be returned within 14 days of delivery subject to a restocking fee. Contact our research support team for assistance.',
  },
  {
    question: 'Do you offer bulk or institutional pricing?',
    answer: 'Yes. We offer volume discounts and institutional accounts for qualified research laboratories, universities, and pharmaceutical companies. Contact research@vintagepeptides.com with your requirements.',
  },
  {
    question: 'Are these products for human consumption?',
    answer: 'Absolutely not. All products sold by Vintage Peptides are strictly for laboratory research use only. They are not intended for human or animal consumption, diagnosis, treatment, or prevention of any disease.',
  },
];

export default function FAQs() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <PageLayout>
      <div className="py-16 md:py-24 parchment-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-12">
            <span className="text-brass text-lg">❧</span>
            <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase text-espresso mt-3">
              Frequently Asked Questions
            </h1>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openIndex === index;
              return (
                <div
                  key={index}
                  className={`border transition-all duration-500 ${
                    isOpen ? 'border-brass bg-cream/50' : 'border-brass/20 bg-cream/20'
                  }`}
                >
                  <button
                    onClick={() => setOpenIndex(index)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <span className="font-display text-sm tracking-wider uppercase text-espresso pr-4">
                      {faq.question}
                    </span>
                    <span
                      className={`w-6 h-6 flex items-center justify-center text-brass flex-shrink-0 transition-transform duration-300 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    >
                      <i className="ri-arrow-down-s-line" />
                    </span>
                  </button>
                  <div
                    className={`overflow-hidden transition-all duration-500 ${
                      isOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                    }`}
                  >
                    <div className="px-5 pb-5">
                      <div className="brass-rule mb-4" />
                      <p className="font-body text-sm text-saddle leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </PageLayout>
  );
}