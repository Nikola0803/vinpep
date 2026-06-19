/**
 * Worker pool configuration
 *
 * Each worker has their own Venmo / Cash App / Zelle handles.
 * Orders are assigned in round-robin rotation so validation
 * workload is distributed evenly across the team.
 *
 * HOW TO ADD / REMOVE A WORKER:
 *   - Add an entry to WORKERS below
 *   - Set active: false to temporarily pull someone from rotation
 *     without losing their history
 */

export interface Worker {
  id: string;
  name: string;
  /** Payment handles — only include methods this worker covers */
  handles: {
    zelle?: string;      // phone or email registered with Zelle
    cashapp?: string;    // $cashtag
    venmo?: string;      // @username
  };
  active: boolean;
}

export const WORKERS: Worker[] = [
  {
    id: 'vvg-ops',
    name: 'VVG Ops',
    handles: {
      // zelle: pending — U.S. Bank restriction clearing Monday; add handle then
      cashapp: '$VVGOps',
      venmo:   '@VVGOps',
    },
    active: true,
  },
];

/** Returns only workers who are currently active */
export function activeWorkers(): Worker[] {
  return WORKERS.filter(w => w.active);
}

/** Look up a single worker by ID */
export function getWorkerById(id: string): Worker | undefined {
  return WORKERS.find(w => w.id === id);
}
