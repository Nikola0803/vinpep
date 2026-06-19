import { useState, useEffect } from 'react';
import { coaEntries } from '@/mocks/coa';
import PageLayout from '@/components/feature/PageLayout';

interface DetailModalProps {
  entry: (typeof coaEntries)[0] | null;
  onClose: () => void;
}

function DetailModal({ entry, onClose }: DetailModalProps) {
  if (!entry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60" onClick={onClose}>
      <div
        className="w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-parchment border border-brass/40 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 md:p-8">
          <div className="flex items-start justify-between mb-6">
            <div>
              <span className="font-mono text-[10px] tracking-widest uppercase text-brass">{entry.batchNumber}</span>
              <h2 className="font-display text-lg md:text-xl text-espresso mt-1">{entry.productName}</h2>
              <p className="font-body text-sm text-saddle mt-1">{entry.peptideCode}</p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-saddle hover:text-espresso transition-colors flex-shrink-0"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          <div className="brass-rule max-w-xs mb-6" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div className="p-4 bg-cream/50 border border-brass/20">
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Purity</p>
              <p className="font-mono text-xl text-espresso">{entry.purity}</p>
            </div>
            <div className="p-4 bg-cream/50 border border-brass/20">
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Test Date</p>
              <p className="font-mono text-sm text-espresso">{entry.testDate}</p>
            </div>
            <div className="p-4 bg-cream/50 border border-brass/20">
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Lab</p>
              <p className="font-body text-sm text-espresso">{entry.labName}</p>
            </div>
            <div className="p-4 bg-cream/50 border border-brass/20">
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Molecular Weight</p>
              <p className="font-mono text-sm text-espresso">{entry.molecularWeight}</p>
            </div>
          </div>

          <div className="mb-6">
            <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-2">Testing Methods</p>
            <div className="flex flex-wrap gap-2">
              {entry.methods.map((m) => (
                <span
                  key={m}
                  className="font-mono text-[10px] tracking-wider uppercase px-3 py-1 border border-brass/30 text-saddle"
                >
                  {m}
                </span>
              ))}
            </div>
          </div>

          <div className="mb-6">
            <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-2">Amino Acid Sequence</p>
            <p className="font-mono text-xs text-espresso bg-cream/50 p-4 border border-brass/20 leading-relaxed break-all">
              {entry.sequence}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <div>
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Appearance</p>
              <p className="font-body text-sm text-espresso">{entry.appearance}</p>
            </div>
            <div>
              <p className="font-display text-[10px] tracking-widest uppercase text-brass mb-1">Storage</p>
              <p className="font-body text-sm text-espresso">{entry.storage}</p>
            </div>
          </div>

          <div className="brass-rule max-w-xs mb-6" />

          <div className="flex flex-col sm:flex-row gap-3">
            {entry.coaUrl !== '#' ? (
              <a
                href={entry.coaUrl}
                target="_blank"
                rel="noopener noreferrer"
                download
                className="flex-1 flex items-center justify-center gap-2 py-3 border border-brass/40 font-display text-[10px] tracking-[0.2em] uppercase text-espresso hover:bg-brass hover:text-parchment transition-colors whitespace-nowrap"
              >
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-file-list-3-line" />
                </span>
                Download COA
              </a>
            ) : (
              <span className="flex-1 flex items-center justify-center gap-2 py-3 border border-brass/20 font-display text-[10px] tracking-[0.2em] uppercase text-saddle/40 whitespace-nowrap cursor-not-allowed">
                <span className="w-4 h-4 flex items-center justify-center">
                  <i className="ri-file-list-3-line" />
                </span>
                COA Coming Soon
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function PdfModal({ url, onClose }: { url: string; onClose: () => void }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;

    // Fetch the PDF as a blob so it never goes through React Router
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to fetch PDF');
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setBlobUrl(objectUrl);
      })
      .catch(() => {
        if (!cancelled) setError(true);
      });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="relative w-full max-w-4xl h-[90vh] bg-espresso flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-2 border-b border-brass/30">
          <span className="font-mono text-[10px] tracking-widest uppercase text-brass">Certificate of Analysis</span>
          <div className="flex items-center gap-3">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-1.5 px-2.5 py-1 border border-brass/40 text-cream/80 hover:text-cream hover:border-brass transition-colors font-mono text-[10px] tracking-wider uppercase"
            >
              <i className="ri-download-line text-xs" />
              Download
            </a>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center text-cream/60 hover:text-cream transition-colors"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>
        </div>
        {error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 text-cream/60 font-mono text-sm px-6 text-center">
            <span>Couldn't preview this PDF in your browser.</span>
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              download
              className="flex items-center gap-2 px-4 py-2 border border-brass/40 text-cream hover:bg-brass hover:text-espresso transition-colors font-mono text-xs uppercase tracking-wider"
            >
              <i className="ri-download-line" />
              Download PDF instead
            </a>
          </div>
        ) : !blobUrl ? (
          <div className="flex-1 flex items-center justify-center text-cream/60 font-mono text-sm">
            Loading…
          </div>
        ) : (
          <iframe
            src={blobUrl}
            className="flex-1 w-full"
            title="Certificate of Analysis"
          />
        )}
      </div>
    </div>
  );
}

