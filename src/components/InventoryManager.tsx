import React, { useState, useMemo } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  AlertTriangle, 
  Check, 
  X, 
  ArrowUpDown, 
  PlusCircle,
  Coffee,
  DollarSign
} from 'lucide-react';
import { Product, Category } from '../types';
import { formatRupiah, CATEGORY_LABELS } from '../utils/format';

interface InventoryManagerProps {
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({
  products,
  onUpdateProducts,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [stockStatusFilter, setStockStatusFilter] = useState<'all' | 'low' | 'out'>('all');
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [restockProduct, setRestockProduct] = useState<Product | null>(null);
  const [restockAmount, setRestockAmount] = useState<number>(10);

  // Form state for new / edit product
  const [formData, setFormData] = useState<Partial<Product>>({
    name: '',
    category: 'kopi',
    price: 5000,
    gofoodPrice: 7000,
    costPrice: 2000,
    stock: 50,
    unit: 'porsi',
    minStockAlert: 10,
    isAvailable: true,
  });

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchCat = categoryFilter === 'all' || p.category === categoryFilter;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchStock =
        stockStatusFilter === 'all'
          ? true
          : stockStatusFilter === 'low'
          ? p.stock > 0 && p.stock <= p.minStockAlert
          : p.stock <= 0;
      return matchCat && matchSearch && matchStock;
    });
  }, [products, categoryFilter, searchQuery, stockStatusFilter]);

  // Inventory analytics
  const totalItemsCount = products.length;
  const lowStockCount = products.filter((p) => p.stock > 0 && p.stock <= p.minStockAlert).length;
  const outOfStockCount = products.filter((p) => p.stock <= 0).length;
  const totalStockValuation = products.reduce((sum, p) => sum + p.stock * p.costPrice, 0);

  // Restock action
  const handleApplyRestock = () => {
    if (!restockProduct || restockAmount <= 0) return;
    const updated = products.map((p) => {
      if (p.id === restockProduct.id) {
        return {
          ...p,
          stock: p.stock + restockAmount,
          isAvailable: true,
        };
      }
      return p;
    });
    onUpdateProducts(updated);
    setRestockProduct(null);
  };

  // Save new product
  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) return;

    if (editingProduct) {
      // Update
      const updated = products.map((p) =>
        p.id === editingProduct.id
          ? ({ ...p, ...formData } as Product)
          : p
      );
      onUpdateProducts(updated);
      setEditingProduct(null);
    } else {
      // Create
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        name: formData.name || 'Menu Baru',
        category: formData.category || 'kopi',
        price: Number(formData.price) || 0,
        gofoodPrice: Number(formData.gofoodPrice) || Math.round((Number(formData.price) || 0) * 1.25),
        costPrice: Number(formData.costPrice) || 0,
        stock: Number(formData.stock) || 0,
        unit: formData.unit || 'porsi',
        minStockAlert: Number(formData.minStockAlert) || 10,
        isAvailable: true,
      };
      onUpdateProducts([...products, newProd]);
      setIsAddModalOpen(false);
    }

    // Reset form
    setFormData({
      name: '',
      category: 'kopi',
      price: 5000,
      gofoodPrice: 7000,
      costPrice: 2000,
      stock: 50,
      unit: 'porsi',
      minStockAlert: 10,
      isAvailable: true,
    });
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setFormData(p);
  };

  const handleDeleteProduct = (id: string, name: string) => {
    if (confirm(`Yakin ingin menghapus item "${name}" dari inventori?`)) {
      onUpdateProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Total Variasi Menu</span>
          <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
            {totalItemsCount} <span className="text-xs font-normal text-stone-500">item</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-stone-500 font-medium block">Nilai Aset Stok (Modal HPP)</span>
          <span className="text-2xl font-bold font-mono text-stone-900 mt-1 block">
            {formatRupiah(totalStockValuation)}
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-amber-700 font-medium block">Stok Menipis</span>
          <span className="text-2xl font-bold font-mono text-amber-800 mt-1 block">
            {lowStockCount} <span className="text-xs font-normal text-stone-500">item perlu restock</span>
          </span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
          <span className="text-xs text-red-600 font-medium block">Stok Habis (Kosong)</span>
          <span className="text-2xl font-bold font-mono text-red-600 mt-1 block">
            {outOfStockCount} <span className="text-xs font-normal text-stone-500">item tidak bisa dijual</span>
          </span>
        </div>
      </div>

      {/* Control Bar: Filters & Add Product Button */}
      <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari barang inventori..."
            className="w-full pl-9 pr-4 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">Semua Kategori</option>
            {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat]}
              </option>
            ))}
          </select>

          {/* Stock Status Filter */}
          <select
            value={stockStatusFilter}
            onChange={(e) => setStockStatusFilter(e.target.value as 'all' | 'low' | 'out')}
            className="px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs font-medium text-stone-700 focus:outline-none"
          >
            <option value="all">Semua Status Stok</option>
            <option value="low">⚠️ Stok Menipis</option>
            <option value="out">🛑 Stok Habis</option>
          </select>

          {/* Add New Product Trigger */}
          <button
            type="button"
            onClick={() => {
              setEditingProduct(null);
              setFormData({
                name: '',
                category: 'kopi',
                price: 5000,
                gofoodPrice: 7000,
                costPrice: 2000,
                stock: 50,
                unit: 'porsi',
                minStockAlert: 10,
                isAvailable: true,
              });
              setIsAddModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-amber-800 text-white rounded-lg text-xs font-bold hover:bg-amber-900 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Menu Baru</span>
          </button>
        </div>

      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-50 border-b border-stone-200 text-stone-500 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Nama Menu</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Modal (HPP)</th>
                <th className="py-3 px-4 text-right">Harga Warkop</th>
                <th className="py-3 px-4 text-right">Harga GoFood</th>
                <th className="py-3 px-4 text-center">Sisa Stok</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100 text-stone-800">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-stone-400">
                    Tidak ada menu barang yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((product) => {
                  const isOutOfStock = product.stock <= 0;
                  const isLowStock = product.stock > 0 && product.stock <= product.minStockAlert;
                  const marginWarkop = product.price - product.costPrice;
                  const marginPercent = Math.round((marginWarkop / (product.price || 1)) * 100);

                  return (
                    <tr key={product.id} className="hover:bg-stone-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-bold text-stone-900">{product.name}</div>
                        <div className="text-[11px] text-stone-400">
                          Margin Warkop: ~{marginPercent}% ({formatRupiah(marginWarkop)})
                        </div>
                      </td>

                      <td className="py-3 px-4">
                        <span className="capitalize text-stone-600 font-medium">
                          {CATEGORY_LABELS[product.category]}
                        </span>
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums text-stone-600">
                        {formatRupiah(product.costPrice)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-amber-900">
                        {formatRupiah(product.price)}
                      </td>

                      <td className="py-3 px-4 text-right font-mono tabular-nums font-bold text-emerald-800">
                        {formatRupiah(product.gofoodPrice)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                            isOutOfStock
                              ? 'bg-red-100 text-red-700'
                              : isLowStock
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-50 text-emerald-800'
                          }`}
                        >
                          {product.stock} {product.unit}
                        </span>
                      </td>

                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setRestockProduct(product);
                              setRestockAmount(10);
                            }}
                            className="px-2.5 py-1 bg-stone-100 hover:bg-amber-100 text-stone-700 hover:text-amber-900 rounded font-semibold text-[11px] transition-colors"
                            title="Tambah Stok Masuk"
                          >
                            + Restock
                          </button>

                          <button
                            type="button"
                            onClick={() => handleOpenEdit(product)}
                            className="p-1.5 text-stone-400 hover:text-stone-800 hover:bg-stone-100 rounded transition-colors"
                            title="Edit Data Menu"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(product.id, product.name)}
                            className="p-1.5 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="Hapus Menu"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 border border-stone-200 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-bold text-stone-900 text-sm">Tambah Stok Barang</h4>
                <p className="text-xs text-stone-500 mt-0.5">{restockProduct.name}</p>
              </div>
              <button onClick={() => setRestockProduct(null)} className="text-stone-400 hover:text-stone-700">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-stone-700 block">
                Jumlah Masuk ({restockProduct.unit})
              </label>
              <input
                type="number"
                min="1"
                value={restockAmount}
                onChange={(e) => setRestockAmount(Math.max(1, Number(e.target.value)))}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-lg font-mono font-bold text-stone-900 focus:ring-1 focus:ring-amber-800"
              />
              <div className="flex gap-2 pt-1">
                {[10, 24, 40, 100].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setRestockAmount(val)}
                    className="flex-1 py-1 rounded bg-stone-100 text-stone-700 text-xs font-mono font-semibold hover:bg-stone-200"
                  >
                    +{val}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 bg-stone-50 rounded-lg text-xs space-y-1 text-stone-600">
              <div className="flex justify-between">
                <span>Stok Sekarang:</span>
                <span className="font-mono font-bold">{restockProduct.stock} {restockProduct.unit}</span>
              </div>
              <div className="flex justify-between font-semibold text-emerald-800">
                <span>Stok Setelah Ditambah:</span>
                <span className="font-mono font-bold">{restockProduct.stock + restockAmount} {restockProduct.unit}</span>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRestockProduct(null)}
                className="flex-1 py-2 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleApplyRestock}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-amber-800 text-white hover:bg-amber-900"
              >
                Simpan Stok
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add / Edit Product Modal */}
      {(isAddModalOpen || editingProduct) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl flex flex-col max-h-[92vh] overflow-hidden border border-stone-200">
            <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
              <h3 className="font-bold text-stone-900 text-base">
                {editingProduct ? 'Edit Menu / Barang' : 'Tambah Menu Baru Warkop'}
              </h3>
              <button
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingProduct(null);
                }}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="flex-1 overflow-y-auto p-6 space-y-4">
              <div>
                <label className="text-xs font-semibold text-stone-700 block mb-1">
                  Nama Menu / Produk *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name || ''}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Kopi Tubruk Liong Bulan"
                  className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-1 focus:ring-amber-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={formData.category || 'kopi'}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as Category })}
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-1 focus:ring-amber-800"
                  >
                    {(Object.keys(CATEGORY_LABELS) as Category[]).map((cat) => (
                      <option key={cat} value={cat}>
                        {CATEGORY_LABELS[cat]}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Satuan
                  </label>
                  <input
                    type="text"
                    value={formData.unit || 'porsi'}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    placeholder="gelas / porsi / bks / btg / buah"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs text-stone-900 focus:ring-1 focus:ring-amber-800"
                  />
                </div>
              </div>

              {/* Price Fields: Modal HPP, Harga Warkop, Harga GoFood */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Modal (HPP) Rp
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.costPrice || ''}
                    onChange={(e) => setFormData({ ...formData, costPrice: Number(e.target.value) })}
                    placeholder="1500"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-amber-900 block mb-1">
                    Harga Jual Warkop Rp
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.price || ''}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    placeholder="5000"
                    className="w-full px-3 py-2 border border-amber-300 rounded-lg text-xs font-mono font-bold text-amber-950"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-emerald-800 block mb-1">
                    Harga GoFood Rp
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="500"
                    required
                    value={formData.gofoodPrice || ''}
                    onChange={(e) => setFormData({ ...formData, gofoodPrice: Number(e.target.value) })}
                    placeholder="7000"
                    className="w-full px-3 py-2 border border-emerald-300 rounded-lg text-xs font-mono font-bold text-emerald-950"
                  />
                </div>
              </div>

              {/* Stock & Minimum Stock Alert */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Jumlah Stok Sekarang
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.stock || ''}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    placeholder="50"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-semibold"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-stone-700 block mb-1">
                    Peringatan Stok Menipis &lt;
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.minStockAlert || ''}
                    onChange={(e) => setFormData({ ...formData, minStockAlert: Number(e.target.value) })}
                    placeholder="10"
                    className="w-full px-3 py-2 border border-stone-300 rounded-lg text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div className="pt-4 flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingProduct(null);
                  }}
                  className="flex-1 py-2.5 rounded-xl text-xs font-semibold border border-stone-300 text-stone-700 hover:bg-stone-50"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl text-xs font-bold bg-amber-800 text-white hover:bg-amber-900 shadow-xs"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan ke Menu'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};
