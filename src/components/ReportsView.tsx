import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingBag, 
  Download, 
  Printer, 
  Calendar, 
  Filter, 
  Bike, 
  Coffee, 
  CreditCard, 
  PieChart, 
  Search,
  CheckCircle2,
  Receipt
} from 'lucide-react';
import { Order, WarkopSettings, Category, PaymentMethod } from '../types';
import { formatRupiah, formatDateTime, formatTimeOnly, exportOrdersToCSV, CATEGORY_LABELS } from '../utils/format';

interface ReportsViewProps {
  orders: Order[];
  settings: WarkopSettings;
  onPrintReceipt: (order: Order) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  orders,
  settings,
  onPrintReceipt,
}) => {
  const [dateRange, setDateRange] = useState<'today' | '7days' | '30days' | 'all'>('today');
  const [channelFilter, setChannelFilter] = useState<'all' | 'langsung' | 'gofood'>('all');
  const [paymentFilter, setPaymentFilter] = useState<PaymentMethod | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPrintRecapOpen, setIsPrintRecapOpen] = useState(false);

  // Filter orders by date range
  const filteredOrders = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = startOfToday - 7 * 86400000;
    const thirtyDaysAgo = startOfToday - 30 * 86400000;

    return orders.filter((o) => {
      const orderTime = new Date(o.createdAt).getTime();

      // Date check
      if (dateRange === 'today' && orderTime < startOfToday) return false;
      if (dateRange === '7days' && orderTime < sevenDaysAgo) return false;
      if (dateRange === '30days' && orderTime < thirtyDaysAgo) return false;

      // Channel check
      if (channelFilter !== 'all' && o.channel !== channelFilter) return false;

      // Payment check
      if (paymentFilter !== 'all' && o.paymentMethod !== paymentFilter) return false;

      // Search check
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchId = o.id.toLowerCase().includes(q);
        const matchCustomer = (o.customerName || '').toLowerCase().includes(q);
        const matchNote = (o.tableOrNote || '').toLowerCase().includes(q);
        const matchItems = o.items.some((i) => i.name.toLowerCase().includes(q));
        if (!matchId && !matchCustomer && !matchNote && !matchItems) return false;
      }

      return true;
    });
  }, [orders, dateRange, channelFilter, paymentFilter, searchQuery]);

  // Aggregate Metrics
  const totalOmzet = filteredOrders.reduce((sum, o) => sum + o.total, 0);
  const totalGojekCommission = filteredOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const totalNetRevenue = filteredOrders.reduce((sum, o) => sum + o.netRevenue, 0);
  const totalCostHPP = filteredOrders.reduce((sum, o) => sum + o.totalCost, 0);
  const totalProfit = filteredOrders.reduce((sum, o) => sum + o.grossProfit, 0);
  const totalOrdersCount = filteredOrders.length;
  const totalItemsSold = filteredOrders.reduce(
    (sum, o) => sum + o.items.reduce((iSum, item) => iSum + item.quantity, 0),
    0
  );

  const profitMarginPercent = totalNetRevenue > 0 ? Math.round((totalProfit / totalNetRevenue) * 100) : 0;

  // Breakdown Channel
  const langsungOrders = filteredOrders.filter((o) => o.channel === 'langsung');
  const gofoodOrders = filteredOrders.filter((o) => o.channel === 'gofood');

  const langsungOmzet = langsungOrders.reduce((sum, o) => sum + o.total, 0);
  const gofoodOmzet = gofoodOrders.reduce((sum, o) => sum + o.total, 0);

  // Breakdown Payment Methods
  const paymentBreakdown = useMemo(() => {
    const map: Record<PaymentMethod, { count: number; total: number }> = {
      tunai: { count: 0, total: 0 },
      qris: { count: 0, total: 0 },
      gopay: { count: 0, total: 0 },
      transfer: { count: 0, total: 0 },
    };

    filteredOrders.forEach((o) => {
      if (map[o.paymentMethod]) {
        map[o.paymentMethod].count += 1;
        map[o.paymentMethod].total += o.total;
      }
    });
    return map;
  }, [filteredOrders]);

  // Breakdown Category
  const categoryBreakdown = useMemo(() => {
    const map: Record<Category, { count: number; revenue: number }> = {
      kopi: { count: 0, revenue: 0 },
      mie: { count: 0, revenue: 0 },
      rokok: { count: 0, revenue: 0 },
      minuman: { count: 0, revenue: 0 },
      makanan: { count: 0, revenue: 0 },
    };

    filteredOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (map[item.category]) {
          map[item.category].count += item.quantity;
          map[item.category].revenue += item.subtotal;
        }
      });
    });
    return map;
  }, [filteredOrders]);

  const handleExportCSV = () => {
    exportOrdersToCSV(filteredOrders, settings.storeName);
  };

  const handlePrintDailyRecap = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      
      {/* Top Header & Filters */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-stone-900 tracking-tight">
              Laporan Keuangan & Rekap Penjualan
            </h2>
            <p className="text-xs text-stone-500 mt-0.5">
              Pantau omzet kotor, modal HPP, potongan komisi Gojek, dan keuntungan bersih warkop.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-stone-100 text-stone-700 hover:bg-stone-200 rounded-lg text-xs font-semibold transition-colors"
            >
              <Download className="w-4 h-4 text-stone-500" />
              <span>Ekspor CSV (Excel)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsPrintRecapOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 bg-amber-800 text-white hover:bg-amber-900 rounded-lg text-xs font-bold transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Rekap Harian</span>
            </button>
          </div>
        </div>

        {/* Date Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-stone-100">
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setDateRange('today')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                dateRange === 'today' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Hari Ini (Shift Ini)
            </button>
            <button
              type="button"
              onClick={() => setDateRange('7days')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                dateRange === '7days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => setDateRange('30days')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                dateRange === '30days' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setDateRange('all')}
              className={`px-3 py-1.5 rounded-md font-semibold transition-colors ${
                dateRange === 'all' ? 'bg-white text-stone-900 shadow-xs' : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua Waktu
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Channel Filter */}
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value as 'all' | 'langsung' | 'gofood')}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
            >
              <option value="all">Semua Saluran</option>
              <option value="langsung">Hanya Pesanan Langsung</option>
              <option value="gofood">Hanya Pesanan Gojek (GoFood)</option>
            </select>

            {/* Payment Method Filter */}
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value as PaymentMethod | 'all')}
              className="px-3 py-1.5 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700"
            >
              <option value="all">Semua Pembayaran</option>
              <option value="tunai">Tunai (Cash)</option>
              <option value="qris">QRIS</option>
              <option value="gopay">GoPay</option>
              <option value="transfer">Transfer Bank</option>
            </select>
          </div>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Omzet Penjualan */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Omzet Penjualan
            </span>
            <DollarSign className="w-4 h-4 text-amber-800" />
          </div>
          <span className="text-2xl font-bold font-mono text-stone-900 mt-2 block tabular-nums">
            {formatRupiah(totalOmzet)}
          </span>
          <div className="mt-2 pt-2 border-t border-stone-100 flex items-center justify-between text-[11px] text-stone-500">
            <span>Langsung: {formatRupiah(langsungOmzet)}</span>
            <span>Gojek: {formatRupiah(gofoodOmzet)}</span>
          </div>
        </div>

        {/* Modal HPP */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Total Modal (HPP)
            </span>
            <ShoppingBag className="w-4 h-4 text-stone-500" />
          </div>
          <span className="text-2xl font-bold font-mono text-stone-700 mt-2 block tabular-nums">
            {formatRupiah(totalCostHPP)}
          </span>
          <p className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            Biaya bahan baku kopi, mie, rokok, & es
          </p>
        </div>

        {/* Komisi Gojek dipotong */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs text-stone-500 font-semibold uppercase tracking-wider">
              Potongan Komisi Gojek
            </span>
            <Bike className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-red-600 mt-2 block tabular-nums">
            - {formatRupiah(totalGojekCommission)}
          </span>
          <p className="mt-2 pt-2 border-t border-stone-100 text-[11px] text-stone-500">
            {gofoodOrders.length} pesanan GoFood diproses
          </p>
        </div>

        {/* Keuntungan Bersih */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs bg-emerald-50/20">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-800 font-bold uppercase tracking-wider">
              Laba Bersih Warkop
            </span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <span className="text-2xl font-bold font-mono text-emerald-700 mt-2 block tabular-nums">
            {formatRupiah(totalProfit)}
          </span>
          <div className="mt-2 pt-2 border-t border-emerald-100/60 flex items-center justify-between text-[11px] font-semibold text-emerald-800">
            <span>Margin Bersih: ~{profitMarginPercent}%</span>
            <span>{totalOrdersCount} Transaksi</span>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid: Saluran vs Kategori */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Channel Comparison */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Perbandingan Saluran Penjualan</h3>

          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Coffee className="w-3.5 h-3.5 text-amber-800" />
                  <span>Pesanan Langsung (Warkop)</span>
                </span>
                <span className="font-mono font-bold text-stone-900">{formatRupiah(langsungOmzet)}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-800 rounded-full"
                  style={{ width: `${totalOmzet > 0 ? (langsungOmzet / totalOmzet) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>{langsungOrders.length} transaksi</span>
                <span>{totalOmzet > 0 ? Math.round((langsungOmzet / totalOmzet) * 100) : 0}% dari total</span>
              </div>
            </div>

            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="font-semibold text-stone-700 flex items-center gap-1.5">
                  <Bike className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Pesanan Gojek (GoFood)</span>
                </span>
                <span className="font-mono font-bold text-stone-900">{formatRupiah(gofoodOmzet)}</span>
              </div>
              <div className="w-full h-2.5 bg-stone-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-600 rounded-full"
                  style={{ width: `${totalOmzet > 0 ? (gofoodOmzet / totalOmzet) * 100 : 0}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[11px] text-stone-400 mt-1">
                <span>{gofoodOrders.length} transaksi online</span>
                <span>{totalOmzet > 0 ? Math.round((gofoodOmzet / totalOmzet) * 100) : 0}% dari total</span>
              </div>
            </div>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl text-xs space-y-1.5 border border-stone-200/60">
            <span className="font-bold text-stone-800 block">Pemberitahuan Rekap:</span>
            <p className="text-[11px] text-stone-500 leading-relaxed">
              Transaksi GoFood otomatis dipisahkan dari penerimaan tunai fisik kasir, sehingga pencocokan uang tunai di laci kasir tetap 100% akurat.
            </p>
          </div>
        </div>

        {/* Payment Methods Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Rincian Metode Pembayaran</h3>

          <div className="space-y-3">
            {[
              { id: 'tunai', label: 'Uang Tunai (Cash)', color: 'bg-amber-800' },
              { id: 'qris', label: 'QRIS Instant', color: 'bg-blue-600' },
              { id: 'gopay', label: 'GoPay / GoFood Auto', color: 'bg-emerald-600' },
              { id: 'transfer', label: 'Transfer Rekening', color: 'bg-purple-600' },
            ].map((method) => {
              const data = paymentBreakdown[method.id as PaymentMethod];
              const pct = totalOmzet > 0 ? Math.round((data.total / totalOmzet) * 100) : 0;

              return (
                <div key={method.id} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="font-medium text-stone-700">{method.label}</span>
                    <span className="font-mono font-bold text-stone-900">{formatRupiah(data.total)}</span>
                  </div>
                  <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div className={`h-full ${method.color}`} style={{ width: `${pct}%` }}></div>
                  </div>
                  <div className="flex justify-between text-[10px] text-stone-400">
                    <span>{data.count} transaksi</span>
                    <span>{pct}% share</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs space-y-4">
          <h3 className="font-bold text-stone-900 text-sm">Penjualan per Kategori Menu</h3>

          <div className="space-y-2.5">
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => {
              const data = categoryBreakdown[cat];
              const pct = totalOmzet > 0 ? Math.round((data.revenue / totalOmzet) * 100) : 0;

              return (
                <div key={cat} className="flex items-center justify-between text-xs p-2 rounded-lg bg-stone-50 border border-stone-100">
                  <div>
                    <span className="font-bold text-stone-900">{CATEGORY_LABELS[cat]}</span>
                    <span className="text-[11px] text-stone-500 block">{data.count} porsi/buah terjual</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-stone-900">{formatRupiah(data.revenue)}</span>
                    <span className="text-[10px] text-stone-400 block">{pct}% omzet</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

      {/* Detailed Transaction History Table */}
      <div className="bg-white rounded-2xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-stone-200 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-stone-50/70">
          <div className="flex items-center gap-2">
            <Receipt className="w-4 h-4 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">Daftar Riwayat Transaksi</h3>
            <span className="text-xs text-stone-500 font-mono">({filteredOrders.length} transaksi)</span>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari ID struk / nama..."
              className="w-full pl-9 pr-3 py-1.5 bg-white border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">No. Transaksi</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Saluran</th>
                <th className="py-3 px-4">Menu Dipesan</th>
                <th className="py-3 px-4">Bayar</th>
                <th className="py-3 px-4 text-right">Omzet</th>
                <th className="py-3 px-4 text-right">Komisi</th>
                <th className="py-3 px-4 text-right">Laba Bersih</th>
                <th className="py-3 px-4 text-center">Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-stone-400">
                    Tidak ada transaksi pada filter yang dipilih.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const isGojek = order.channel === 'gofood';
                  return (
                    <tr key={order.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-stone-900">
                        {order.id}
                        {order.customerName && (
                          <span className="block text-[11px] font-normal text-stone-500">
                            {order.customerName}
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-4 text-stone-500 whitespace-nowrap">
                        {formatDateTime(order.createdAt)}
                      </td>

                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-bold ${
                            isGojek
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-900'
                          }`}
                        >
                          {isGojek ? <Bike className="w-3 h-3" /> : <Coffee className="w-3 h-3" />}
                          {isGojek ? 'Gojek' : 'Langsung'}
                        </span>
                      </td>

                      <td className="py-3 px-4 max-w-xs">
                        <div className="line-clamp-2 text-stone-700">
                          {order.items.map((i) => `${i.name} (x${i.quantity})`).join(', ')}
                        </div>
                      </td>

                      <td className="py-3 px-4 uppercase font-bold text-stone-600">
                        {order.paymentMethod}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-stone-900 tabular-nums">
                        {formatRupiah(order.total)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-red-600">
                        {order.commissionAmount > 0 ? `- ${formatRupiah(order.commissionAmount)}` : '-'}
                      </td>

                      <td className="py-3 px-4 text-right font-mono font-bold text-emerald-700 tabular-nums">
                        {formatRupiah(order.grossProfit)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => onPrintReceipt(order)}
                          className="p-1.5 text-stone-400 hover:text-amber-800 hover:bg-stone-100 rounded transition-colors"
                          title="Cetak Ulang Struk"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Printable Shift Recap Modal */}
      {isPrintRecapOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-sm">Rekap Kasir & Tutup Shift</h3>
              <button
                onClick={() => setIsPrintRecapOpen(false)}
                className="text-stone-400 hover:text-stone-700 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex justify-center bg-stone-100/40">
              <div
                id="thermal-receipt-print-area"
                className="w-full max-w-[340px] bg-white p-6 shadow-sm border border-stone-200 font-mono text-xs leading-relaxed"
              >
                <div className="text-center pb-3 border-b border-dashed border-stone-300">
                  <h4 className="font-bold text-sm text-stone-900 uppercase">{settings.storeName}</h4>
                  <p className="text-[11px] text-stone-500">LAPORAN REKAP HARIAN KASIR</p>
                  <p className="text-[10px] text-stone-400 mt-1">Dicetak: {formatDateTime(new Date().toISOString())}</p>
                </div>

                <div className="py-3 border-b border-dashed border-stone-300 space-y-1.5 text-xs">
                  <div className="flex justify-between">
                    <span>Periode Laporan:</span>
                    <span className="font-bold capitalize">{dateRange === 'today' ? 'Hari Ini' : dateRange}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Transaksi:</span>
                    <span className="font-bold">{totalOrdersCount} Transaksi</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total Porsi Terjual:</span>
                    <span className="font-bold">{totalItemsSold} Item</span>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="py-3 border-b border-dashed border-stone-300 space-y-1.5 text-xs">
                  <div className="flex justify-between font-bold text-stone-900">
                    <span>TOTAL OMZET KOTOR</span>
                    <span className="tabular-nums">{formatRupiah(totalOmzet)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 pl-2">
                    <span>- Kasir Langsung</span>
                    <span className="tabular-nums">{formatRupiah(langsungOmzet)}</span>
                  </div>
                  <div className="flex justify-between text-stone-600 pl-2">
                    <span>- Online Gojek</span>
                    <span className="tabular-nums">{formatRupiah(gofoodOmzet)}</span>
                  </div>

                  <div className="flex justify-between text-red-600 pt-1">
                    <span>Potongan Gojek:</span>
                    <span className="tabular-nums">- {formatRupiah(totalGojekCommission)}</span>
                  </div>
                  <div className="flex justify-between text-stone-700">
                    <span>Modal Bahan (HPP):</span>
                    <span className="tabular-nums">- {formatRupiah(totalCostHPP)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-emerald-800 pt-2 border-t border-stone-200 text-sm">
                    <span>LABA BERSIH:</span>
                    <span className="tabular-nums">{formatRupiah(totalProfit)}</span>
                  </div>
                </div>

                {/* Cash in Drawer Verification */}
                <div className="py-3 border-b border-dashed border-stone-300 space-y-1 text-xs">
                  <span className="font-bold text-stone-800 block">Pencocokan Uang Kasir (Cash):</span>
                  <div className="flex justify-between text-stone-700 font-bold">
                    <span>Uang Tunai di Laci:</span>
                    <span className="tabular-nums">{formatRupiah(paymentBreakdown.tunai.total)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>Penerimaan QRIS:</span>
                    <span className="tabular-nums">{formatRupiah(paymentBreakdown.qris.total)}</span>
                  </div>
                  <div className="flex justify-between text-stone-500">
                    <span>GoPay / GoFood Auto:</span>
                    <span className="tabular-nums">{formatRupiah(paymentBreakdown.gopay.total)}</span>
                  </div>
                </div>

                <div className="pt-4 text-center text-[10px] text-stone-400">
                  Tanda Tangan Kasir / Penanggung Jawab Shift
                  <div className="h-10"></div>
                  ( ......................................... )
                </div>
              </div>
            </div>

            <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsPrintRecapOpen(false)}
                className="px-4 py-2 border border-stone-300 rounded-lg text-xs font-semibold text-stone-700 hover:bg-stone-100"
              >
                Tutup
              </button>
              <button
                type="button"
                onClick={handlePrintDailyRecap}
                className="flex items-center gap-2 px-5 py-2 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 shadow-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Lembar Rekap</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