export default function CoaPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<(typeof coaEntries)[0] | null>(null);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const filtered = coaEntries.filter((entry) => {
    const q = searchQuery.toLowerCase();
    return (
      entry.productName.toLowerCase().includes(q) ||
      entry.peptideCode.toLowerCase().includes(q) ||
      entry.batchNumber.toLowerCase().includes(q)
    );
  });

  return (
    <PageLayout>
      {/* Hero */}
      <div className="relative bg-espresso text-parchment overflow-hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8 py-16 md:py-24 text-center">
          <span className="text-brass text-lg">&#x2767;</span>
          <h1 className="font-display text-2xl md:text-3xl tracking-[0.2em] uppercase mt-3 mb-4">
            Certificate of Analysis
          </h1>
          <p className="font-body text-sm text-cream/80 leading-relaxed max-w-2xl mx-auto">
            Every batch is independently verified by third-party laboratories.
            Below you will find the complete archive of COA records for all active
            batches, including HPLC chromatograms, mass spectrometry data, and
            full analytical profiles.
          </p>
        </div>
      </div>

      {/* Search + Table */}
      <div className="py-12 md:py-16 parchment-grain">
        <div className="relative z-10 max-w-6xl mx-auto px-4 md:px-8">
          {/* Search bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-8">
            <div className="flex-1 flex items-center gap-3 px-4 py-3 bg-cream/60 border border-brass/30">
              <span className="w-5 h-5 flex items-center justify-center text-brass flex-shrink-0">
                <i className="ri-search-line text-sm" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by product name, peptide code, or batch number..."
                className="flex-1 bg-transparent font-body text-sm text-espresso placeholder:text-saddle/60 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="w-5 h-5 flex items-center justify-center text-saddle hover:text-espresso"
                >
                  <i className="ri-close-line" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2 px-4 py-3 border border-brass/30 bg-cream/60 text-saddle font-mono text-sm">
              <span className="w-4 h-4 flex items-center justify-center text-brass">
                <i className="ri-file-list-3-line text-xs" />
              </span>
              {filtered.length} records
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto border border-brass/30 bg-cream/40">
            <table className="w-full">
              <thead>
                <tr className="border-b border-brass/30 bg-espresso/5">
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Product
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Batch
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Test Date
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Purity
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Methods
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Lab
                  </th>
                  <th className="text-left font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Status
                  </th>
                  <th className="text-right font-display text-[10px] tracking-widest uppercase text-saddle px-5 py-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-brass/10 hover:bg-cream/70 transition-colors"
                  >
                    <td className="px-5 py-4">
                      <p className="font-display text-sm text-espresso">{entry.productName}</p>
                      <p className="font-body text-xs text-saddle mt-0.5">{entry.peptideCode}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-espresso">{entry.batchNumber}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-saddle">{entry.testDate}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-sm text-espresso font-semibold">{entry.purity}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {entry.methods.map((m) => (
                          <span
                            key={m}
                            className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border border-brass/20 text-saddle"
                          >
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-body text-xs text-saddle">{entry.labName}</span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex items-center gap-1.5 font-mono text-[10px] tracking-wider uppercase text-brass-dark">
                        <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                        Verified
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => entry.coaUrl !== '#' ? setPdfUrl(entry.coaUrl) : setSelectedEntry(entry)}
                          className="w-8 h-8 flex items-center justify-center text-saddle hover:text-espresso border border-brass/20 hover:border-brass/60 transition-colors"
                          title={entry.coaUrl !== '#' ? 'View PDF' : 'Details'}
                        >
                          <i className="ri-eye-line text-sm" />
                        </button>
                        {entry.coaUrl !== '#' ? (
                          <a
                            href={entry.coaUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            download
                            className="w-8 h-8 flex items-center justify-center text-saddle hover:text-espresso border border-brass/20 hover:border-brass/60 transition-colors"
                            title="Download COA"
                          >
                            <i className="ri-download-line text-sm" />
                          </a>
                        ) : (
                          <span
                            className="w-8 h-8 flex items-center justify-center text-saddle/30 border border-brass/10 cursor-not-allowed"
                            title="COA Coming Soon"
                          >
                            <i className="ri-download-line text-sm" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((entry) => (
              <div
                key={entry.id}
                className="border border-brass/30 bg-cream/40 p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-display text-sm text-espresso">{entry.productName}</p>
                    <p className="font-body text-xs text-saddle mt-0.5">{entry.peptideCode}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 font-mono text-[9px] tracking-wider uppercase text-brass-dark">
                    <span className="w-1.5 h-1.5 rounded-full bg-brass" />
                    Verified
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="font-display text-[9px] tracking-widest uppercase text-brass">Batch</p>
                    <p className="font-mono text-xs text-espresso">{entry.batchNumber}</p>
                  </div>
                  <div>
                    <p className="font-display text-[9px] tracking-widest uppercase text-brass">Date</p>
                    <p className="font-mono text-xs text-espresso">{entry.testDate}</p>
                  </div>
                  <div>
                    <p className="font-display text-[9px] tracking-widest uppercase text-brass">Purity</p>
                    <p className="font-mono text-sm text-espresso font-semibold">{entry.purity}</p>
                  </div>
                  <div>
                    <p className="font-display text-[9px] tracking-widest uppercase text-brass">Lab</p>
                    <p className="font-body text-xs text-espresso">{entry.labName}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mb-3">
                  {entry.methods.map((m) => (
                    <span
                      key={m}
                      className="font-mono text-[9px] tracking-wider uppercase px-2 py-0.5 border border-brass/20 text-saddle"
                    >
                      {m}
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => entry.coaUrl !== '#' ? setPdfUrl(entry.coaUrl) : setSelectedEntry(entry)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brass/30 font-display text-[10px] tracking-wider uppercase text-espresso hover:bg-brass hover:text-parchment transition-colors"
                  >
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-eye-line text-xs" />
                    </span>
                    {entry.coaUrl !== '#' ? 'View PDF' : 'Details'}
                  </button>
                  <button className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-brass/30 font-display text-[10px] tracking-wider uppercase text-espresso hover:bg-brass hover:text-parchment transition-colors">
                    <span className="w-4 h-4 flex items-center justify-center">
                      <i className="ri-download-line text-xs" />
                    </span>
                    COA
                  </button>
                </div>
              </div>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="text-center py-16 border border-brass/30 bg-cream/40">
              <span className="w-12 h-12 flex items-center justify-center mx-auto mb-4 text-saddle/40">
                <i className="ri-search-line text-2xl" />
              </span>
              <p className="font-display text-sm text-saddle">No records found</p>
              <p className="font-body text-xs text-saddle/60 mt-1">Try a different search term</p>
            </div>
          )}
        </div>
      </div>

      {/* Testing Methodology */}
      <div className="py-12 md:py-16 bg-cream bg-cream-grain">
        <div className="relative z-10 max-w-4xl mx-auto px-4 md:px-8">
          <div className="text-center mb-10">
            <span className="text-brass text-lg">&#x2767;</span>
            <h2 className="font-display text-lg md:text-xl tracking-[0.2em] uppercase text-espresso mt-3">
              Our Testing Protocol
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: 'ri-bar-chart-line',
                title: 'HPLC Analysis',
                description:
                  'High Performance Liquid Chromatography is used to determine purity and identify impurities. Each sample is run against reference standards with a minimum resolution of 99%.',
              },
              {
                icon: 'ri-flask-line',
                title: 'Mass Spectrometry',
                description:
                  'Electrospray ionization mass spectrometry confirms the molecular weight and identity of the peptide sequence. MALDI-TOF is used for larger peptides.',
              },
              {
                icon: 'ri-file-check-line',
                title: 'Amino Acid Analysis',
                description:
                  'Acid hydrolysis followed by chromatographic analysis verifies the correct amino acid composition and molar ratios for each peptide sequence.',
              },
            ].map((item, i) => (
              <div key={i} className="text-center p-5 border border-brass/30 bg-parchment/60">
                <div className="mx-auto w-12 h-12 rounded-full border border-brass flex items-center justify-center mb-4">
                  <span className="w-5 h-5 flex items-center justify-center text-brass">
                    <i className={`${item.icon} text-sm`} />
                  </span>
                </div>
                <h3 className="font-display text-xs tracking-[0.2em] uppercase text-espresso mb-3">
                  {item.title}
                </h3>
                <p className="font-body text-sm text-saddle leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>

          <div className="brass-rule max-w-md mx-auto my-10" />

          <div className="text-center">
            <p className="font-body text-sm text-saddle leading-relaxed max-w-2xl mx-auto">
              All testing is performed by independent third-party laboratories with
              ISO 17025 accreditation. COA documents are digitally archived and
              cross-referenced by batch number for full traceability. If you have
              questions about a specific batch, please contact our research support team.
            </p>
          </div>
        </div>
      </div>

      <DetailModal entry={selectedEntry} onClose={() => setSelectedEntry(null)} />
      {pdfUrl && <PdfModal url={pdfUrl} onClose={() => setPdfUrl(null)} />}
    </PageLayout>
  );
}