import { useState, useEffect, useCallback } from 'react';

const AGE_GATE_KEY = 'vp-age-confirmed';

export function useAgeGate() {
  const [isConfirmed, setIsConfirmed] = useState<boolean | null>(null);

  useEffect(() => {
    const confirmed = localStorage.getItem(AGE_GATE_KEY);
    setIsConfirmed(!!confirmed);
  }, []);

  const confirm = useCallback(() => {
    localStorage.setItem(AGE_GATE_KEY, 'true');
    setIsConfirmed(true);
  }, []);

  const exit = useCallback(() => {
    window.location.href = 'https://google.com';
  }, []);

  return { isConfirmed, confirm, exit };
}