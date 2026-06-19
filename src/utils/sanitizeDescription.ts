/**
 * Product description sanitizer
 *
 * Strips or replaces terminology that implies medical/therapeutic use,
 * human consumption, or FDA-evaluated claims from product descriptions.
 *
 * Applied before rendering — source data in the WC backend is left untouched.
 *
 * HOW TO EXTEND:
 *   Add entries to REPLACEMENTS (phrase → safe replacement) or
 *   STRIP_PATTERNS (regex to remove entirely).
 */

// ── Phrase replacements ───────────────────────────────────────────────────────
// Ordered: longest / most specific phrases first to avoid partial matches.

const REPLACEMENTS: [RegExp, string][] = [
  // Therapeutic / treatment claims
  [/\b(treat(s|ed|ing|ment)?|cure[sd]?|heal(s|ed|ing)?|therap(y|ies|eutic|eutically?))\b/gi, 'study'],
  [/\b(diagnose[sd]?|diagnosis|prevent(s|ed|ing|ion)?|mitigat(es?|ed|ing|ion)?)\b/gi, 'research'],
  [/\b(medic(al|ation|ine|ally?)?|pharmaceutical(ly?)?|drug)\b/gi, 'research compound'],
  [/\b(patient(s)?|clinical(ly?)?|clinic(s)?)\b/gi, 'subject'],
  [/\b(doctor[s]?|physician[s]?|prescri(be[sd]?|ption[s]?))\b/gi, 'researcher'],

  // Human / animal administration
  [/\b(inject(s|ed|ing|ion|able)?|intravenous(ly?)?|subcutaneous(ly?)?|intramuscular(ly?)?)\b/gi, 'administer in vitro'],
  [/\b(dosage|dose[sd]?|dosing)\b/gi, 'concentration'],
  [/\b(human consumption|for humans?|human use|safe for human)\b/gi, 'research application'],
  [/\b(oral(ly)?|ingested?|swallow(ed|ing)?|taken orally)\b/gi, 'applied in vitro'],

  // FDA / regulatory approval language
  [/\b(FDA[- ]?approved|FDA[- ]?cleared|FDA[- ]?evaluated|approved by the (FDA|Food and Drug Administration))\b/gi, 'not FDA evaluated'],
  [/\b(approved|cleared|certified) (for|to) (human|medical|therapeutic)\b/gi, 'designated for research'],

  // Disease / condition references in claims context
  [/\b(anti[- ]?(aging|inflammatory|cancer|tumor|viral|bacterial|fungal|depressant))\b/gi, 'research-grade'],
  [/\b(growth hormone|HGH)\b/gi, 'growth factor peptide'],
  [/\b(weight loss|fat loss|burn fat|fat burning)\b/gi, 'metabolic research'],
  [/\b(muscle (growth|building|gain)|anabolic)\b/gi, 'tissue research'],
  [/\b(libido|sexual (performance|enhancement|function))\b/gi, 'physiological research'],
  [/\b(erectile|testosterone booster)\b/gi, 'hormonal research compound'],
  [/\b(nootropic|cognitive enhancement|smart drug)\b/gi, 'neuromodulatory research'],
  [/\b(pain (relief|management|killer)|analgesic)\b/gi, 'nociceptive research'],
  [/\b(immune (booster|boost|system support))\b/gi, 'immunological research'],
];

// ── Strip patterns (remove entirely, no replacement) ─────────────────────────

const STRIP_PATTERNS: RegExp[] = [
  // "not evaluated by the FDA" redundant if we already handle the positive form
  // (keep — it's actually a safe statement, strip it from the replacements list above)
];

// ── Sanitize ──────────────────────────────────────────────────────────────────

export function sanitizeDescription(raw: string): string {
  let text = raw;

  for (const [pattern, replacement] of REPLACEMENTS) {
    text = text.replace(pattern, replacement);
  }

  for (const pattern of STRIP_PATTERNS) {
    text = text.replace(pattern, '');
  }

  // Collapse any double spaces left behind
  return text.replace(/  +/g, ' ').trim();
}

/**
 * Returns a short sanitized excerpt for use in cards / meta descriptions.
 * Truncates to `maxLen` characters on a word boundary.
 */
export function sanitizeExcerpt(raw: string, maxLen = 160): string {
  const clean = sanitizeDescription(raw);
  if (clean.length <= maxLen) return clean;
  const cut = clean.lastIndexOf(' ', maxLen);
  return (cut > 0 ? clean.slice(0, cut) : clean.slice(0, maxLen)) + '…';
}
