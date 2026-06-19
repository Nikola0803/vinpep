/**
 * Worker rotation client
 *
 * Source of truth: WordPress REST API  /wp-json/vp-p2p/v1/assign?method=X
 * Accounts and rotation counter live in wp_options on the server — persists
 * across devices and concurrent sessions.
 *
 * Fallback: static WORKERS config (src/config/workers.ts) + localStorage
 * counter, used when the WP API is unreachable (local dev, staging, etc.)
 */

import { type Worker, activeWorkers, getWorkerById } from '@/config/workers';

// ── WP API ────────────────────────────────────────────────────────────────────

const WP_BASE = import.meta.env.VITE_WC_URL
  ? String( import.meta.env.VITE_WC_URL ).replace( /\/$/, '' )
  : '';

export interface AssignResponse {
  worker_id:   string;
  worker_name: string;
  handle:      string;
  method:      string;
}

/**
 * Calls the WP REST endpoint to get the next worker's handle for a payment
 * method. Advances the server-side rotation counter atomically.
 *
 * Returns null if the API is unreachable (caller should use local fallback).
 */
export async function assignFromServer(
  method: 'zelle' | 'cashapp' | 'venmo'
): Promise<AssignResponse | null> {
  if ( ! WP_BASE ) return null;
  try {
    const res = await fetch(
      `${ WP_BASE }/wp-json/vp-p2p/v1/assign?method=${ method }`,
      { signal: AbortSignal.timeout( 5000 ) }
    );
    if ( ! res.ok ) return null;
    return ( await res.json() ) as AssignResponse;
  } catch {
    return null;
  }
}

// ── Local fallback (static config + localStorage) ─────────────────────────────

const ROTATION_KEY = 'vp_worker_rotation_index';
const OVERRIDE_KEY = 'vp_worker_override';

function getLocalRotationIndex(): number {
  return parseInt( localStorage.getItem( ROTATION_KEY ) ?? '0', 10 );
}
function setLocalRotationIndex( idx: number ): void {
  localStorage.setItem( ROTATION_KEY, String( idx ) );
}

export function getLocalNextWorker(): Worker | null {
  const overrideId = localStorage.getItem( OVERRIDE_KEY );
  if ( overrideId ) {
    const w = getWorkerById( overrideId );
    if ( w?.active ) return w;
    localStorage.removeItem( OVERRIDE_KEY );
  }
  const pool = activeWorkers();
  if ( ! pool.length ) return null;
  const idx = getLocalRotationIndex() % pool.length;
  setLocalRotationIndex( idx + 1 );
  return pool[idx];
}

export function getLocalHandle(
  worker: Worker,
  method: 'zelle' | 'cashapp' | 'venmo'
): string | null {
  return worker.handles[method] ?? null;
}

// ── Unified assign — prefers server, falls back to local ──────────────────────

export interface Assignment {
  workerId:   string;
  workerName: string;
  handle:     string;
  source:     'server' | 'local';
}

/**
 * Main entry point called by the checkout page.
 * Tries the WP REST API first; falls back to the static worker config.
 * Returns null only if no active worker exists anywhere.
 */
export async function assignWorker(
  method: 'zelle' | 'cashapp' | 'venmo'
): Promise<Assignment | null> {
  // Try server
  const server = await assignFromServer( method );
  if ( server ) {
    return {
      workerId:   server.worker_id,
      workerName: server.worker_name,
      handle:     server.handle,
      source:     'server',
    };
  }

  // Fallback to local static config
  const worker = getLocalNextWorker();
  if ( ! worker ) return null;
  const handle = getLocalHandle( worker, method );
  if ( ! handle ) return null;
  return {
    workerId:   worker.id,
    workerName: worker.name,
    handle,
    source:     'local',
  };
}

// ── Order ↔ worker mapping (localStorage audit) ───────────────────────────────

const ASSIGNMENT_KEY = 'vp_order_assignments';

interface StoredAssignment {
  invoiceId:  string;
  workerId:   string;
  assignedAt: number;
  source:     'server' | 'local';
}

export function saveAssignment(
  invoiceId: string,
  workerId: string,
  source: 'server' | 'local' = 'server'
): void {
  try {
    const all = getAssignments();
    all.push( { invoiceId, workerId, assignedAt: Date.now(), source } );
    localStorage.setItem( ASSIGNMENT_KEY, JSON.stringify( all.slice( -500 ) ) );
  } catch { /* quota exceeded — fail silently */ }
}

export function getAssignments(): StoredAssignment[] {
  try {
    return JSON.parse( localStorage.getItem( ASSIGNMENT_KEY ) ?? '[]' );
  } catch { return []; }
}

export function getWorkerForInvoice( invoiceId: string ): Worker | null {
  const match = getAssignments().find( a => a.invoiceId === invoiceId );
  if ( ! match ) return null;
  return getWorkerById( match.workerId ) ?? null;
}

// ── Admin helpers (used by /admin/workers dashboard) ──────────────────────────

export function setWorkerOverride( workerId: string | null ): void {
  workerId
    ? localStorage.setItem( OVERRIDE_KEY, workerId )
    : localStorage.removeItem( OVERRIDE_KEY );
}
export function getWorkerOverride(): string | null {
  return localStorage.getItem( OVERRIDE_KEY );
}

export function peekNextWorker(): Worker | null {
  const overrideId = localStorage.getItem( OVERRIDE_KEY );
  if ( overrideId ) {
    const w = getWorkerById( overrideId );
    if ( w?.active ) return w;
  }
  const pool = activeWorkers();
  if ( ! pool.length ) return null;
  return pool[ getLocalRotationIndex() % pool.length ];
}

export function getRotationStats(): { worker: Worker; count: number }[] {
  const assignments = getAssignments();
  return activeWorkers().map( worker => ( {
    worker,
    count: assignments.filter( a => a.workerId === worker.id ).length,
  } ) );
}
