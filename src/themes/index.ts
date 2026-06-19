/**
 * Theme configuration helper
 *
 * Usage anywhere in the app:
 *   import { THEME, BRAND, isSpa } from '@/themes'
 *
 * VITE_THEME env var values:
 *   'spa'     → Valkyrie Peptides build (valkyriepeptides.com)
 *   'vintage' → Vintage Peptides build  (vintagepeptides.com)  [default]
 */

export const THEME = (import.meta.env.VITE_THEME as string) ?? 'vintage';

export const isSpa     = THEME === 'spa';
export const isVintage = !isSpa;

export const BRAND = {
  name:       isSpa ? 'Valkyrie Peptides' : 'Vintage Peptides',
  shortName:  isSpa ? 'Valkyrie'          : 'Vintage Peptides',
  domain:     isSpa ? 'valkyriepeptides.com'  : 'vintagepeptides.com',
  email:      isSpa ? 'support@valkyriepeptides.com' : 'research@vintagepeptides.com',
  tagline:    isSpa
    ? 'Pure performance. Refined for her.'
    : 'Research-grade peptides. Sourced with integrity.',
  /** Primary accent colour — useful for JS-driven inline styles */
  accent:     isSpa ? '#C4746E' : '#B8942A',
  /** Background base colour */
  bg:         isSpa ? '#FAFAF8' : '#F0E6D0',
  /** Google Fonts preload URL for the active theme */
  fontsUrl:   isSpa
    ? 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600&family=Cormorant+Garamond:ital,wght@0,300;0,400;1,300&display=swap'
    : 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Lora:ital,wght@0,400;0,600;1,400&family=Courier+Prime&display=swap',
} as const;

export type ThemeKey = 'vintage' | 'spa';
