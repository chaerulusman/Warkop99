import React from 'react';
import { Printer, X, CheckCircle, Bike, Coffee } from 'lucide-react';
import { Order, WarkopSettings } from '../types';
import { formatRupiah, formatDateTime } from '../utils/format';

interface ReceiptModalProps {
  order: Order;
  settings: WarkopSettings;
  onClose: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ order, settings, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isGojek = order.channel === 'gofood';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <h3 className="font-bold text-stone-900 text-base">Transaksi Berhasil</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
            title="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Receipt Body (Target for printing) */}
        <div className="flex-1 overflow-y-auto p-6 bg-stone-100/50 flex justify-center">
          
          <div
            id="thermal-receipt-print-area"
            className="w-full max-w-[340px] bg-white p-6 shadow-sm border border-stone-200 text-stone-800 font-mono text-xs leading-relaxed"
          >
            {/* Store Header */}
            <div className="text-center pb-3 border-b border-dashed border-stone-300">
              <div className="flex items-center justify-center gap-1.5 font-bold text-stone-900 text-sm mb-1 uppercase tracking-tight">
                <Coffee className="w-4 h-4 text-amber-800 inline" />
                <span>{settings.storeName}</span>
              </div>
              <p className="text-[11px] text-stone-500">{settings.address}</p>
              <p className="text-[11px] text-stone-500">Telp: {settings.phone}</p>
            </div>

            {/* Channel Banner */}
            <div className="py-2.5 my-2 border-b border-dashed border-stone-300">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-stone-600">Saluran:</span>
                <span
                  className={`px-2 py-0.5 rounded font-bold uppercase text-[11px] ${
                    isGojek
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1'
                      : 'bg-amber-100 text-amber-900 border border-amber-300'
                  }`}
                >
                  {isGojek && <Bike className="w-3.5 h-3.5 inline" />}
                  {isGojek ? 'Pesanan GoFood' : 'Penjualan Langsung'}
                </span>
              </div>

              {isGojek && order.gofoodDetails && (
                <div className="mt-2 pt-2 border-t border-stone-200 text-[11px] space-y-1">
                  <div className="flex justify-between">
                    <span className="text-stone-500">No. Pesanan:</span>
                    <span className="font-bold text-stone-900">{order.gofoodDetails.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">PIN Driver:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-1 rounded">
                      {order.gofoodDetails.deliveryPin}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Driver:</span>
                    <span className="font-medium text-stone-800 truncate max-w-[170px]">
                      {order.gofoodDetails.driverName}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-stone-500">Pelanggan:</span>
                    <span className="font-medium text-stone-800">{order.gofoodDetails.customerName}</span>
                  </div>
                </div>
              )}

              {!isGojek && (
                <div className="mt-2 text-[11px] flex justify-between">
                  <span className="text-stone-500">Keterangan/Meja:</span>
                  <span className="font-semibold text-stone-900">{order.tableOrNote || 'Bawa Pulang (Takeaway)'}</span>
                </div>
              )}
            </div>

            {/* Metadata (Time & ID) */}
            <div className="pb-2 text-[11px] text-stone-500 space-y-0.5 border-b border-dashed border-stone-300">
              <div className="flex justify-between">
                <span>No. Struk:</span>
                <span className="font-bold text-stone-700">{order.id}</span>
              </div>
              <div className="flex justify-between">
                <span>Waktu:</span>
                <span>{formatDateTime(order.createdAt)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode Bayar:</span>
                <span className="font-bold uppercase text-stone-800">{order.paymentMethod}</span>
              </div>
            </div>

            {/* Items List */}
            <div className="py-3 border-b border-dashed border-stone-300 space-y-2">
              <div className="flex justify-between text-[11px] font-bold text-stone-700 uppercase tracking-wider pb-1">
                <span>Menu Item</span>
                <span>Total</span>
              </div>

              {order.items.map((item, idx) => (
                <div key={idx} className="space-y-0.5">
                  <div className="flex justify-between items-start">
                    <span className="font-medium text-stone-900">
                      {item.name} <span className="text-stone-500 font-normal">x{item.quantity}</span>
                    </span>
                    <span className="tabular-nums font-semibold text-stone-900">
                      {formatRupiah(item.subtotal)}
                    </span>
                  </div>
                  {item.selectedOptions && item.selectedOptions.length > 0 && (
                    <div className="text-[10px] text-stone-500 pl-2">
                      + {item.selectedOptions.map((o) => `${o.label}`).join(', ')}
                    </div>
                  )}
                  {item.note && (
                    <div className="text-[10px] italic text-amber-700 pl-2">
                      Catatan: {item.note}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Calculation Totals */}
            <div className="py-2.5 border-b border-dashed border-stone-300 space-y-1.5 text-xs">
              <div className="flex justify-between">
                <span className="text-stone-600">Subtotal</span>
                <span className="tabular-nums font-medium">{formatRupiah(order.subtotal)}</span>
              </div>

              {order.discount > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Diskon</span>
                  <span className="tabular-nums">- {formatRupiah(order.discount)}</span>
                </div>
              )}

              <div className="flex justify-between text-sm font-bold text-stone-900 pt-1 border-t border-stone-200">
                <span>TOTAL BAYAR</span>
                <span className="tabular-nums">{formatRupiah(order.total)}</span>
              </div>

              {order.paymentMethod === 'tunai' && order.cashReceived !== undefined && (
                <>
                  <div className="flex justify-between text-[11px] text-stone-600 pt-1">
                    <span>Uang Diterima</span>
                    <span className="tabular-nums">{formatRupiah(order.cashReceived)}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold text-emerald-700">
                    <span>Kembalian</span>
                    <span className="tabular-nums">{formatRupiah(order.change || 0)}</span>
                  </div>
                </>
              )}

              {isGojek && (
                <div className="text-[10px] text-stone-500 pt-2 border-t border-dotted border-stone-200 text-center">
                  *Dibayar otomatis via GoPay Merchant / Gojek Sistem
                </div>
              )}
            </div>

            {/* Footer Greeting */}
            <div className="text-center pt-3 text-[11px] text-stone-500 space-y-1">
              <p className="font-semibold text-stone-800">Matur Nuwun / Terima Kasih!</p>
              <p>Selamat menikmati & jangan lupa ngopi lagi!</p>
              <p className="text-[10px] text-stone-400">Powered by Warkop POS System</p>
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 rounded-lg hover:bg-stone-100 transition-colors"
          >
            Selesai
          </button>
          
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-800 rounded-lg hover:bg-amber-900 shadow-sm transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak Struk (Thermal 58/80mm)</span>
          </button>
        </div>

      </div>
    </div>
  );
};
