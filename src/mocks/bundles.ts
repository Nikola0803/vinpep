import { products } from './products';

export interface BundleItem {
  productId: string;
  defaultDosage: string;
}

export interface Bundle {
  id: string;
  name: string;
  contents: string[];
  items: BundleItem[];
  originalPrice: number;
  bundlePrice: number;
  savingsPct: number;
  description: string;
  image: string;
  stockCount: number;
  rating: number;
  reviewCount: number;
  purity: string;
}

export const bundles: Bundle[] = [
  {
    id: 'b1',
    name: 'THE RECOVERY STACK',
    contents: ['BPC-157', 'TB-500', 'GHK-Cu'],
    items: [
      { productId: '1', defaultDosage: '10mg' },
      { productId: '2', defaultDosage: '5mg' },
      { productId: '11', defaultDosage: '100mg' },
    ],
    originalPrice: 326,
    bundlePrice: 237,
    savingsPct: 27,
    description: 'Our premier tissue regeneration and wound healing combination for advanced recovery research.',
    image: 'https://readdy.ai/api/search-image?query=Three%20crystal%20clear%20transparent%20borosilicate%20glass%20peptide%20research%20vials%20arranged%20in%20a%20triangular%20composition%20on%20a%20vintage%20marble%20laboratory%20benchtop%2C%20each%20vial%20contains%20white%20lyophilized%20powder%20settled%20at%20the%20bottom%20inside%2C%20ornate%20brass%20caps%2C%20soft%20warm%20clinical%20lighting%2C%20dark%20espresso%20brown%20moody%20background%2C%20antique%20apothecary%20laboratory%20aesthetic%2C%20premium%20product%20photography%2C%20highly%20detailed&width=600&height=500&seq=bundle-recovery-v1&orientation=landscape',
    stockCount: 47,
    rating: 4.9,
    reviewCount: 189,
    purity: '99.2%',
  },
  {
    id: 'b2',
    name: 'THE LONGEVITY PROTOCOL',
    contents: ['CJC-1295', 'Ipamorelin', 'MOTS-c'],
    items: [
      { productId: '3', defaultDosage: '5mg' },
      { productId: '4', defaultDosage: '5mg' },
      { productId: '12', defaultDosage: '10mg' },
    ],
    originalPrice: 336,
    bundlePrice: 257,
    savingsPct: 24,
    description: 'Synergistic growth hormone and mitochondrial optimization stack for longevity research.',
    image: 'https://readdy.ai/api/search-image?query=Three%20crystal%20clear%20transparent%20borosilicate%20glass%20peptide%20research%20vials%20arranged%20in%20a%20row%20on%20a%20vintage%20oak%20laboratory%20bench%2C%20each%20vial%20contains%20white%20lyophilized%20powder%20settled%20at%20the%20bottom%20inside%2C%20ornate%20brass%20caps%2C%20soft%20warm%20clinical%20lighting%2C%20dark%20espresso%20brown%20moody%20background%2C%20antique%20apothecary%20laboratory%20aesthetic%2C%20premium%20product%20photography%2C%20highly%20detailed&width=600&height=500&seq=bundle-longevity-v1&orientation=landscape',
    stockCount: 42,
    rating: 4.8,
    reviewCount: 134,
    purity: '99.0%',
  },
  {
    id: 'b3',
    name: 'THE METABOLIC RESEARCH KIT',
    contents: ['Semaglutide', 'Tirzepatide', 'HGH Fragment 176-191'],
    items: [
      { productId: '5', defaultDosage: '5mg' },
      { productId: '6', defaultDosage: '10mg' },
      { productId: '10', defaultDosage: '5mg' },
    ],
    originalPrice: 547,
    bundlePrice: 437,
    savingsPct: 20,
    description: 'Complete metabolic modulation suite covering GLP-1, GIP, and lipolytic pathways.',
    image: 'https://readdy.ai/api/search-image?query=Three%20crystal%20clear%20transparent%20borosilicate%20glass%20peptide%20research%20vials%20arranged%20in%20a%20triangular%20composition%20on%20a%20vintage%20brass%20scale%20surface%2C%20each%20vial%20contains%20white%20lyophilized%20powder%20settled%20at%20the%20bottom%20inside%2C%20ornate%20brass%20caps%2C%20soft%20warm%20clinical%20lighting%2C%20dark%20espresso%20brown%20moody%20background%2C%20antique%20apothecary%20laboratory%20aesthetic%2C%20premium%20product%20photography%2C%20highly%20detailed&width=600&height=500&seq=bundle-metabolic-v1&orientation=landscape',
    stockCount: 15,
    rating: 4.9,
    reviewCount: 267,
    purity: '99.1%',
  },
];

export function getBundleProducts(bundleId: string) {
  const bundle = bundles.find((b) => b.id === bundleId);
  if (!bundle) return [];
  return bundle.items.map((item) => {
    const product = products.find((p) => p.id === item.productId);
    return { product, item };
  }).filter((x) => x.product !== undefined) as { product: typeof products[0]; item: BundleItem }[];
}