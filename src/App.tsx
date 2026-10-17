import React, { useState, useEffect } from 'react';
import { 
  Coffee, 
  Bike, 
  Package, 
  BarChart3, 
  Plus, 
  Volume2, 
  VolumeX, 
  AlertCircle,
  Bell,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Product, CartItem, Order, WarkopSettings, ChannelType, PaymentMethod, GoFoodStatus } from './types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS } from './data/defaultData';
import { PosView } from './components/PosView';
import { GojekHub } from './components/GojekHub';
import { InventoryManager } from './components/InventoryManager';
import { ReportsView } from './components/ReportsView';
import { PaymentModal } from './components/PaymentModal';
import { ReceiptModal } from './components/ReceiptModal';
import { soundManager } from './utils/audio';
import { formatRupiah } from './utils/format';
import { FirestoreSyncService } from './services/firestoreSync';

const STORAGE_KEYS = {
  PRODUCTS: 'warkop_pos_products_v1',
  ORDERS: 'warkop_pos_orders_v1',
  SETTINGS: 'warkop_pos_settings_v1',
};

export default function App() {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'pos' | 'gojek' | 'inventory' | 'reports'>('pos');
  const [isCloudSynced, setIsCloudSynced] = useState(false);

  // Persistence: Products, Orders, Settings
  const [products, setProducts] = useState<Product[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
      return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
    } catch {
      return INITIAL_PRODUCTS;
    }
  });

  const [orders, setOrders] = useState<Order[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
      return saved ? JSON.parse(saved) : INITIAL_ORDERS;
    } catch {
      return INITIAL_ORDERS;
    }
  });

  const [settings, setSettings] = useState<WarkopSettings>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
    } catch {
      return INITIAL_SETTINGS;
    }
  });

  // Initialize Firestore listeners
  useEffect(() => {
    let unsubProducts = () => {};
    let unsubOrders = () => {};
    let unsubSettings = () => {};

    const setupFirestore = async () => {
      try {
        await FirestoreSyncService.initConnection();
        await FirestoreSyncService.seedInitialDataIfEmpty();
        setIsCloudSynced(true);

        unsubProducts = FirestoreSyncService.subscribeProducts((prods) => {
          if (prods.length > 0) {
            setProducts(prods);
          }
        });

        unsubOrders = FirestoreSyncService.subscribeOrders((ords) => {
          if (ords.length > 0) {
            setOrders(ords);
          }
        });

        unsubSettings = FirestoreSyncService.subscribeSettings((sett) => {
          setSettings(sett);
        });
      } catch (e) {
        console.warn('Firestore initialization notice:', e);
      }
    };

    setupFirestore();

    return () => {
      unsubProducts();
      unsubOrders();
      unsubSettings();
    };
  }, []);

  // Active channel in POS ('langsung' | 'gofood')
  const [currentChannel, setCurrentChannel] = useState<ChannelType>('langsung');

  // Active cart in POS
  const [cart, setCart] = useState<CartItem[]>([]);

  // Modals
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [activeReceiptOrder, setActiveReceiptOrder] = useState<Order | null>(null);

  // Quick toast banner for incoming Gojek orders
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  }, [orders]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    soundManager.setEnabled(settings.soundEnabled);
  }, [settings]);

  // Count active Gojek orders
  const activeGojekCount = orders.filter(
    (o) => o.channel === 'gofood' && o.gofoodDetails && ['incoming', 'preparing', 'ready'].includes(o.gofoodDetails.gofoodStatus)
  ).length;

  // Handle successful POS order checkout
  const handleCompleteOrder = (orderData: {
    paymentMethod: PaymentMethod;
    cashReceived?: number;
    change?: number;
    discount: number;
    tableOrNote: string;
    customerName: string;
  }) => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const finalTotal = Math.max(0, subtotal - orderData.discount);
    const isGojek = currentChannel === 'gofood';
    const commissionAmount = isGojek ? Math.round(finalTotal * settings.gofoodDefaultCommission) : 0;
    const netRevenue = finalTotal - commissionAmount;

    // Total cost (HPP)
    const totalCost = cart.reduce((sum, item) => sum + item.costPrice * item.quantity, 0);
    const grossProfit = netRevenue - totalCost;

    const orderId = isGojek
      ? `GF-${Math.floor(1000 + Math.random() * 9000)}`
      : `WK-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;

    const newOrder: Order = {
      id: orderId,
      channel: currentChannel,
      items: [...cart],
      subtotal,
      discount: orderData.discount,
      commissionAmount,
      total: finalTotal,
      netRevenue,
      totalCost,
      grossProfit,
      paymentMethod: orderData.paymentMethod,
      cashReceived: orderData.cashReceived,
      change: orderData.change,
      tableOrNote: orderData.tableOrNote,
      customerName: orderData.customerName,
      status: 'completed',
      createdAt: new Date().toISOString(),
      ...(isGojek && {
        gofoodDetails: {
          orderId,
          driverName: 'Pak Supri (Honda Vario B 5928 TUK)',
          driverPhone: '0812-9900-3344',
          customerName: orderData.customerName || 'Pelanggan GoFood',
          deliveryPin: String(Math.floor(1000 + Math.random() * 9000)),
          commissionRate: settings.gofoodDefaultCommission,
          gofoodStatus: 'preparing',
          estimatedPickupTime: '10 Menit',
          createdAt: new Date().toISOString(),
        },
      }),
    };

    // 1. Decrement inventory stock automatically
    const updatedProducts = products.map((prod) => {
      const cartMatches = cart.filter((item) => item.productId === prod.id);
      if (cartMatches.length > 0) {
        const totalDeducted = cartMatches.reduce((sum, i) => sum + i.quantity, 0);
        const newStock = Math.max(0, prod.stock - totalDeducted);
        return {
          ...prod,
          stock: newStock,
          isAvailable: newStock > 0,
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setOrders([newOrder, ...orders]);
    setCart([]);
    setIsPaymentOpen(false);

    // Save to Firestore Database
    FirestoreSyncService.saveOrder(newOrder);
    FirestoreSyncService.syncAllProducts(updatedProducts);

    // Audio register chime
    soundManager.playCashRegister();

    // Show thermal receipt preview modal
    setActiveReceiptOrder(newOrder);
  };

  // Simulate incoming Gojek / GoFood order
  const handleSimulateGojekOrder = () => {
    soundManager.playGojekAlert();

    const sampleDishes = [
      { prodId: 'prod-mie-4', qty: 2, note: 'Pedas cabe rawit 5' },
      { prodId: 'prod-kopi-3', qty: 2, note: 'Es batu sedikit' },
      { prodId: 'prod-makan-2', qty: 1, note: 'Keju banyakin bang' },
    ];

    const customerNames = ['Rian Pratama', 'Siti Rahmawati', 'Dimas Anggara', 'Jessica Natalia', 'Bayu Setiawan'];
    const driverNames = [
      'Pak Agus (Honda Beat B 3491 TPK)',
      'Pak Bambang (Yamaha Aerox B 6721 UQ)',
      'Pak Dedi (Honda Scoopy B 4099 PL)',
      'Pak Joko (Vario 160 B 5512 SM)',
    ];

    const selectedCust = customerNames[Math.floor(Math.random() * customerNames.length)];
    const selectedDriver = driverNames[Math.floor(Math.random() * driverNames.length)];
    const randPin = String(Math.floor(1000 + Math.random() * 9000));
    const gofoodOrderId = `GF-${Math.floor(1000 + Math.random() * 9000)}`;

    const orderItems: CartItem[] = [];
    let subtotal = 0;
    let totalCost = 0;

    sampleDishes.forEach((itemPlan) => {
      const prod = products.find((p) => p.id === itemPlan.prodId) || products[0];
      const itemSubtotal = prod.gofoodPrice * itemPlan.qty;
      subtotal += itemSubtotal;
      totalCost += prod.costPrice * itemPlan.qty;

      orderItems.push({
        cartItemId: `${prod.id}-${Date.now()}-${Math.random()}`,
        productId: prod.id,
        name: prod.name,
        category: prod.category,
        unitPrice: prod.gofoodPrice,
        costPrice: prod.costPrice,
        quantity: itemPlan.qty,
        unit: prod.unit,
        selectedOptions: [],
        note: itemPlan.note,
        subtotal: itemSubtotal,
      });
    });

    const commission = Math.round(subtotal * settings.gofoodDefaultCommission);
    const net = subtotal - commission;
    const profit = net - totalCost;

    const newGojekOrder: Order = {
      id: gofoodOrderId,
      channel: 'gofood',
      items: orderItems,
      subtotal,
      discount: 0,
      commissionAmount: commission,
      total: subtotal,
      netRevenue: net,
      totalCost,
      grossProfit: profit,
      paymentMethod: 'gopay',
      customerName: selectedCust,
      tableOrNote: `GoFood Online #${gofoodOrderId}`,
      status: 'completed',
      createdAt: new Date().toISOString(),
      gofoodDetails: {
        orderId: gofoodOrderId,
        driverName: selectedDriver,
        driverPhone: '0812-8899-7711',
        customerName: selectedCust,
        deliveryPin: randPin,
        commissionRate: settings.gofoodDefaultCommission,
        gofoodStatus: 'incoming',
        estimatedPickupTime: '12 Menit',
        createdAt: new Date().toISOString(),
      },
    };

    // Decrement stock for incoming GoFood order
    const updatedProducts = products.map((prod) => {
      const match = orderItems.find((i) => i.productId === prod.id);
      if (match) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - match.quantity),
        };
      }
      return prod;
    });

    setProducts(updatedProducts);
    setOrders([newGojekOrder, ...orders]);

    // Save to Firestore
    FirestoreSyncService.saveOrder(newGojekOrder);
    FirestoreSyncService.syncAllProducts(updatedProducts);

    setToastMessage(`Pesanan Gojek Baru Masuk! ${gofoodOrderId} (${selectedCust})`);
    setTimeout(() => {
      setToastMessage(null);
    }, 6000);
  };

  // Update GoFood Status (incoming -> preparing -> ready -> completed)
  const handleUpdateOrderStatus = (orderId: string, nextStatus: GoFoodStatus) => {
    setOrders((prev) =>
      prev.map((o) => {
        if (o.id === orderId && o.gofoodDetails) {
          const updated = {
            ...o,
            gofoodDetails: {
              ...o.gofoodDetails,
              gofoodStatus: nextStatus,
            },
          };
          FirestoreSyncService.updateOrderStatus(orderId, updated);
          return updated;
        }
        return o;
      })
    );
  };

  const handleUpdateProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds);
    FirestoreSyncService.syncAllProducts(updatedProds);
  };

  const handleUpdateSettings = (updatedSett: WarkopSettings) => {
    setSettings(updatedSett);
    FirestoreSyncService.saveSettings(updatedSett);
  };

  return (
    <div className="min-h-screen bg-stone-100/70 text-stone-800 flex flex-col font-sans">
      
      {/* Top Bar Contract (1 line Brand wordmark — 4 nav links — 1 primary action) */}
      <header className="sticky top-0 z-40 bg-white border-b border-stone-200/90 shadow-2xs no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-2.5 shrink-0 whitespace-nowrap">
            <div className="w-9 h-9 rounded-xl bg-amber-900 text-amber-100 flex items-center justify-center font-bold shadow-xs">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <span className="font-extrabold text-base tracking-tight text-stone-900">
                Warkop Nusantara
              </span>
              <span className="hidden sm:inline text-xs text-stone-500 font-medium ml-2">
                · Kasir & Gojek Hub
              </span>
            </div>
          </div>

          {/* Zone 2: 4 Single-line Nav Links / Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'pos'
                  ? 'bg-amber-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Coffee className="w-3.5 h-3.5" />
              <span>Kasir POS</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('gojek')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors relative ${
                activeTab === 'gojek'
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Bike className="w-3.5 h-3.5" />
              <span>Pesanan Gojek</span>
              {activeGojekCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono font-bold bg-emerald-500 text-stone-950 animate-pulse">
                  {activeGojekCount}
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('inventory')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'inventory'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Package className="w-3.5 h-3.5" />
              <span>Stok Barang</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reports')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap shrink-0 transition-colors ${
                activeTab === 'reports'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Laporan & Rekap</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleSimulateGojekOrder}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300 hover:bg-emerald-100 transition-colors whitespace-nowrap shrink-0 shadow-2xs"
              title="Memicu notifikasi pesanan Gojek masuk untuk uji coba sistem"
            >
              <Bike className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden md:inline">+ Order Gojek Masuk</span>
              <span className="md:hidden">+ Gojek</span>
            </button>
          </div>

        </div>
      </header>

      {/* Floating Incoming Gojek Notification Toast */}
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 animate-bounce bg-emerald-800 text-white px-5 py-3.5 rounded-2xl shadow-xl border border-emerald-600 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500 text-stone-950 flex items-center justify-center font-bold">
            <Bike className="w-4 h-4" />
          </div>
          <div>
            <h5 className="font-bold text-xs">Pesanan Gojek Baru Masuk!</h5>
            <p className="text-[11px] text-emerald-100">{toastMessage}</p>
          </div>
          <button
            onClick={() => {
              setActiveTab('gojek');
              setToastMessage(null);
            }}
            className="ml-2 px-3 py-1 bg-white text-emerald-900 text-xs font-bold rounded-lg hover:bg-emerald-50"
          >
            Lihat Antrean
          </button>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 no-print">
        
        {/* Subtle Warkop Shift Info strip */}
        <div className="mb-4 flex flex-wrap items-center justify-between text-xs text-stone-500 gap-2 px-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800">{settings.storeName}</span>
            <span aria-hidden="true">·</span>
            <span>Kasir Shift Aktif</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${isCloudSynced ? 'bg-emerald-500' : 'bg-stone-400'}`}></span>
              <span>Cloud DB: {isCloudSynced ? 'Online (Firestore)' : 'Offline (Lokal)'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <span className="flex items-center gap-1">
              <span className={`w-2 h-2 rounded-full ${settings.gofoodStoreOpen ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              <span>GoFood: {settings.gofoodStoreOpen ? 'Buka (Aktif)' : 'Tutup'}</span>
            </span>
            <span aria-hidden="true">·</span>
            <button
              type="button"
              onClick={() => handleUpdateSettings({ ...settings, soundEnabled: !settings.soundEnabled })}
              className="hover:text-stone-800 flex items-center gap-1"
            >
              {settings.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-stone-600" /> : <VolumeX className="w-3.5 h-3.5 text-stone-400" />}
              <span>{settings.soundEnabled ? 'Suara Aktif' : 'Suara Mute'}</span>
            </button>
          </div>
        </div>

        {/* Tab View Switcher */}
        {activeTab === 'pos' && (
          <PosView
            products={products}
            channel={currentChannel}
            onChannelChange={setCurrentChannel}
            cart={cart}
            onUpdateCart={setCart}
            onOpenPayment={() => setIsPaymentOpen(true)}
            settings={settings}
            onSimulateGojekOrder={handleSimulateGojekOrder}
          />
        )}

        {activeTab === 'gojek' && (
          <GojekHub
            orders={orders}
            products={products}
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onUpdateOrderStatus={handleUpdateOrderStatus}
            onSimulateOrder={handleSimulateGojekOrder}
            onPrintReceipt={(o) => setActiveReceiptOrder(o)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            onUpdateProducts={handleUpdateProducts}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            orders={orders}
            settings={settings}
            onPrintReceipt={(o) => setActiveReceiptOrder(o)}
          />
        )}

      </main>

      {/* Payment Processing Modal */}
      {isPaymentOpen && (
        <PaymentModal
          channel={currentChannel}
          items={cart}
          subtotal={cart.reduce((sum, item) => sum + item.subtotal, 0)}
          settings={settings}
          onClose={() => setIsPaymentOpen(false)}
          onCompleteOrder={handleCompleteOrder}
        />
      )}

      {/* Thermal Receipt Preview & Print Modal */}
      {activeReceiptOrder && (
        <ReceiptModal
          order={activeReceiptOrder}
          settings={settings}
          onClose={() => setActiveReceiptOrder(null)}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200/80 py-4 px-6 text-center text-xs text-stone-500 no-print mt-auto">
        <p>
          &copy; {new Date().getFullYear()} {settings.storeName} · Sistem Kasir Penjualan Warkop & Integrasi GoFood
        </p>
      </footer>

    </div>
  );
}
