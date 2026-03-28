import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Fuse from 'fuse.js';
import {
  AlertCircle,
  Camera,
  Check,
  FileImage,
  Loader2,
  RefreshCcw,
  ScanLine,
  Search,
  Upload,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { useCartStore } from '../stores/cartStore';

interface InventoryProduct {
  id: string;
  name: string;
  brand?: string;
  sku?: string;
  hsnCode?: string;
  gstRate: number;
  mrp: number;
  isBattery: boolean;
  unit?: string;
}

interface SnapToBillResponseItem {
  description: string;
  quantity: number | null;
  unit: string | null;
  rate: number | null;
  amount: number | null;
  confidence: 'high' | 'low';
}

interface SnapToBillResponse {
  vendor: string | null;
  date: string | null;
  total: number | null;
  notes: string | null;
  items: SnapToBillResponseItem[];
}

interface EditableRow {
  id: string;
  description: string;
  quantity: string;
  unit: string;
  rate: string;
  amount: string;
  confidence: 'high' | 'low';
  matchedProductId: string;
  matchQuery: string;
  useCustomItem: boolean;
}

const ACCEPTED_FILE_TYPES = 'image/jpeg,image/png,image/webp,application/pdf,.docx,.xlsx';
const MAX_FILE_SIZE = 10 * 1024 * 1024;

function formatINR(amount: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(amount);
}

function toInputValue(value: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return '';
  return String(value);
}

function parseNumber(value: string) {
  if (!value.trim()) return null;
  const parsed = Number(value.replace(/,/g, '').trim());
  return Number.isFinite(parsed) ? parsed : null;
}

function inferBattery(description: string) {
  const normalized = description.toLowerCase();
  return ['battery', 'ah', 'tubular', 'inverter'].some((token) => normalized.includes(token));
}

function buildDraftNotes(vendor: string, date: string, notes: string) {
  return [
    vendor ? `Snap-to-Bill vendor: ${vendor}` : '',
    date ? `Snap-to-Bill date: ${date}` : '',
    notes ? `Snap-to-Bill notes: ${notes}` : '',
  ]
    .filter(Boolean)
    .join('\n');
}

function ProductMatchField({
  row,
  products,
  onSelect,
  onCustomToggle,
}: {
  row: EditableRow;
  products: InventoryProduct[];
  onSelect: (product: InventoryProduct | null, query?: string) => void;
  onCustomToggle: (checked: boolean) => void;
}) {
  const [open, setOpen] = useState(false);

  const matches = row.matchQuery.trim()
    ? products
        .filter((product) => {
          const query = row.matchQuery.toLowerCase();
          return (
            product.name.toLowerCase().includes(query) ||
            product.brand?.toLowerCase().includes(query) ||
            product.sku?.toLowerCase().includes(query)
          );
        })
        .slice(0, 6)
    : products.slice(0, 6);

  const selectedProduct = products.find((product) => product.id === row.matchedProductId);

  return (
    <div className="relative min-w-[220px]">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ji-text-dim" />
        <input
          type="text"
          value={selectedProduct ? selectedProduct.name : row.matchQuery}
          onChange={(event) => {
            onSelect(null, event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search product"
          className="w-full rounded-xl border border-ji-border bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
        />
      </div>

      {open && !row.useCustomItem && (
        <div className="absolute left-0 right-0 top-[calc(100%+0.35rem)] z-20 max-h-56 overflow-y-auto rounded-2xl border border-ji-border bg-white p-2 shadow-2xl">
          {matches.length > 0 ? (
            matches.map((product) => (
              <button
                key={product.id}
                type="button"
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => {
                  onSelect(product, product.name);
                  setOpen(false);
                }}
                className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left transition hover:bg-ji-bg"
              >
                <div>
                  <p className="text-xs font-bold text-ji-text">{product.name}</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-ji-text-dim">
                    {product.brand || 'Generic'} {product.sku ? `- ${product.sku}` : ''}
                  </p>
                </div>
                <span className="text-[10px] font-black text-ji-amber">{formatINR(product.mrp)}</span>
              </button>
            ))
          ) : (
            <div className="rounded-xl border border-dashed border-ji-border px-3 py-4 text-center">
              <p className="text-xs font-semibold text-ji-text-dim">No match found</p>
              <button
                type="button"
                onClick={() => {
                  onCustomToggle(true);
                  setOpen(false);
                }}
                className="mt-2 text-xs font-black uppercase tracking-[0.2em] text-ji-amber"
              >
                Add as custom item
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-2 flex items-center justify-between gap-3">
        {selectedProduct ? (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-emerald-600">
            Matched to inventory
          </p>
        ) : row.useCustomItem ? (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ji-amber">
            Custom invoice item
          </p>
        ) : (
          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-ji-text-dim">
            Select a product or use custom item
          </p>
        )}

        <button
          type="button"
          onClick={() => onCustomToggle(!row.useCustomItem)}
          className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] transition ${
            row.useCustomItem
              ? 'border border-ji-amber/30 bg-ji-amber/10 text-ji-amber'
              : 'border border-ji-border bg-white text-ji-text-dim hover:border-ji-amber/30 hover:text-ji-amber'
          }`}
        >
          {row.useCustomItem ? 'Custom item' : 'Use custom'}
        </button>
      </div>
    </div>
  );
}

export default function SnapToBill() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const clearCart = useCartStore((state) => state.clearCart);
  const setItems = useCartStore((state) => state.setItems);
  const setNotes = useCartStore((state) => state.setNotes);
  const setCustomer = useCartStore((state) => state.setCustomer);
  const setMechanic = useCartStore((state) => state.setMechanic);
  const setPayment = useCartStore((state) => state.setPayment);

  const [products, setProducts] = useState<InventoryProduct[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isImagePreview, setIsImagePreview] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [vendor, setVendor] = useState('');
  const [billDate, setBillDate] = useState('');
  const [notes, setLocalNotes] = useState('');
  const [rows, setRows] = useState<EditableRow[]>([]);
  const [extractedTotal, setExtractedTotal] = useState<number | null>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await api.get('/products', { params: { limit: '500' } });
        setProducts(response.data.data || []);
      } catch {
        toast.error('Could not load inventory for product matching');
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    if (!selectedFile) {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
      setPreviewUrl(null);
      setIsImagePreview(false);
      return;
    }

    const nextPreviewUrl = URL.createObjectURL(selectedFile);
    const isImage = selectedFile.type.startsWith('image/');
    setPreviewUrl(nextPreviewUrl);
    setIsImagePreview(isImage);

    return () => {
      URL.revokeObjectURL(nextPreviewUrl);
    };
  }, [selectedFile]);

  const resetState = () => {
    setSelectedFile(null);
    setErrorMessage('');
    setVendor('');
    setBillDate('');
    setLocalNotes('');
    setRows([]);
    setExtractedTotal(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  const findAutoMatch = (description: string) => {
    if (!description.trim() || products.length === 0) return null;

    const fuse = new Fuse(products, {
      keys: ['name', 'brand', 'sku'],
      threshold: 0.4,
      includeScore: true,
    });

    const bestMatch = fuse.search(description, { limit: 1 })[0];
    if (!bestMatch) return null;

    const confidence = 1 - (bestMatch.score ?? 1);
    return confidence > 0.6 ? bestMatch.item : null;
  };

  const populateExtraction = (payload: SnapToBillResponse) => {
    setVendor(payload.vendor || '');
    setBillDate(payload.date || '');
    setLocalNotes(payload.notes || '');
    setExtractedTotal(payload.total ?? null);

    const mappedRows = payload.items.map((item, index) => {
      const matchedProduct = findAutoMatch(item.description);
      return {
        id: `snap-row-${index + 1}`,
        description: item.description,
        quantity: toInputValue(item.quantity),
        unit: item.unit || '',
        rate: toInputValue(item.rate),
        amount: toInputValue(item.amount),
        confidence: item.confidence,
        matchedProductId: matchedProduct?.id || '',
        matchQuery: matchedProduct?.name || item.description,
        useCustomItem: !matchedProduct,
      };
    });

    setRows(mappedRows);

    if (mappedRows.length === 0) {
      setErrorMessage('No items found in image. Try a clearer photo.');
      return;
    }

    setErrorMessage('');
  };

  const uploadAndExtract = async (file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      setErrorMessage('Image too large. Please choose a file under 10MB.');
      return;
    }

    setSelectedFile(file);
    setErrorMessage('');
    setRows([]);
    setVendor('');
    setBillDate('');
    setLocalNotes('');
    setExtractedTotal(null);
    setIsReading(true);

    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await api.post('/snap-to-bill', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000,
      });

      populateExtraction(response.data.data as SnapToBillResponse);
      toast.success('Bill scanned successfully');
    } catch (error: any) {
      const fallback = !error.response
        ? 'Connection failed. Check your internet.'
        : error.response?.data?.error || 'Could not read bill. Please try again or enter items manually.';
      setErrorMessage(fallback);
    } finally {
      setIsReading(false);
    }
  };

  const handleFileSelection = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadAndExtract(file);
  };

  const updateRow = (rowId: string, patch: Partial<EditableRow>) => {
    setRows((currentRows) =>
      currentRows.map((row) => {
        if (row.id !== rowId) return row;

        const nextRow = { ...row, ...patch };

        if ((patch.quantity !== undefined || patch.rate !== undefined) && patch.amount === undefined) {
          const quantity = parseNumber(nextRow.quantity);
          const rate = parseNumber(nextRow.rate);
          if (quantity !== null && rate !== null) {
            nextRow.amount = String(Math.round(quantity * rate * 100) / 100);
          }
        }

        return nextRow;
      })
    );
  };

  const removeRow = (rowId: string) => {
    setRows((currentRows) => currentRows.filter((row) => row.id !== rowId));
  };

  const createDraftInvoice = () => {
    if (rows.length === 0) {
      toast.error('No extracted items to create a draft invoice');
      return;
    }

    const draftItems = [];

    for (const row of rows) {
      const quantity = parseNumber(row.quantity) ?? 1;
      const rate = parseNumber(row.rate);
      const amount = parseNumber(row.amount);
      const matchedProduct = products.find((product) => product.id === row.matchedProductId);

      if (!row.description.trim()) {
        toast.error('Every row needs an item description before creating a draft');
        return;
      }

      if (rate === null && amount === null) {
        toast.error(`Enter a rate or amount for "${row.description}" before continuing`);
        return;
      }

      if (!matchedProduct && !row.useCustomItem) {
        toast.error(`Match "${row.description}" to a product or mark it as a custom item`);
        return;
      }

      if (matchedProduct) {
        draftItems.push({
          id: `snap-${matchedProduct.id}-${row.id}`,
          productId: matchedProduct.id,
          name: matchedProduct.name,
          brand: matchedProduct.brand || '',
          sku: matchedProduct.sku || '',
          hsnCode: matchedProduct.hsnCode || '',
          mrp: rate ?? matchedProduct.mrp,
          gstRate: matchedProduct.gstRate,
          quantity,
          discount: 0,
          isBattery: matchedProduct.isBattery,
          isExchange: false,
          isWarrantyClaim: false,
          isCustomItem: false,
          sourceDescription: row.description,
          unit: row.unit || matchedProduct.unit || 'PCS',
          lineTotal: 0,
          lineTaxable: 0,
          lineGST: 0,
          lineGrandTotal: 0,
        });
        continue;
      }

      const isBattery = inferBattery(row.description);
      const fallbackRate = rate ?? ((amount ?? 0) / Math.max(quantity, 1));

      draftItems.push({
        id: `snap-custom-${row.id}`,
        productId: `custom-${row.id}`,
        name: row.description,
        brand: 'Custom',
        sku: '',
        hsnCode: isBattery ? '8507' : '0000',
        mrp: Math.round(fallbackRate * 100) / 100,
        gstRate: isBattery ? 28 : 18,
        quantity,
        discount: 0,
        isBattery,
        isExchange: false,
        isWarrantyClaim: false,
        isCustomItem: true,
        sourceDescription: row.description,
        unit: row.unit || 'PCS',
        lineTotal: 0,
        lineTaxable: 0,
        lineGST: 0,
        lineGrandTotal: 0,
      });
    }

    clearCart();
    setCustomer(null);
    setMechanic(null);
    setPayment({ cash: 0, upi: 0, credit: 0 });
    setItems(draftItems);
    setNotes(buildDraftNotes(vendor, billDate, notes));

    toast.success('Draft invoice created. Review and finalize it before saving.');
    navigate('/invoices/new');
  };

  const derivedGrandTotal = rows.reduce((sum, row) => sum + (parseNumber(row.amount) ?? 0), 0);

  return (
    <div className="flex h-[calc(100vh-8rem)] min-h-[680px] flex-col gap-6 xl:flex-row">
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        className="hidden"
        onChange={handleFileSelection}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="hidden"
        onChange={handleFileSelection}
      />

      <section className="flex min-h-[320px] flex-col overflow-hidden rounded-[2rem] border border-ji-border bg-white shadow-sm xl:w-[45%]">
        <div className="flex items-center justify-between border-b border-ji-border px-6 py-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-ji-text-dim">Bill Image</p>
            <h2 className="mt-1 text-2xl font-['Playfair_Display'] font-bold text-ji-text">Snap-to-Bill</h2>
          </div>
          {selectedFile && (
            <button
              type="button"
              onClick={resetState}
              className="rounded-2xl border border-ji-border bg-ji-bg px-4 py-2 text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            >
              Clear
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col p-6">
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl bg-ji-amber px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-ji-amber/15 transition hover:bg-ji-amber/90"
            >
              <Upload size={16} />
              Upload Image
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-2xl border border-ji-border bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-ji-text transition hover:border-ji-amber/30 hover:text-ji-amber"
            >
              <Camera size={16} />
              Capture Photo
            </button>
          </div>

          <div className="mt-5 flex-1 rounded-[1.75rem] border border-dashed border-ji-border bg-ji-bg/40 p-4">
            {previewUrl ? (
              isImagePreview ? (
                <img
                  src={previewUrl}
                  alt="Selected bill preview"
                  className="h-full w-full rounded-[1.25rem] object-contain"
                />
              ) : (
                <div className="flex h-full flex-col items-center justify-center rounded-[1.25rem] bg-white px-6 text-center">
                  <FileImage size={44} className="text-ji-amber" />
                  <p className="mt-4 text-sm font-bold text-ji-text">{selectedFile?.name}</p>
                  <p className="mt-2 max-w-md text-xs text-ji-text-dim">
                    Preview is available for image files. You can still submit this file, but the current extractor works best with clear JPG, PNG, or WEBP photos.
                  </p>
                </div>
              )
            ) : (
              <div className="flex h-full flex-col items-center justify-center rounded-[1.25rem] bg-white px-6 text-center">
                <div className="flex h-20 w-20 items-center justify-center rounded-[1.75rem] border border-ji-border bg-ji-bg">
                  <ScanLine size={34} className="text-ji-amber" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-ji-text">Upload a handwritten or printed bill</h3>
                <p className="mt-2 max-w-md text-sm text-ji-text-dim">
                  The left side previews the bill image. The right side shows extracted items you can correct before creating a draft invoice.
                </p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">
                  JPG, PNG, WEBP, PDF, DOCX, XLSX up to 10MB
                </p>
              </div>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between rounded-2xl border border-ji-border bg-white px-4 py-3">
            <div>
              <p className="text-xs font-bold text-ji-text">{selectedFile?.name || 'No file selected yet'}</p>
              <p className="text-[10px] uppercase tracking-[0.18em] text-ji-text-dim">
                {selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : 'Choose a clear bill photo'}
              </p>
            </div>
            {selectedFile && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-xl border border-ji-border px-3 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ji-text-dim transition hover:border-ji-amber/30 hover:text-ji-amber"
              >
                Re-upload
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="flex min-h-[320px] flex-1 flex-col overflow-hidden rounded-[2rem] border border-ji-border bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-ji-border px-6 py-5">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-ji-text">Extracted Items</h2>
              <span className="rounded-full bg-ji-bg px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">
                {rows.length} item{rows.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ji-text-dim">
              Review the scan, correct anything uncertain, and create a draft invoice only when it looks right.
            </p>
          </div>

          {selectedFile && !isReading && (
            <button
              type="button"
              onClick={() => uploadAndExtract(selectedFile)}
              className="inline-flex items-center gap-2 rounded-2xl border border-ji-border bg-white px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-ji-text transition hover:border-ji-amber/30 hover:text-ji-amber"
            >
              <RefreshCcw size={14} />
              Retry Scan
            </button>
          )}
        </div>

        <div className="flex flex-1 flex-col overflow-hidden">
          {isReading ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-ji-amber/10">
                <Loader2 size={36} className="animate-spin text-ji-amber" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ji-text">Reading bill...</h3>
              <p className="mt-2 max-w-md text-sm text-ji-text-dim">
                Claude is extracting the bill line items. Nothing is saved yet, and you will review every field before it becomes a draft invoice.
              </p>
            </div>
          ) : errorMessage ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-red-50">
                <AlertCircle size={36} className="text-red-500" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ji-text">Scan could not be completed</h3>
              <p className="mt-2 max-w-lg text-sm text-ji-text-dim">{errorMessage}</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={() => selectedFile && uploadAndExtract(selectedFile)}
                  disabled={!selectedFile}
                  className="rounded-2xl bg-ji-amber px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-white transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Retry
                </button>
                <button
                  type="button"
                  onClick={resetState}
                  className="rounded-2xl border border-ji-border px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-ji-text transition hover:border-ji-amber/30 hover:text-ji-amber"
                >
                  Start over
                </button>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-[1.8rem] bg-ji-bg">
                <ScanLine size={36} className="text-ji-amber" />
              </div>
              <h3 className="mt-5 text-xl font-bold text-ji-text">Ready to extract a bill</h3>
              <p className="mt-2 max-w-lg text-sm text-ji-text-dim">
                Upload a bill photo or capture one from the camera. Once scanned, uncertain rows are highlighted in amber so they are easy to correct.
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-auto p-6">
                <div className="min-w-[960px] rounded-[1.5rem] border border-ji-border">
                  <div className="grid grid-cols-[2.2fr,0.7fr,0.8fr,1fr,1fr,2.4fr,56px] gap-4 border-b border-ji-border bg-ji-bg/60 px-4 py-3 text-[10px] font-black uppercase tracking-[0.24em] text-ji-text-dim">
                    <span>Description</span>
                    <span>Qty</span>
                    <span>Unit</span>
                    <span>Rate</span>
                    <span>Amount</span>
                    <span>Match to Product</span>
                    <span />
                  </div>

                  {rows.map((row) => (
                    <div
                      key={row.id}
                      className={`grid grid-cols-[2.2fr,0.7fr,0.8fr,1fr,1fr,2.4fr,56px] gap-4 border-b border-ji-border px-4 py-4 last:border-b-0 ${
                        row.confidence === 'low' ? 'bg-amber-50/80' : 'bg-white'
                      }`}
                    >
                      <div>
                        <input
                          type="text"
                          value={row.description}
                          onChange={(event) => updateRow(row.id, { description: event.target.value })}
                          className="w-full rounded-xl border border-ji-border bg-white px-3 py-2.5 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                        />
                        {row.confidence === 'low' && (
                          <p className="mt-2 text-[10px] font-black uppercase tracking-[0.18em] text-ji-amber">
                            Low-confidence OCR. Please verify.
                          </p>
                        )}
                      </div>

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.quantity}
                        onChange={(event) => updateRow(row.id, { quantity: event.target.value })}
                        className="rounded-xl border border-ji-border bg-white px-3 py-2.5 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                      />

                      <input
                        type="text"
                        value={row.unit}
                        onChange={(event) => updateRow(row.id, { unit: event.target.value })}
                        placeholder="PCS"
                        className="rounded-xl border border-ji-border bg-white px-3 py-2.5 text-sm font-semibold uppercase text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.rate}
                        onChange={(event) => updateRow(row.id, { rate: event.target.value })}
                        className="rounded-xl border border-ji-border bg-white px-3 py-2.5 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                      />

                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={row.amount}
                        onChange={(event) => updateRow(row.id, { amount: event.target.value })}
                        className="rounded-xl border border-ji-border bg-white px-3 py-2.5 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                      />

                      <ProductMatchField
                        row={row}
                        products={products}
                        onSelect={(product, query) => {
                          updateRow(row.id, {
                            matchedProductId: product?.id || '',
                            matchQuery: query ?? row.matchQuery,
                            useCustomItem: product ? false : row.useCustomItem,
                            unit: product?.unit || row.unit,
                            rate: product && !row.rate ? String(product.mrp) : row.rate,
                          });
                        }}
                        onCustomToggle={(checked) => {
                          updateRow(row.id, {
                            useCustomItem: checked,
                            matchedProductId: checked ? '' : row.matchedProductId,
                          });
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => removeRow(row.id)}
                        className="flex h-11 w-11 items-center justify-center self-start rounded-xl border border-ji-border bg-white text-ji-text-dim transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">
                      Vendor
                    </label>
                    <input
                      type="text"
                      value={vendor}
                      onChange={(event) => setVendor(event.target.value)}
                      placeholder="Vendor name"
                      className="w-full rounded-2xl border border-ji-border bg-white px-4 py-3 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">
                      Date
                    </label>
                    <input
                      type="text"
                      value={billDate}
                      onChange={(event) => setBillDate(event.target.value)}
                      placeholder="DD/MM/YYYY"
                      className="w-full rounded-2xl border border-ji-border bg-white px-4 py-3 text-sm font-semibold text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                    />
                  </div>

                  <div className="rounded-2xl border border-ji-border bg-ji-bg/40 px-4 py-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">Extracted total</p>
                    <p className="mt-2 text-xl font-black text-ji-text">
                      {extractedTotal !== null ? formatINR(extractedTotal) : formatINR(derivedGrandTotal)}
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.22em] text-ji-text-dim">
                    Notes
                  </label>
                  <textarea
                    value={notes}
                    onChange={(event) => setLocalNotes(event.target.value)}
                    rows={4}
                    placeholder="Any bill comments, handwritten notes, transport info, or reminders"
                    className="w-full rounded-2xl border border-ji-border bg-white px-4 py-3 text-sm font-medium text-ji-text outline-none transition focus:border-ji-amber focus:ring-2 focus:ring-ji-amber/10"
                  />
                </div>
              </div>

              <div className="border-t border-ji-border bg-ji-bg/30 px-6 py-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-3 text-sm text-ji-text-dim">
                    <Check size={16} className="text-emerald-600" />
                    <span>Nothing is saved yet. Draft invoice creation only prepares the New Invoice screen.</span>
                  </div>

                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      onClick={resetState}
                      className="rounded-2xl border border-ji-border bg-white px-5 py-3 text-xs font-black uppercase tracking-[0.22em] text-ji-text transition hover:border-ji-amber/30 hover:text-ji-amber"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={createDraftInvoice}
                      className="rounded-2xl bg-ji-amber px-6 py-3 text-xs font-black uppercase tracking-[0.22em] text-white shadow-lg shadow-ji-amber/15 transition hover:bg-ji-amber/90"
                    >
                      Create Draft Invoice
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
