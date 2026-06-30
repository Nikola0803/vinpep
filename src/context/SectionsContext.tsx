/**
 * SectionsContext — fetches all CMS section data from the WP backend once at
 * app startup and makes it available everywhere via useSections().
 *
 * Falls back to hardcoded defaults if the API is unreachable or slow.
 * If the backend returns HTTP 402, the site enters maintenance mode.
 */
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface SectionsData {
  _maintenance: boolean;
  hero: {
    urgency_text: string;
    pre_headline: string;
    h1_line1: string;
    h1_italic: string;
    body: string;
    image_url: string;
    cta1_label: string;
    cta1_url: string;
    cta2_label: string;
    cta2_url: string;
    badge_purity: string;
    badge_usa: string;
    badge_coa: string;
    trust_badges: { icon: string; text: string }[];
    stats: { value: string; label: string }[];
  };
  ticker: { items: string[] };
  trust_pillars: { pillars: { icon: string; title: string; description: string }[] };
  brand_story: {
    logo_url: string;
    est_label: string;
    blockquote: string;
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
  };
  editorial: {
    headline: string;
    body: string;
    checklist: string[];
    closing: string;
    image_url: string;
  };
  accordion: {
    section_heading: string;
    panels: { title: string; content: string }[];
  };
  categories: {
    tiles: { name: string; description: string; icon: string; link: string }[];
  };
  newsletter: {
    headline: string;
    tagline: string;
    placeholder: string;
    submit_label: string;
    success_heading: string;
    success_body: string;
    disclaimer: string;
  };
  footer: {
    phone: string;
    email: string;
    instagram_url: string;
    twitter_url: string;
    linkedin_url: string;
    copyright: string;
    disclaimer: string;
    payment_methods: string[];
  };
  about: {
    paragraph1: string;
    paragraph2: string;
    paragraph3: string;
    stats: { value: string; label: string }[];
    quote: string;
  };
  research_warning: {
    heading: string;
    body: string;
    age_notice: string;
  };
  contact_page: {
    heading: string;
    phone_label: string;
    phone: string;
    email_label: string;
    email: string;
    success_heading: string;
    success_body: string;
  };
  privacy_policy:      { content: string; effective_date: string };
  terms_of_service:    { content: string; effective_date: string };
  return_policy:       { content: string; effective_date: string };
  research_use_policy: { content: string; effective_date: string };
}

// ─── Hardcoded defaults (exact values from TSX components) ───────────────────

