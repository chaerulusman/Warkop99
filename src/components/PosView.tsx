import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Trash2, 
  Plus, 
  Minus, 
  ArrowRight, 
  ShoppingBag, 
  Bike, 
  Coffee, 
  Flame, 
  SlidersHorizontal,
  AlertCircle
} from 'lucide-react';
import { Product, CartItem, Category, ChannelType, SelectedOption, WarkopSettings } from '../types';
import { formatRupiah, CATEGORY_LABELS } from '../utils/format';
import { soundManager } from '../utils/audio';
import { CustomizationModal } from './CustomizationModal';

interface PosViewProps {
  products: Product[];
  channel: ChannelType;
  onChannelChange: (channel: ChannelType) => void;
  cart: CartItem[];
  onUpdateCart: (cart: CartItem[]) => void;
  onOpenPayment: () => void;
  settings: WarkopSettings;
  onSimulateGojekOrder: () => void;
}

export const PosView: React.FC<PosViewProps> = ({
  products,
  channel,
  onChannelChange,
  cart,
  onUpdateCart,
  onOpenPayment,
  settings,
  onSimulateGojekOrder,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<Category | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customizingProduct, setCustomizingProduct] = useState<Product | null>(null);

  const isGojek = channel === 'gofood';

  // Filter products by category and search
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = selectedCategory === 'all' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  // Handle clicking on a product card
  const handleProductClick = (product: Product) => {
    if (product.stock <= 0) return;

    if (product.customizations && product.customizations.length > 0) {
      setCustomizingProduct(product);
    } else {
      // Add directly
      addToCart(product, [], '');
    }
  };

  const addToCart = (product: Product, selectedOptions: SelectedOption[], note: string) => {
    soundManager.playClick();
    const unitPrice = (isGojek ? product.gofoodPrice : product.price) +
      selectedOptions.reduce((sum, opt) => sum + opt.extraPrice, 0);

    // Check if matching item exists in cart
    const existingIndex = cart.findIndex(
      (item) =>
        item.productId === product.id &&
        item.note === note &&
        JSON.stringify(item.selectedOptions) === JSON.stringify(selectedOptions)
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      if (updated[existingIndex].quantity < product.stock) {
        updated[existingIndex].quantity += 1;
        updated[existingIndex].subtotal = updated[existingIndex].quantity * updated[existingIndex].unitPrice;
        onUpdateCart(updated);
      }
    } else {
      const newItem: CartItem = {
        cartItemId: `${product.id}-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        productId: product.id,
        name: product.name,
        category: product.category,
        unitPrice,
        costPrice: product.costPrice,
        quantity: 1,
        unit: product.unit,
        selectedOptions,
        note,
        subtotal: unitPrice,
      };
      onUpdateCart([...cart, newItem]);
    }
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.cartItemId === cartItemId) {
          const product = products.find((p) => p.id === item.productId);
          const maxStock = product ? product.stock : 999;
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          if (newQty > maxStock) return item; // Cannot exceed stock
          return {
            ...item,
            quantity: newQty,
            subtotal: newQty * item.unitPrice,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    onUpdateCart(updated);
  };

  const handleRemoveItem = (cartItemId: string) => {
    onUpdateCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  const handleClearCart = () => {
    if (cart.length > 0 && confirm('Kosongkan keranjang pesanan?')) {
      onUpdateCart([]);
    }
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-full min-h-[calc(100vh-120px)]">
      
      {/* Left Column: Menu Catalog */}
      <div className="flex-1 flex flex-col space-y-4">
        
        {/* Top Controls: Channel Switcher & Search */}
        <div className="bg-white p-4 rounded-xl border border-stone-200/80 shadow-xs space-y-3">
          
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            
            {/* Channel Segmented Control */}
            <div className="flex items-center gap-1.5 p-1 bg-stone-100 rounded-xl border border-stone-200/70">
              <button
                type="button"
                onClick={() => onChannelChange('langsung')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  !isGojek
                    ? 'bg-amber-800 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Coffee className="w-4 h-4" />
                <span>Penjualan Langsung (Warkop)</span>
              </button>

              <button
                type="button"
                onClick={() => onChannelChange('gofood')}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all ${
                  isGojek
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-600 hover:text-stone-900 hover:bg-stone-200/50'
                }`}
              >
                <Bike className="w-4 h-4" />
                <span>Pesanan Gojek (GoFood)</span>
              </button>
            </div>

            {/* Quick Gojek Simulation Trigger */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onSimulateGojekOrder}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors"
                title="Simulasi Pesanan Baru Gojek Masuk"
              >
                <Bike className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Simulasi Order</span>
                <span>Gojek Masuk</span>
              </button>
            </div>
          </div>

          {/* Search & Category Tabs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari kopi hitam, indomie rebus, rokok surya, es teh..."
                className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
              />
            </div>

            {/* Category Filter Buttons */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === 'all'
                    ? 'bg-stone-900 text-white font-semibold'
                    : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                Semua Menu
              </button>
              {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${
                    selectedCategory === cat
                      ? 'bg-amber-800 text-white font-semibold'
                      : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                  }`}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              ))}
            </div>
          </div>

        </div>

        {/* Product Cards Grid */}
        <div className="flex-1 overflow-y-auto pr-1">
          {filteredProducts.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center bg-white rounded-xl border border-stone-200 text-stone-400 p-6 text-center">
              <Coffee className="w-8 h-8 mb-2 opacity-50" />
              <p className="text-sm font-semibold text-stone-600">Menu tidak ditemukan</p>
              <p className="text-xs text-stone-400 mt-1">Coba gunakan kata kunci lain atau pilih kategori Semua.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3">
              {filteredProducts.map((product) => {
                const currentPrice = isGojek ? product.gofoodPrice : product.price;
                const isOutOfStock = product.stock <= 0;
                const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;

                return (
                  <button
                    key={product.id}
                    type="button"
                    disabled={isOutOfStock}
                    onClick={() => handleProductClick(product)}
                    className={`relative p-3.5 rounded-xl text-left border flex flex-col justify-between transition-all group ${
                      isOutOfStock
                        ? 'bg-stone-100/80 border-stone-200 opacity-60 cursor-not-allowed'
                        : 'bg-white border-stone-200 hover:border-amber-700/60 hover:shadow-md active:scale-[0.98]'
                    }`}
                  >
                    <div>
                      {/* Top labels: category & stock indicator */}
                      <div className="flex items-center justify-between text-[11px] text-stone-500 mb-1.5">
                        <span className="capitalize">{product.category}</span>
                        <span
                          className={`font-mono text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-stone-100 text-stone-600'
                          }`}
                        >
                          {isOutOfStock ? 'Habis' : `Sisa ${product.stock} ${product.unit}`}
                        </span>
                      </div>

                      {/* Product Name */}
                      <h4 className="text-xs font-bold text-stone-900 group-hover:text-amber-900 transition-colors line-clamp-2 leading-snug">
                        {product.name}
                      </h4>

                      {/* Customization prompt if any */}
                      {product.customizations && product.customizations.length > 0 && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-amber-800 font-medium">
                          <SlidersHorizontal className="w-3 h-3 inline" />
                          <span>Pilihan topping/suhu</span>
                        </div>
                      )}
                    </div>

                    {/* Price & Add indicator */}
                    <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold font-mono text-stone-900">
                          {formatRupiah(currentPrice)}
                        </span>
                        {isGojek && (
                          <span className="block text-[10px] text-emerald-700 font-medium">
                            GoFood
                          </span>
                        )}
                      </div>

                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center transition-colors ${
                          isOutOfStock
                            ? 'bg-stone-200 text-stone-400'
                            : 'bg-stone-100 text-stone-700 group-hover:bg-amber-800 group-hover:text-white'
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

      </div>

      {/* Right Column: Active Order Cart Drawer */}
      <div className="w-full lg:w-[380px] bg-white rounded-xl border border-stone-200 shadow-xs flex flex-col h-full min-h-[520px]">
        
        {/* Cart Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70 rounded-t-xl">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-stone-700" />
            <h3 className="font-bold text-stone-900 text-sm">Keranjang Pesanan</h3>
            <span className="px-2 py-0.5 rounded-full bg-stone-200 text-stone-800 text-[11px] font-mono font-bold">
              {cartItemCount}
            </span>
          </div>

          {cart.length > 0 && (
            <button
              type="button"
              onClick={handleClearCart}
              className="text-stone-400 hover:text-red-600 transition-colors p-1"
              title="Kosongkan Pesanan"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Current Channel Info Bar */}
        <div
          className={`px-4 py-2 border-b text-xs flex items-center justify-between ${
            isGojek
              ? 'bg-emerald-50 text-emerald-900 border-emerald-100'
              : 'bg-amber-50/50 text-amber-900 border-amber-100'
          }`}
        >
          <div className="flex items-center gap-1.5 font-medium">
            {isGojek ? <Bike className="w-3.5 h-3.5 text-emerald-600" /> : <Coffee className="w-3.5 h-3.5 text-amber-800" />}
            <span>{isGojek ? 'Pesanan Online Gojek' : 'Kasir Pesanan Langsung'}</span>
          </div>
          <span className="text-[11px] font-mono font-semibold">
            {isGojek ? 'Harga GoFood' : 'Harga Warkop'}
          </span>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {cart.length === 0 ? (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-stone-400">
              <ShoppingBag className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-xs font-semibold text-stone-600">Keranjang masih kosong</p>
              <p className="text-[11px] text-stone-400 mt-1 max-w-[200px]">
                Pilih menu kopi, mi instan, rokok, atau cemilan di sebelah kiri untuk mulai transaksi.
              </p>
            </div>
          ) : (
            cart.map((item) => (
              <div
                key={item.cartItemId}
                className="p-3 rounded-lg border border-stone-200 bg-stone-50/60 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h5 className="text-xs font-bold text-stone-900 leading-tight">
                      {item.name}
                    </h5>
                    {item.selectedOptions && item.selectedOptions.length > 0 && (
                      <p className="text-[11px] text-stone-500 mt-0.5">
                        {item.selectedOptions.map((o) => o.label).join(', ')}
                      </p>
                    )}
                    {item.note && (
                      <p className="text-[10px] italic text-amber-800 mt-0.5">
                        Catatan: {item.note}
                      </p>
                    )}
                  </div>
                  <span className="text-xs font-mono font-bold text-stone-900 tabular-nums">
                    {formatRupiah(item.subtotal)}
                  </span>
                </div>

                {/* Quantity Controls & Remove */}
                <div className="flex items-center justify-between pt-1 border-t border-stone-200/60">
                  <span className="text-[11px] text-stone-500 font-mono">
                    @{formatRupiah(item.unitPrice)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.cartItemId, -1)}
                      className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-mono font-bold w-5 text-center">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleUpdateQuantity(item.cartItemId, 1)}
                      className="w-6 h-6 rounded bg-white border border-stone-300 flex items-center justify-center text-stone-700 hover:bg-stone-100"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.cartItemId)}
                      className="text-stone-400 hover:text-red-600 transition-colors ml-1 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Cart Bottom Summary & Checkout Button */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 rounded-b-xl space-y-3">
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between text-stone-600">
              <span>Subtotal ({cartItemCount} item)</span>
              <span className="tabular-nums font-mono font-medium">{formatRupiah(cartTotal)}</span>
            </div>
            
            <div className="flex justify-between items-baseline pt-1 border-t border-stone-200 text-stone-900">
              <span className="text-sm font-bold">Total Pembayaran</span>
              <span className="text-xl font-bold font-mono text-amber-950 tabular-nums">
                {formatRupiah(cartTotal)}
              </span>
            </div>
          </div>

          <button
            type="button"
            disabled={cart.length === 0}
            onClick={onOpenPayment}
            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              cart.length === 0
                ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                : 'bg-amber-800 text-white hover:bg-amber-900 active:scale-[0.99] shadow-sm'
            }`}
          >
            <span>Bayar & Proses Pesanan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>

      {/* Customization Modal */}
      {customizingProduct && (
        <CustomizationModal
          product={customizingProduct}
          isGojekChannel={isGojek}
          onClose={() => setCustomizingProduct(null)}
          onAddToCart={addToCart}
        />
      )}

    </div>
  );
};
