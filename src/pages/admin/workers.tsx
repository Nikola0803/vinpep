/**
 * Admin — Worker Queue Dashboard
 * Route: /admin/workers
 *
 * Shows:
 *  - Each worker's order count + rotation position
 *  - Orders assigned to each worker (from localStorage audit log)
 *  - Manual override: force all new orders to a specific worker
 *  - Active / inactive toggle per worker
 */

import { useState, useEffect } from 'react';
import PageLayout from '@/components/feature/PageLayout';
import { WORKERS, type Worker } from '@/config/workers';
import {
  getRotationStats,
  setWorkerOverride,
  getWorkerOverride,
  peekNextWorker,
} from '@/utils/workerRotation';
import { getAuditLog, type AuditLogEntry } from '@/utils/orderUtils';

// ── Status badge ─────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800',
  confirmed: 'bg-green-100 text-green-800',
  expired:   'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-600',
};

// ── Main component ────────────────────────────────────────────────────────────

export default function WorkersAdmin() {
  const [stats, setStats]         = useState(getRotationStats());
  const [auditLog, setAuditLog]   = useState<AuditLogEntry[]>([]);
  const [override, setOverride]   = useState<string | null>(getWorkerOverride());
  const [nextWorker, setNextWorker] = useState<Worker | null>(peekNextWorker());
  const [activeMap, setActiveMap] = useState<Record<string, boolean>>(
    Object.fromEntries(WORKERS.map(w => [w.id, w.active]))
  );
  const [selectedWorker, setSelectedWorker] = useState<string | null>(null);

  useEffect(() => {
    setAuditLog(getAuditLog());
    setStats(getRotationStats());
    setNextWorker(peekNextWorker());
  }, [override]);

  const workerOrders = (workerId: string): AuditLogEntry[] =>
    auditLog.filter(e => e.assignedWorkerId === workerId);

  const handleOverride = (workerId: string | null) => {
    setWorkerOverride(workerId);
    setOverride(workerId);
    setNextWorker(peekNextWorker());
  };

  const refresh = () => {
    setStats(getRotationStats());
    setAuditLog(getAuditLog());
    setNextWorker(peekNextWorker());
    setOverride(getWorkerOverride());
  };

  return (
    <PageLayout>
      <div className="py-10 parchment-grain min-h-screen">
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="font-mono text-[10px] tracking-[0.2em] uppercase text-saddle mb-1">
                Admin
              </p>
              <h1 className="font-display text-2xl tracking-[0.15em] uppercase text-espresso">
                Worker Queue
              </h1>
            </div>
            <button onClick={refresh}
              className="flex items-center gap-2 px-4 py-2 border border-brass/30 bg-cream/60 font-display text-[10px] tracking-[0.15em] uppercase text-saddle hover:border-brass hover:text-espresso transition-colors">
              <i className="ri-refresh-line" />
              Refresh
            </button>
          </div>

          {/* Next in rotation banner */}
          <div className="mb-8 p-4 border border-brass/30 bg-brass/5 flex items-center gap-4">
            <i className="ri-arrow-right-circle-line text-brass text-xl" />
            <div>
              <p className="font-display text-[10px] tracking-[0.2em] uppercase text-saddle">
                Next Order Goes To
              </p>
              <p className="font-mono text-sm text-espresso font-bold mt-0.5">
                {nextWorker ? nextWorker.name : 'No active workers'}
              </p>
            </div>
            {override && (
              <div className="ml-auto flex items-center gap-2">
                <span className="font-mono text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-1">
                  OVERRIDE ACTIVE
                </span>
                <button onClick={() => handleOverride(null)}
                  className="font-display text-[10px] tracking-wider uppercase text-red-700 hover:underline">
                  Clear
                </button>
              </div>
            )}
          </div>

          {/* Worker cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 mb-10">
            {stats.map(({ worker, count }) => {
              const orders    = workerOrders(worker.id);
              const isActive  = activeMap[worker.id] ?? worker.active;
              const isOverride = override === worker.id;
              const isExpanded = selectedWorker === worker.id;

              return (
                <div key={worker.id}
                  className={`border bg-cream/40 transition-all duration-300 ${
                    isOverride
                      ? 'border-brass shadow-[0_0_12px_rgba(184,148,42,0.2)]'
                      : isActive
                        ? 'border-brass/30'
                        : 'border-brass/10 opacity-60'
                  }`}>

                  {/* Card header */}
                  <div className="p-5 border-b border-brass/10">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <p className="font-display text-sm tracking-[0.15em] uppercase text-espresso">
                          {worker.name}
                        </p>
                        <p className="font-mono text-[10px] text-saddle/60 mt-0.5">{worker.id}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {isOverride && (
                          <span className="text-[9px] font-mono bg-brass text-espresso px-1.5 py-0.5 tracking-wider">
                            OVERRIDE
                          </span>
                        )}
                        <span className={`text-[9px] font-mono px-1.5 py-0.5 tracking-wider ${
                          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-500'
                        }`}>
                          {isActive ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </div>
                    </div>

                    {/* Handles */}
                    <div className="space-y-1">
                      {worker.handles.zelle && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] tracking-wider text-saddle/50 w-14">ZELLE</span>
                          <span className="font-mono text-xs text-espresso">{worker.handles.zelle}</span>
                        </div>
                      )}
                      {worker.handles.cashapp && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] tracking-wider text-saddle/50 w-14">CASH</span>
                          <span className="font-mono text-xs text-espresso">{worker.handles.cashapp}</span>
                        </div>
                      )}
                      {worker.handles.venmo && (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[9px] tracking-wider text-saddle/50 w-14">VENMO</span>
                          <span className="font-mono text-xs text-espresso">{worker.handles.venmo}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="px-5 py-3 flex items-center justify-between border-b border-brass/10">
                    <div className="text-center">
                      <p className="font-mono text-xl text-brass font-bold">{count}</p>
                      <p className="font-display text-[8px] tracking-[0.15em] uppercase text-saddle/60">Total</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-xl text-green-700 font-bold">
                        {orders.filter(o => o.status === 'confirmed').length}
                      </p>
                      <p className="font-display text-[8px] tracking-[0.15em] uppercase text-saddle/60">Confirmed</p>
                    </div>
                    <div className="text-center">
                      <p className="font-mono text-xl text-amber-600 font-bold">
                        {orders.filter(o => o.status === 'pending').length}
                      </p>
                      <p className="font-display text-[8px] tracking-[0.15em] uppercase text-saddle/60">Pending</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-5 py-3 flex gap-2">
                    <button
                      onClick={() => handleOverride(isOverride ? null : worker.id)}
                      disabled={!isActive}
                      className={`flex-1 font-display text-[9px] tracking-[0.15em] uppercase py-2 border transition-colors ${
                        isOverride
                          ? 'bg-brass text-espresso border-brass'
                          : 'bg-transparent text-saddle border-saddle/30 hover:border-brass hover:text-espresso'
                      } disabled:opacity-30 disabled:cursor-not-allowed`}>
                      {isOverride ? 'Clear Override' : 'Set Override'}
                    </button>
                    <button
                      onClick={() => setSelectedWorker(isExpanded ? null : worker.id)}
                      className="px-3 py-2 border border-brass/20 text-saddle hover:border-brass hover:text-espresso transition-colors font-mono text-xs">
                      <i className={`ri-${isExpanded ? 'arrow-up' : 'arrow-down'}-s-line`} />
                    </button>
                  </div>

                  {/* Expanded order list */}
                  {isExpanded && (
                    <div className="border-t border-brass/10 max-h-72 overflow-y-auto">
                      {orders.length === 0 ? (
                        <p className="font-body text-xs italic text-saddle/50 text-center py-6">
                          No orders assigned yet.
                        </p>
                      ) : (
                        orders.slice(0, 20).map((order) => (
                          <div key={order.invoiceId}
                            className="px-5 py-3 border-b border-brass/5 last:border-0 flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="font-mono text-[10px] text-espresso truncate">{order.invoiceId}</p>
                              <p className="font-body text-[10px] text-saddle/60 truncate">{order.customerName}</p>
                              <p className="font-mono text-[9px] text-saddle/40">
                                {new Date(order.timestamp).toLocaleString()}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-1 flex-shrink-0">
                              <span className="font-mono text-xs text-brass font-bold">
                                ${order.total.toFixed(2)}
                              </span>
                              <span className={`text-[8px] font-mono px-1.5 py-0.5 ${STATUS_COLOR[order.status] || 'bg-gray-100 text-gray-600'}`}>
                                {order.status.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Rotation log — all unassigned orders (crypto / no worker available) */}
          {(() => {
            const unassigned = auditLog.filter(e => !e.assignedWorkerId && e.paymentMethod !== 'crypto');
            if (unassigned.length === 0) return null;
            return (
              <div className="border border-amber-200 bg-amber-50/30 p-5">
                <h2 className="font-display text-xs tracking-[0.2em] uppercase text-amber-800 mb-4">
                  Unassigned Orders — No Active Worker at Time of Placement
                </h2>
                <div className="space-y-2">
                  {unassigned.map(order => (
                    <div key={order.invoiceId} className="flex items-center justify-between p-3 bg-white/60 border border-amber-100">
                      <span className="font-mono text-xs text-espresso">{order.invoiceId}</span>
                      <span className="font-mono text-xs text-saddle">{order.customerName}</span>
                      <span className="font-mono text-xs text-brass">${order.total.toFixed(2)}</span>
                      <span className="font-mono text-[10px] text-saddle/50">{order.paymentMethod}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()}

          <p className="font-mono text-[10px] text-saddle/40 text-center mt-8">
            Worker handles are configured in <code>src/config/workers.ts</code>
          </p>

        </div>
      </div>
    </PageLayout>
  );
}
