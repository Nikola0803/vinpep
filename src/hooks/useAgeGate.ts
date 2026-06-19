/**
 * useAgeGate
 *
 * Stores the user's age confirmation in a 30-day cookie (not localStorage).
 * On decline, redirects to an external domain.
 *
 * Cookie: vp-age-confirmed=1; max-age=2592000; SameSite=Lax; path=/
 */

import { useState, useEffect, useCallback } from 'react';

const COOKIE_NAME    = 'vp-age-confirmed';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days in seconds
const DECLINE_URL    = 'https://www.google.com';

// ── Cookie helpers ────────────────────────────────────────────────────────────

function getCookie(name: string): string | null {
  const match = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=')[1]) : null;
}

function setCookie(name: string, value: string, maxAge: number): void {
  document.cookie = [
    `${name}=${encodeURIComponent(value)}`,
    `max-age=${maxAge}`,
    'path=/',
    'SameSite=Lax',
    // Uncomment for HTTPS production:
    // 'Secure',
  ].join('; ');
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAgeGate() {
  /**
   * null  = not yet determined (initial render / SSR guard)
   * true  = confirmed — hide the gate
   * false = not confirmed — show the gate
   */
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    setIsConfirmed(getCookie(COOKIE_NAME) === '1');
  }, []);

  /** User clicked "I Confirm" — set 30-day cookie and dismiss the gate */
  const confirm = useCallback(() => {
    setCookie(COOKIE_NAME, '1', COOKIE_MAX_AGE);
    setIsConfirmed(true);
  }, []);

  /** User clicked "Exit" — redirect away, do NOT set cookie */
  const exit = useCallback(() => {
    window.location.replace(DECLINE_URL);
  }, []);

  return { isConfirmed, confirm, exit };
}
