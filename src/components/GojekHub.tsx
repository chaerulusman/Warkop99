import React, { useState } from 'react';
import { 
  Bike, 
  Clock, 
  CheckCircle, 
  ChefHat, 
  PackageCheck, 
  Volume2, 
  Settings, 
  AlertTriangle, 
  Plus, 
  ExternalLink,
  Printer,
  Phone,
  KeyRound
} from 'lucide-react';
import { Order, Product, WarkopSettings, GoFoodStatus } from '../types';
import { formatRupiah, formatDateTime, formatTimeOnly } from '../utils/format';
import { soundManager } from '../utils/audio';

interface GojekHubProps {
  orders: Order[];
  products: Product[];
  settings: WarkopSettings;
  onUpdateSettings: (settings: WarkopSettings) => void;
  onUpdateOrderStatus: (orderId: string, status: GoFoodStatus) => void;
  onSimulateOrder: () => void;
  onPrintReceipt: (order: Order) => void;
}

export const GojekHub: React.FC<GojekHubProps> = ({
  orders,
  products,
  settings,
  onUpdateSettings,
  onUpdateOrderStatus,
  onSimulateOrder,
  onPrintReceipt,
}) => {
  const [activeTab, setActiveTab] = useState<'queue' | 'settings'>('queue');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('active');

  // Filter Gojek orders only
  const gojekOrders = orders.filter((o) => o.channel === 'gofood');

  // Orders that are currently active in kitchen/delivery
  const activeQueue = gojekOrders.filter(
    (o) => o.gofoodDetails && ['incoming', 'preparing', 'ready'].includes(o.gofoodDetails.gofoodStatus)
  );

  const completedOrders = gojekOrders.filter(
    (o) => o.gofoodDetails && ['completed', 'picked_up'].includes(o.gofoodDetails.gofoodStatus)
  );

  const displayedOrders = statusFilter === 'all' 
    ? gojekOrders 
    : statusFilter === 'active' 
    ? activeQueue 
    : completedOrders;

  // Stats calculation
  const totalGojekRevenue = gojekOrders.reduce((sum, o) => sum + o.total, 0);
  const totalGojekNet = gojekOrders.reduce((sum, o) => sum + o.netRevenue, 0);
  const totalGojekCommission = gojekOrders.reduce((sum, o) => sum + o.commissionAmount, 0);
  const totalGojekProfit = gojekOrders.reduce((sum, o) => sum + o.grossProfit, 0);

  const handleStatusAdvance = (order: Order) => {
    if (!order.gofoodDetails) return;
    const current = order.gofoodDetails.gofoodStatus;
    if (current === 'incoming') {
      soundManager.playClick();
      onUpdateOrderStatus(order.id, 'preparing');
    } else if (current === 'preparing') {
      soundManager.playClick();
      onUpdateOrderStatus(order.id, 'ready');
    } else if (current === 'ready') {
      soundManager.playCashRegister();
      onUpdateOrderStatus(order.id, 'completed');
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Gojek Merchant Integration Status */}
      <div className="bg-gradient-to-r from-emerald-900 to-teal-900 rounded-2xl text-white p-6 shadow-md border border-emerald-800">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center border border-white/20 text-white shrink-0">
              <Bike className="w-8 h-8 text-emerald-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight">GoFood Merchant Hub</h2>
                <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wider ${
                  settings.gofoodStoreOpen 
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {settings.gofoodStoreOpen ? 'Toko Buka di Gojek' : 'Toko Tutup'}
                </span>
              </div>
              <p className="text-xs text-emerald-200/80 mt-1">
                Kelola pesanan masuk Gojek, driver pickup, estimasi masak, dan rincian komisi GoBiz otomatis.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={onSimulateOrder}
              className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 text-stone-950 font-bold text-xs rounded-xl hover:bg-emerald-400 active:scale-95 shadow-sm transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Simulasi Order Baru Masuk</span>
            </button>

            <button
              type="button"
              onClick={() => onUpdateSettings({ ...settings, gofoodStoreOpen: !settings.gofoodStoreOpen })}
              className={`px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all ${
                settings.gofoodStoreOpen
                  ? 'bg-emerald-950/60 text-emerald-200 border-emerald-700 hover:bg-emerald-950'
                  : 'bg-emerald-500 text-stone-950 border-emerald-400 font-bold'
              }`}
            >
              {settings.gofoodStoreOpen ? 'Tutup Toko GoFood' : 'Buka Toko GoFood'}
            </button>
          </div>

        </div>

        {/* Live Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-emerald-800/60">
          <div>
            <span className="text-[11px] text-emerald-300/80 block">Antrean Aktif</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {activeQueue.length} Pesanan
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-300/80 block">Total Omzet Gojek</span>
            <span className="text-xl font-bold font-mono text-white tabular-nums">
              {formatRupiah(totalGojekRevenue)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-300/80 block">Komisi Gojek ({settings.gofoodDefaultCommission * 100}%)</span>
            <span className="text-xl font-bold font-mono text-emerald-300 tabular-nums">
              - {formatRupiah(totalGojekCommission)}
            </span>
          </div>
          <div>
            <span className="text-[11px] text-emerald-300/80 block">Laba Bersih Warkop</span>
            <span className="text-xl font-bold font-mono text-emerald-400 tabular-nums">
              {formatRupiah(totalGojekProfit)}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs: Antrean Pesanan vs Pengaturan Gojek */}
      <div className="flex items-center justify-between border-b border-stone-200 pb-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('queue')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'queue'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            Antrean Dapur & Driver ({activeQueue.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition-colors ${
              activeTab === 'settings'
                ? 'bg-stone-900 text-white'
                : 'text-stone-600 hover:bg-stone-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            <span>Pengaturan GoFood</span>
          </button>
        </div>

        {activeTab === 'queue' && (
          <div className="flex items-center gap-1 p-1 bg-stone-100 rounded-lg border border-stone-200 text-xs">
            <button
              type="button"
              onClick={() => setStatusFilter('active')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'active'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Aktif ({activeQueue.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'completed'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Selesai ({completedOrders.length})
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                statusFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Semua ({gojekOrders.length})
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      {activeTab === 'queue' ? (
        displayedOrders.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center flex flex-col items-center justify-center">
            <Bike className="w-12 h-12 text-stone-300 mb-3" />
            <h4 className="font-bold text-stone-800 text-sm">Tidak ada pesanan Gojek dalam daftar ini</h4>
            <p className="text-xs text-stone-500 mt-1 max-w-sm">
              Pesanan online dari aplikasi pelanggan Gojek akan muncul di sini secara otomatis.
            </p>
            <button
              type="button"
              onClick={onSimulateOrder}
              className="mt-4 flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Simulasikan Pesanan Masuk Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedOrders.map((order) => {
              const details = order.gofoodDetails;
              const status = details?.gofoodStatus || 'completed';

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-2xl border border-stone-200 shadow-xs p-5 flex flex-col justify-between hover:border-emerald-500/50 transition-all space-y-4"
                >
                  {/* Top Bar: Order ID, Time & Status */}
                  <div className="flex items-start justify-between gap-3 border-b border-stone-100 pb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-stone-900">
                          {details?.orderId || order.id}
                        </span>
                        <span className="text-xs text-stone-400">·</span>
                        <span className="text-xs text-stone-500">{formatTimeOnly(order.createdAt)}</span>
                      </div>
                      <p className="text-xs font-semibold text-stone-700 mt-0.5">
                        Pemesan: <span className="text-emerald-800">{details?.customerName || order.customerName}</span>
                      </p>
                    </div>

                    {/* Status Badge */}
                    <div>
                      {status === 'incoming' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 animate-pulse flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>Pesanan Baru</span>
                        </span>
                      )}
                      {status === 'preparing' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-blue-100 text-blue-900 border border-blue-300 flex items-center gap-1">
                          <ChefHat className="w-3 h-3" />
                          <span>Sedang Dimasak</span>
                        </span>
                      )}
                      {status === 'ready' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" />
                          <span>Siap Diambil Driver</span>
                        </span>
                      )}
                      {status === 'completed' && (
                        <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-stone-100 text-stone-700 border border-stone-200 flex items-center gap-1">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>Selesai / Terkirim</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Driver Information Bar */}
                  {details && (
                    <div className="bg-stone-50 rounded-xl p-3 border border-stone-200/80 text-xs flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <Bike className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <p className="font-semibold text-stone-800">{details.driverName}</p>
                          <p className="text-[11px] text-stone-500">Estimasi Ambil: {details.estimatedPickupTime}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 px-2 py-1 bg-white rounded border border-stone-200 text-stone-700 text-[11px]">
                          <KeyRound className="w-3 h-3 text-amber-700" />
                          <span>PIN: <strong className="font-mono text-stone-900">{details.deliveryPin}</strong></span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ordered Items List */}
                  <div className="space-y-1.5 py-1">
                    <p className="text-[11px] font-bold text-stone-400 uppercase tracking-wider">
                      Daftar Pesanan Dapur:
                    </p>
                    <div className="space-y-1.5 bg-stone-50/50 p-2.5 rounded-lg border border-stone-100">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="text-xs">
                          <div className="flex justify-between items-baseline font-medium text-stone-900">
                            <span>
                              <strong className="text-amber-800">{item.quantity}x</strong> {item.name}
                            </span>
                            <span className="font-mono text-stone-600 tabular-nums">
                              {formatRupiah(item.subtotal)}
                            </span>
                          </div>
                          {item.selectedOptions && item.selectedOptions.length > 0 && (
                            <p className="text-[11px] text-stone-500 pl-4">
                              + {item.selectedOptions.map((o) => o.label).join(', ')}
                            </p>
                          )}
                          {item.note && (
                            <p className="text-[11px] italic text-amber-800 pl-4">
                              Catatan: {item.note}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Financial Breakdown (GoFood Commission & Profit) */}
                  <div className="pt-2 border-t border-stone-100 text-xs space-y-1">
                    <div className="flex justify-between text-stone-600">
                      <span>Total Tagihan GoFood:</span>
                      <span className="font-mono font-bold text-stone-900 tabular-nums">
                        {formatRupiah(order.total)}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-stone-500">
                      <span>Potongan Komisi Gojek ({details?.commissionRate ? details.commissionRate * 100 : 20}%):</span>
                      <span className="font-mono text-red-600 tabular-nums">
                        - {formatRupiah(order.commissionAmount)}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs font-semibold text-emerald-800 pt-0.5">
                      <span>Bersih Warkop (setelah HPP modal):</span>
                      <span className="font-mono tabular-nums">
                        {formatRupiah(order.grossProfit)} laba
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-stone-100">
                    <button
                      type="button"
                      onClick={() => onPrintReceipt(order)}
                      className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-stone-600 bg-stone-100 rounded-lg hover:bg-stone-200 transition-colors"
                      title="Cetak Struk untuk Driver/Kantong"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Struk</span>
                    </button>

                    {status === 'incoming' && (
                      <button
                        type="button"
                        onClick={() => handleStatusAdvance(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 transition-colors"
                      >
                        <ChefHat className="w-4 h-4" />
                        <span>Terima & Mulai Masak</span>
                      </button>
                    )}

                    {status === 'preparing' && (
                      <button
                        type="button"
                        onClick={() => handleStatusAdvance(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors"
                      >
                        <PackageCheck className="w-4 h-4" />
                        <span>Makanan Siap Diambil</span>
                      </button>
                    )}

                    {status === 'ready' && (
                      <button
                        type="button"
                        onClick={() => handleStatusAdvance(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Serahkan ke Driver & Selesai</span>
                      </button>
                    )}

                    {status === 'completed' && (
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1">
                        <CheckCircle className="w-4 h-4 inline" /> Selesai Diambil
                      </span>
                    )}
                  </div>

                </div>
              );
            })}
          </div>
        )
      ) : (
        /* Settings Tab */
        <div className="bg-white rounded-2xl border border-stone-200 p-6 space-y-6 max-w-2xl">
          <h3 className="font-bold text-stone-900 text-base">Konfigurasi Merchant GoFood</h3>

          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Persentase Potongan Komisi Gojek / GoBiz (%)
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min="0"
                  max="50"
                  step="1"
                  value={settings.gofoodDefaultCommission * 100}
                  onChange={(e) =>
                    onUpdateSettings({
                      ...settings,
                      gofoodDefaultCommission: Number(e.target.value) / 100,
                    })
                  }
                  className="w-32 px-3 py-2 border border-stone-300 rounded-lg text-sm font-mono font-bold"
                />
                <span className="text-xs text-stone-500">
                  Standar GoFood adalah 20% komisi per pesanan online.
                </span>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Status Operasional Toko di GoFood
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, gofoodStoreOpen: true })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    settings.gofoodStoreOpen
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  🟢 Toko Aktif (Buka)
                </button>
                <button
                  type="button"
                  onClick={() => onUpdateSettings({ ...settings, gofoodStoreOpen: false })}
                  className={`px-4 py-2 rounded-lg text-xs font-bold border transition-colors ${
                    !settings.gofoodStoreOpen
                      ? 'bg-red-600 text-white border-red-600'
                      : 'bg-stone-50 text-stone-600 border-stone-200'
                  }`}
                >
                  🔴 Toko Tutup Sementara
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-stone-200">
              <label className="text-xs font-bold text-stone-700 block mb-1">
                Suara Notifikasi Pesanan Masuk
              </label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => soundManager.playGojekAlert()}
                  className="flex items-center gap-1.5 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-semibold hover:bg-stone-200"
                >
                  <Volume2 className="w-4 h-4" />
                  <span>Tes Nada Dering Gojek</span>
                </button>
                <label className="flex items-center gap-2 text-xs text-stone-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.soundEnabled}
                    onChange={(e) => onUpdateSettings({ ...settings, soundEnabled: e.target.checked })}
                    className="rounded text-amber-800"
                  />
                  <span>Aktifkan Audio Notifikasi</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