const DEFAULTS: SectionsData = {
  _maintenance: false,
  hero: {
    urgency_text:  'Batch #VP-2405 ships today — 12 remaining',
    pre_headline:  'Founded on Principle',
    h1_line1:      'Research Peptides',
    h1_italic:     'forged in pursuit',
    body:          'Vintage Peptides sources, synthesizes, and delivers the highest-purity research-grade peptides available anywhere. Founded by researchers, for researchers.',
    image_url:     'https://db.vintagepeptides.com/wp-content/uploads/2024/01/hero-peptides.jpg',
    cta1_label:    'SHOP PEPTIDES',
    cta1_url:      '/shop',
    cta2_label:    'VIEW COA LIBRARY →',
    cta2_url:      '/coa',
    badge_purity:  '99.2% — HPLC Verified',
    badge_usa:     'USA — Lyophilized',
    badge_coa:     'COA — Included',
    trust_badges:  [
      { icon: 'ri-shield-check-line', text: '99%+ Purity' },
      { icon: 'ri-flask-line',        text: 'USA Lab' },
      { icon: 'ri-file-list-3-line',  text: 'Batch COA' },
      { icon: 'ri-truck-line',        text: 'Free Ship $200+' },
    ],
    stats: [
      { value: '12,847', label: 'Researchers Served' },
      { value: '4.8',    label: 'Average Rating' },
      { value: '99.2%',  label: 'Avg Batch Purity' },
    ],
  },
  ticker: {
    items: [
      'Free Shipping $200+',
      '99%+ HPLC Purity',
      'Research Use Only',
      'Not for Human Consumption',
      'USA Made',
      'Batch COA Included',
    ],
  },
  trust_pillars: {
    pillars: [
      { icon: 'ri-flask-line',       title: 'Lab Tested USA',      description: 'Every batch is lyophilized in certified US laboratories under strict GMP-adjacent protocols. Domestic production means faster delivery and full traceability.' },
      { icon: 'ri-award-line',       title: '99%+ Purity',         description: 'Our HPLC analytical standards demand a minimum of 99% purity. Most batches exceed 99.2%. We do not release anything that falls below our threshold.' },
      { icon: 'ri-file-list-3-line', title: 'Batch COA',           description: 'Every vial ships with its corresponding Certificate of Analysis. Lot numbers are matched, dated, and digitally archived for your research records.' },
      { icon: 'ri-truck-line',       title: 'Nationwide Shipping', description: 'Temperature-controlled packaging with cold packs and insulated liners. Free expedited shipping on all orders over $200. Same-day dispatch before 2 PM EST.' },
    ],
  },
  brand_story: {
    logo_url:   'https://db.vintagepeptides.com/wp-content/uploads/2024/01/vintage-peptides-logo.png',
    est_label:  'Est. 2024',
    blockquote: '"Not a product. A pursuit."',
    paragraph1: 'Vintage Peptides was born out of necessity. The research peptide space had become saturated with suppliers who prioritized margins over methodology — where batch testing was a marketing checkbox, not a scientific standard.',
    paragraph2: 'We built Vintage because serious researchers deserve a serious supplier. One that publishes complete Certificates of Analysis, maintains cold-chain integrity from synthesis to your doorstep, and treats every vial as a commitment to the integrity of your work.',
    paragraph3: 'Every batch is lyophilized in certified US facilities, independently verified by third-party laboratories, and released only at ≥99% purity. That is not a claim. It is a condition of sale.',
  },
  editorial: {
    headline:  'Purity Is the Baseline —\nRelease Standards Are the Difference',
    body:      'Every Vintage Peptides batch undergoes a rigorous six-point analytical protocol before it ever reaches our cold storage. HPLC purity verification is merely the beginning.',
    checklist: [
      'HPLC Purity Analysis (≥99%)',
      'Mass Spectrometry Identity Confirmation',
      'Endotoxin Screening (LAL Test)',
      'Residual Solvent Analysis (GC-MS)',
      'Heavy Metals Panel (ICP-MS)',
      'Sterility & Bioburden Testing',
    ],
    closing:   'Our COAs are not marketing documents — they are complete analytical records, dated, signed, and matched to your specific lot number. We archive every result for five years.',
    image_url: '',
  },
  accordion: {
    section_heading: 'Why We Are Different',
    panels: [
      { title: 'The Problem',  content: 'The research peptide market is flooded with under-tested compounds, inconsistent dosing, and vendors who treat transparency as optional. Researchers waste precious resources on peptides that fail to meet basic analytical standards — compromising their data, their time, and the integrity of their work.' },
      { title: 'The Solution', content: 'Every batch we release is validated by independent third-party HPLC and Mass Spectrometry testing. We publish complete Certificates of Analysis with every order, so you know exactly what you are working with. No guesswork. No ambiguity. Just verified, high-purity research materials.' },
      { title: 'What We Do',   content: 'Vintage Peptides synthesizes and supplies research-grade peptides for qualified laboratories and research institutions. We maintain stringent cold-chain handling, batch-tracked inventory, and a direct relationship with our synthesis partners — because your research demands more than a middleman.' },
    ],
  },
  categories: {
    tiles: [
      { name: 'Compounds',     description: 'Single-peptide research compounds lyophilized to analytical grade standards.', icon: 'fa-solid fa-flask',       link: '/shop?category=compounds' },
      { name: 'Blends',        description: 'Pre-formulated peptide combinations optimized for synergistic research.',      icon: 'fa-solid fa-layer-group', link: '/shop?category=blends' },
      { name: 'Bioregulators', description: 'Short-chain peptides targeting specific cellular and tissue functions.',       icon: 'fa-solid fa-dna',         link: '/shop?category=bioregulators' },
    ],
  },
  newsletter: {
    headline:        'Join the Archive',
    tagline:         'Receive batch announcements, testing reports, and research protocols delivered directly to your inbox.',
    placeholder:     'Enter your research email',
    submit_label:    'Subscribe',
    success_heading: 'Welcome to the Archive',
    success_body:    'Your subscription has been confirmed.',
    disclaimer:      'We respect your privacy. Unsubscribe at any time. Research use only communications.',
  },
  footer: {
    phone:           '(866) 788-GLP1',
    email:           'research@vintagepeptides.com',
    instagram_url:   '#',
    twitter_url:     '#',
    linkedin_url:    '#',
    copyright:       '© 2026 Vintage Peptides. All rights reserved.',
    disclaimer:      'All products sold by Vintage Peptides are intended for laboratory research use only. These products are not for human consumption, nor are they intended to diagnose, treat, cure, or prevent any disease or condition. By purchasing from this site, you affirm that you are a qualified researcher aged 21 or older and understand the risks associated with research chemicals. All statements and products on this website have not been evaluated by the Food and Drug Administration.',
    payment_methods: ['Zelle', 'Cash App', 'Venmo'],
  },
  about: {
    paragraph1: 'Vintage Peptides was founded in 2024 by a collective of peptide chemists, analytical methodologists, and former clinical researchers who shared a common frustration: the research peptide market had become a race to the bottom, where transparency was optional and purity was negotiable.',
    paragraph2: 'We set out to build something different. A supplier that treats every vial as a commitment to scientific integrity. Where batch testing is not a marketing checkbox but a non-negotiable standard. Where researchers can trust the label without second-guessing the contents.',
    paragraph3: 'Our synthesis partners operate GMP-adjacent facilities in the United States. Every batch is independently verified by third-party laboratories using HPLC, mass spectrometry, and a full panel of analytical tests. We do not release anything below 99% purity. Ever.',
    stats: [
      { value: '12,000+', label: 'Vials Shipped' },
      { value: '99.2%',   label: 'Average Purity' },
      { value: '100%',    label: 'Batch Tested' },
    ],
    quote: '"Not a product. A pursuit."',
  },
  research_warning: {
    heading:    'Research Use Only',
    body:       'All products are intended solely for laboratory research and are not for human or animal consumption. By purchasing, the buyer agrees to use these products in compliance with all applicable laws. All products currently listed on this site are for research purposes ONLY.',
    age_notice: 'Must be 21+ to purchase',
  },
  contact_page: {
    heading:         'Contact Our Research Team',
    phone_label:     'Research Support',
    phone:           '(866) 788-GLP1',
    email_label:     'Email',
    email:           'research@vintagepeptides.com',
    success_heading: 'Message Received',
    success_body:    'Our research team will respond within 24 hours.',
  },
  privacy_policy:      { content: '', effective_date: 'January 1, 2026' },
  terms_of_service:    { content: '', effective_date: 'January 1, 2026' },
  return_policy:       { content: '', effective_date: 'January 1, 2026' },
  research_use_policy: { content: '', effective_date: 'January 1, 2026' },
};

