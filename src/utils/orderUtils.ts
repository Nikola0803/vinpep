// ─── Memo Code ───────────────────────────────────────────────────────────────

const MEMO_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // omit O, 0, I, 1

export function generateMemo(): string {
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += MEMO_CHARS[Math.floor(Math.random() * MEMO_CHARS.length)];
  }
  return code;
}

// ─── Invoice ID ──────────────────────────────────────────────────────────────

export function generateInvoiceId(memo: string): string {
  return `VTG-${Date.now()}-${memo}`;
}

// ─── Expiry ───────────────────────────────────────────────────────────────────

export const ORDER_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export function getExpiryTimestamp(): number {
  return Date.now() + ORDER_TTL_MS;
}

export function formatCountdown(expiresAt: number): string {
  const remaining = Math.max(0, expiresAt - Date.now());
  const hours = Math.floor(remaining / 3600000);
  const minutes = Math.floor((remaining % 3600000) / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

export function isExpired(expiresAt: number): boolean {
  return Date.now() > expiresAt;
}

// ─── Audit Log ───────────────────────────────────────────────────────────────

export interface AuditLogEntry {
  invoiceId: string;
  timestamp: string;
  expiresAt: number;
  memoCode: string;
  paymentMethod: string;
  paymentHandle: string;
  /** ID of the worker assigned to validate this payment */
  assignedWorkerId?: string;
  customerName: string;
  customerEmail: string;
  shippingAddress: string;
  items: AuditLineItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  couponCode?: string;
  couponDiscount?: number;
  wcOrderId?: number;
  status: 'pending' | 'confirmed' | 'expired' | 'cancelled';
}

export interface AuditLineItem {
  name: string;
  peptideCode: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

const AUDIT_LOG_KEY = 'vp_audit_log';

export function saveAuditEntry(entry: AuditLogEntry): void {
  try {
    const existing = getAuditLog();
    existing.unshift(entry);
    // Keep last 500 entries
    localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(existing.slice(0, 500)));
  } catch {
    // localStorage may be unavailable — fail silently
  }
}

export function getAuditLog(): AuditLogEntry[] {
  try {
    const raw = localStorage.getItem(AUDIT_LOG_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function updateAuditEntry(invoiceId: string, patch: Partial<AuditLogEntry>): void {
  try {
    const log = getAuditLog();
    const idx = log.findIndex((e) => e.invoiceId === invoiceId);
    if (idx !== -1) {
      log[idx] = { ...log[idx], ...patch };
      localStorage.setItem(AUDIT_LOG_KEY, JSON.stringify(log));
    }
  } catch {
    // fail silently
  }
}
