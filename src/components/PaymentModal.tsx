import React, { useState } from 'react';
import { X, Banknote, QrCode, Smartphone, CreditCard, Check, ArrowRight, User, Hash } from 'lucide-react';
import { CartItem, ChannelType, PaymentMethod, WarkopSettings } from '../types';
import { formatRupiah } from '../utils/format';

interface PaymentModalProps {
  channel: ChannelType;
  items: CartItem[];
  subtotal: number;
  settings: WarkopSettings;
  onClose: () => void;
  onCompleteOrder: (orderData: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    discount: number;
    tableOrNote: string;
    customerName: string;
  }) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  channel,
  subtotal,
  settings,
  onClose,
  onCompleteOrder,
}) => {
  const isGojek = channel === 'gofood';
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(isGojek ? 'gopay' : 'tunai');
  const [discount, setDiscount] = useState<number>(0);
  const [tableOrNote, setTableOrNote] = useState<string>(isGojek ? 'Pesanan Gojek' : 'Meja 1');
  const [customerName, setCustomerName] = useState<string>('');
  
  const finalTotal = Math.max(0, subtotal - discount);
  const [cashReceived, setCashReceived] = useState<number>(finalTotal);

  const change = Math.max(0, cashReceived - finalTotal);
  const isCashInsufficient = paymentMethod === 'tunai' && cashReceived < finalTotal;

  // Quick cash amount suggestions based on bill total
  const getCashPresets = (total: number) => {
    const presets = [total];
    const roundedUp10k = Math.ceil(total / 10000) * 10000;
    const roundedUp20k = Math.ceil(total / 20000) * 20000;
    const roundedUp50k = Math.ceil(total / 50000) * 50000;
    const roundedUp100k = Math.ceil(total / 100000) * 10000;

    [roundedUp10k, roundedUp20k, roundedUp50k, roundedUp100k].forEach((val) => {
      if (val > total && !presets.includes(val)) {
        presets.push(val);
      }
    });

    if (!presets.includes(50000) && total < 50000) presets.push(50000);
    if (!presets.includes(100000) && total < 100000) presets.push(100000);

    return presets.slice(0, 4);
  };

  const cashPresets = getCashPresets(finalTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isCashInsufficient) return;

    onCompleteOrder({
      paymentMethod,
      cashReceived: paymentMethod === 'tunai' ? cashReceived : undefined,
      change: paymentMethod === 'tunai' ? change : undefined,
      discount,
      tableOrNote: tableOrNote.trim() || (isGojek ? 'Driver Gojek' : 'Bawa Pulang'),
      customerName: customerName.trim() || (isGojek ? 'Pelanggan GoFood' : 'Tamu Warkop'),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="font-bold text-stone-900 text-base">Pembayaran Kasir</h3>
            <p className="text-xs text-stone-500">
              Saluran: <span className="font-semibold text-stone-700">{isGojek ? 'Pesanan Gojek (GoFood)' : 'Penjualan Langsung Warkop'}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* Bill Summary Banner */}
          <div className="p-4 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs text-stone-500 block">Total Tagihan</span>
              <span className="text-2xl font-bold font-mono text-amber-950 tracking-tight">
                {formatRupiah(finalTotal)}
              </span>
            </div>
            {discount > 0 && (
              <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded font-medium">
                Diskon {formatRupiah(discount)}
              </span>
            )}
          </div>

          {/* Payment Method Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Metode Pembayaran
            </label>
            <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
              <button
                type="button"
                onClick={() => setPaymentMethod('tunai')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'tunai'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Banknote className="w-5 h-5" />
                <span>Tunai (Cash)</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('qris')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'qris'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <QrCode className="w-5 h-5" />
                <span>QRIS Instant</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('gopay')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'gopay'
                    ? 'border-emerald-600 bg-emerald-600 text-white shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <Smartphone className="w-5 h-5" />
                <span>GoPay / GoFood</span>
              </button>

              <button
                type="button"
                onClick={() => setPaymentMethod('transfer')}
                className={`flex flex-col items-center justify-center gap-1.5 p-3 rounded-xl border text-xs font-semibold transition-all ${
                  paymentMethod === 'transfer'
                    ? 'border-amber-800 bg-amber-800 text-white shadow-xs'
                    : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                }`}
              >
                <CreditCard className="w-5 h-5" />
                <span>Transfer Bank</span>
              </button>
            </div>
          </div>

          {/* Method-Specific Inputs */}
          {paymentMethod === 'tunai' && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 space-y-3">
              <div>
                <label className="text-xs font-semibold text-stone-700 mb-1.5 block">
                  Uang Tunai Diterima (Rp)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-stone-400 font-mono text-sm">
                    Rp
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 bg-white border border-stone-300 rounded-lg text-lg font-mono font-bold text-stone-900 focus:outline-none focus:ring-2 focus:ring-amber-800 focus:border-transparent"
                    placeholder="Masukkan jumlah uang"
                    required
                  />
                </div>
              </div>

              {/* Quick Cash Presets */}
              <div className="space-y-1">
                <span className="text-[11px] text-stone-500 font-medium">Uang Pas & Cepat:</span>
                <div className="flex flex-wrap gap-2">
                  {cashPresets.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setCashReceived(preset)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border transition-colors ${
                        cashReceived === preset
                          ? 'bg-amber-100 text-amber-900 border-amber-300'
                          : 'bg-white text-stone-700 border-stone-200 hover:bg-stone-100'
                      }`}
                    >
                      {preset === finalTotal ? 'Uang Pas' : formatRupiah(preset)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Kembalian Calculation */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between">
                <span className="text-xs font-semibold text-stone-600">Kembalian:</span>
                <span
                  className={`text-lg font-mono font-bold ${
                    isCashInsufficient ? 'text-red-600' : 'text-emerald-700'
                  }`}
                >
                  {isCashInsufficient
                    ? `Kurang ${formatRupiah(finalTotal - cashReceived)}`
                    : formatRupiah(change)}
                </span>
              </div>
            </div>
          )}

          {paymentMethod === 'qris' && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex flex-col items-center text-center space-y-3">
              <div className="bg-white p-3 rounded-lg border border-stone-300 shadow-xs inline-block">
                {/* Visual QR Code Generator Simulation */}
                <div className="w-36 h-36 bg-stone-900 p-2 rounded flex flex-col justify-between">
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-white bg-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                    <div className="w-8 h-8 border-4 border-white bg-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center">
                    <span className="text-[10px] text-white font-mono font-bold tracking-widest bg-stone-800 px-1 rounded">
                      QRIS
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <div className="w-8 h-8 border-4 border-white bg-stone-900 flex items-center justify-center">
                      <div className="w-3 h-3 bg-white"></div>
                    </div>
                    <div className="w-8 h-8 bg-white grid grid-cols-2 gap-1 p-0.5">
                      <div className="bg-stone-900"></div>
                      <div className="bg-white"></div>
                      <div className="bg-white"></div>
                      <div className="bg-stone-900"></div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-0.5">
                <p className="text-xs font-bold text-stone-900 uppercase">{settings.qrisMerchantName}</p>
                <p className="text-[11px] text-stone-500">NMID: ID102488392100 - Standar QRIS Nasional</p>
                <p className="text-xs font-semibold text-emerald-700">
                  Tagihan: {formatRupiah(finalTotal)}
                </p>
              </div>
            </div>
          )}

          {paymentMethod === 'gopay' && (
            <div className="p-4 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                  G
                </div>
                <div>
                  <h4 className="text-xs font-bold text-emerald-950">GoPay / GoFood Auto-Settlement</h4>
                  <p className="text-[11px] text-emerald-800">
                    {isGojek
                      ? 'Saldo akan otomatis ditransfer ke rekening GoBiz Merchant warkop.'
                      : 'Pelanggan scan barcode GoPay atau transfer via dompet GoPay.'}
                  </p>
                </div>
              </div>
              {isGojek && (
                <div className="p-2.5 bg-white/80 rounded-lg text-[11px] text-stone-600 space-y-1 border border-emerald-100">
                  <div className="flex justify-between">
                    <span>Estimasi Komisi Gojek ({settings.gofoodDefaultCommission * 100}%):</span>
                    <span className="font-mono text-red-600">
                      - {formatRupiah(finalTotal * settings.gofoodDefaultCommission)}
                    </span>
                  </div>
                  <div className="flex justify-between font-bold text-stone-900 border-t border-stone-200 pt-1">
                    <span>Bersih Diterima Warkop:</span>
                    <span className="font-mono text-emerald-700">
                      {formatRupiah(finalTotal * (1 - settings.gofoodDefaultCommission))}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {paymentMethod === 'transfer' && (
            <div className="p-4 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-2">
              <p className="font-semibold text-stone-800">Transfer Rekening Warkop:</p>
              <div className="p-2.5 bg-white rounded border border-stone-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-stone-500">Bank BCA:</span>
                  <span className="font-mono font-bold text-stone-900">841-092-1829</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-stone-500">Atas Nama:</span>
                  <span className="font-semibold text-stone-800">{settings.storeName}</span>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 italic">
                Pastikan bukti transfer sudah dicek sebelum konfirmasi.
              </p>
            </div>
          )}

          {/* Order Details: Customer Name, Table, Discount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5" />
                <span>Nama Pelanggan (Opsional)</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Contoh: Mas Agus"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-stone-600 mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" />
                <span>Meja / Keterangan</span>
              </label>
              <input
                type="text"
                value={tableOrNote}
                onChange={(e) => setTableOrNote(e.target.value)}
                placeholder="Contoh: Meja 3 / Bungkus"
                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-stone-600 mb-1 block">
              Potongan Diskon (Rp)
            </label>
            <input
              type="number"
              min="0"
              step="500"
              value={discount || ''}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              placeholder="0"
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-mono text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
            />
          </div>

          {/* Submit Action */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={isCashInsufficient}
              className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                isCashInsufficient
                  ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  : 'bg-amber-800 text-white hover:bg-amber-900 active:scale-[0.99] shadow-sm'
              }`}
            >
              <Check className="w-4 h-4" />
              <span>Selesaikan Transaksi ({formatRupiah(finalTotal)})</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