// ─── Context ──────────────────────────────────────────────────────────────────

interface SectionsContextValue {
  sections: SectionsData;
  fromCMS: boolean;   // true = live WP data, false = hardcoded fallback
  loading: boolean;
}

const SectionsContext = createContext<SectionsContextValue>({
  sections: DEFAULTS,
  fromCMS:  false,
  loading:  true,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

const WP_URL = (import.meta.env.VITE_WP_URL as string | undefined) ?? 'https://db.vintagepeptides.com';
const SECTIONS_ENDPOINT = `${WP_URL}/wp-json/vintage-peps/v1/sections`;

export function SectionsProvider({ children }: { children: ReactNode }) {
  const [sections, setSections] = useState<SectionsData>(DEFAULTS);
  const [fromCMS,  setFromCMS]  = useState(false);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000); // 5 s timeout

    fetch(SECTIONS_ENDPOINT, { signal: controller.signal })
      .then(async (res) => {
        clearTimeout(timer);
        if (res.status === 402) {
          // Maintenance mode activated — swap to suspended state
          setSections((prev) => ({ ...prev, _maintenance: true }));
          setFromCMS(true);
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data: SectionsData = await res.json();
        setSections({ ...DEFAULTS, ...data });
        setFromCMS(true);
      })
      .catch(() => {
        // Network error or timeout → stay on hardcoded defaults silently
        clearTimeout(timer);
        setFromCMS(false);
      })
      .finally(() => setLoading(false));

    return () => { clearTimeout(timer); controller.abort(); };
  }, []);

  return (
    <SectionsContext.Provider value={{ sections, fromCMS, loading }}>
      {children}
    </SectionsContext.Provider>
  );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useSections() {
  return useContext(SectionsContext);
}
