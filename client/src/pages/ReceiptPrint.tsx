import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import api from '../lib/api';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

const formatTime = (dateStr: string) =>
  new Date(dateStr).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

export default function ReceiptPrint() {
  const { id } = useParams<{ id: string }>();
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await api.get(`/invoices/${id}`);
        setInvoice(res.data.data);
      } catch (err) {
        console.error('Failed to fetch invoice for print', err);
      }
    };
    fetch();
  }, [id]);

  useEffect(() => {
    if (invoice) {
      setTimeout(() => {
        window.print();
        // We do not auto-close because the user might want to re-print or save as PDF
      }, 800);
    }
  }, [invoice]);

  if (!invoice) return <div className="p-4 font-['IBM_Plex_Sans'] text-black bg-white min-h-screen">Loading Receipt...</div>;

  const isInterState = invoice.customer ? invoice.customer.stateCode !== '01' : false;
  // If the invoice has warranty items, generate a warranty url to embed in QR code.
  // We'll point it to our root url + /warranty lookup
  const warrantyUrl = `${window.location.origin}/warranty?search=${invoice.invoiceNumber}`;

  return (
    <div className="bg-white text-black min-h-screen print-container">
      {/* 80mm width is approx 302px. We use 280px max-w to ensure margins on all thermal printers */}
      <div className="w-[280px] mx-auto p-2 font-['JetBrains_Mono'] text-[11px] leading-tight">
        
        {/* Header */}
        <div className="text-center mb-4">
          <h1 className="text-lg font-bold mb-1 font-['Playfair_Display']">JANWARI INDUSTRIES</h1>
          <p>Industrial Estate, Sopore</p>
          <p>Ph: 7006083933</p>
          <p>GST: 01AABCJ1234D1Z5</p> 
        </div>

        <div className="border-t border-dashed border-slate-400 my-2"></div>
        
        {/* Invoice Info */}
        <div className="mb-2">
          <p className="font-bold">INV: {invoice.invoiceNumber}</p>
          <div className="flex justify-between">
            <span>Date: {formatDate(invoice.createdAt)}</span>
            <span>{formatTime(invoice.createdAt)}</span>
          </div>
          <p>Cashier: {invoice.createdBy?.name || 'Admin'}</p>
        </div>

        <div className="border-t border-dashed border-slate-400 my-2"></div>

        {/* Customer Info */}
        <div className="mb-2">
          <p>CUST: {invoice.customer?.name || 'Walk-in'}</p>
          {invoice.customer?.phone && <p>Ph: {invoice.customer.phone}</p>}
          {invoice.vehicle && <p>Veh: {invoice.vehicle.regNumber}</p>}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2"></div>

        {/* Items Table */}
        <div className="mb-2">
          {invoice.items.map((item: any, i: number) => (
            <div key={item.id} className="mb-2">
              <div className="flex justify-between mb-0.5 font-bold">
                <span className="truncate pr-2">{i + 1}. {item.product?.name}</span>
                <span>{item.isExchange ? '' : formatINR(item.rate)}</span>
              </div>
              <div className="pl-3 text-[10px] text-slate-800">
                {item.serialNumber && <p className="mb-0.5">(SN: {item.serialNumber.serial || item.serialNumber})</p>}
                
                {!item.isExchange && (
                  <div className="flex justify-between">
                    <span>Qty: {item.quantity}</span>
                    {item.discount > 0 && <span>Disc: -{formatINR(item.discount)}</span>}
                  </div>
                )}
                
                {!item.isExchange && (
                  !isInterState ? (
                    <>
                      <div className="flex justify-between">
                        <span>CGST {(item.gstRate / 2)}%</span>
                        <span>{formatINR(item.cgst)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>SGST {(item.gstRate / 2)}%</span>
                        <span>{formatINR(item.sgst)}</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex justify-between">
                      <span>IGST {item.gstRate}%</span>
                      <span>{formatINR(item.igst)}</span>
                    </div>
                  )
                )}

                {item.isExchange && (
                  <div className="flex justify-between">
                    <span>Exchange Disc</span>
                    <span>-{formatINR(Math.abs(item.lineTotal))}</span>
                  </div>
                )}

                <div className="flex justify-between mt-0.5 font-bold text-black border-t border-dotted border-slate-300 pt-0.5">
                  <span>Total</span>
                  <span>{formatINR(item.lineTotal)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2"></div>

        {/* Totals Summary */}
        <div className="mb-2 text-sm">
          <div className="flex justify-between mb-1 text-xs">
            <span>Subtotal</span>
            <span>{formatINR(invoice.subtotal)}</span>
          </div>
          {invoice.totalDiscount > 0 && (
            <div className="flex justify-between mb-1 text-xs">
              <span>Discount</span>
              <span>-{formatINR(invoice.totalDiscount)}</span>
            </div>
          )}
          <div className="flex justify-between mb-1 font-bold text-base border-t border-black border-b py-1 my-1">
            <span>TOTAL</span>
            <span>{formatINR(invoice.grandTotal)}</span>
          </div>
          
          <div className="mt-2 text-xs">
            {invoice.payments.map((p: any) => (
              <div key={p.id} className="flex justify-between line-through-none">
                <span>{p.mode}</span>
                <span>{formatINR(p.amount)}</span>
              </div>
            ))}
          </div>

          {(invoice.balanceAmount > 0) && (
             <div className="flex justify-between mt-1 pt-1 font-bold text-xs">
               <span>BALANCE DUE</span>
               <span>{formatINR(invoice.balanceAmount)}</span>
             </div>
          )}
        </div>

        <div className="border-t border-dashed border-slate-400 my-2"></div>

        {/* Footer & QR */}
        <div className="text-center mt-3 mb-8">
          <p className="font-bold mb-2">WARRANTY: 24M + 24M Pro-rata</p>
          
          <div className="flex justify-center my-3">
             <QRCodeSVG value={warrantyUrl} size={90} level="M" />
          </div>
          <p className="text-[9px] mb-2">Scan for warranty status</p>
          
          <p className="font-bold mt-2">Thank you! Drive safe!</p>
          <p className="mt-3 text-[8px] text-slate-500">System by Zoonigia</p>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          body { 
            background: white; 
            color: black;
            margin: 0; 
            padding: 0; 
          }
          .print-container {
             background: white !important;
          }
          @page { 
            size: 80mm auto; 
            margin: 0; 
          }
          /* Hide the default URL/Date headers/footers the browser tries to add */
          @page :first {
              margin: 0;
          }
        }
      `}} />
    </div>
  );
}
