import React, { useState } from 'react';
import { X, Plus, Check } from 'lucide-react';
import { Product, SelectedOption } from '../types';
import { formatRupiah } from '../utils/format';

interface CustomizationModalProps {
  product: Product;
  isGojekChannel: boolean;
  onClose: () => void;
  onAddToCart: (product: Product, options: SelectedOption[], note: string) => void;
}

export const CustomizationModal: React.FC<CustomizationModalProps> = ({
  product,
  isGojekChannel,
  onClose,
  onAddToCart,
}) => {
  const basePrice = isGojekChannel ? product.gofoodPrice : product.price;
  
  // Track selected option per customization group
  const [selections, setSelections] = useState<Record<string, { label: string; extraPrice: number }>>(() => {
    const initial: Record<string, { label: string; extraPrice: number }> = {};
    if (product.customizations) {
      product.customizations.forEach((c) => {
        if (c.options.length > 0) {
          // Default select the first option
          initial[c.id] = { label: c.options[0].label, extraPrice: c.options[0].extraPrice };
        }
      });
    }
    return initial;
  });

  const [note, setNote] = useState('');

  const calculateTotal = () => {
    let extra = 0;
    Object.values(selections).forEach((s) => {
      extra += s.extraPrice;
    });
    return basePrice + extra;
  };

  const handleOptionSelect = (customizationId: string, label: string, extraPrice: number) => {
    setSelections((prev) => ({
      ...prev,
      [customizationId]: { label, extraPrice },
    }));
  };

  const handleAdd = () => {
    const optionsArray: SelectedOption[] = Object.entries(selections).map(([id, val]) => {
      const groupName = product.customizations?.find((c) => c.id === id)?.name || '';
      return {
        title: groupName,
        label: val.label,
        extraPrice: val.extraPrice,
      };
    });

    onAddToCart(product, optionsArray, note.trim());
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs no-print">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-stone-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-200 bg-stone-50">
          <div>
            <h3 className="font-bold text-stone-900 text-base">{product.name}</h3>
            <p className="text-xs text-stone-500">
              Harga Dasar: <span className="font-semibold text-stone-700">{formatRupiah(basePrice)}</span>
              {isGojekChannel && <span className="ml-1 text-emerald-600 font-semibold">(Harga GoFood)</span>}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-stone-500 hover:text-stone-800 hover:bg-stone-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {product.customizations && product.customizations.map((group) => (
            <div key={group.id} className="space-y-2">
              <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
                {group.name}
              </label>
              <div className="space-y-1.5">
                {group.options.map((opt) => {
                  const isSelected = selections[group.id]?.label === opt.label;
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      onClick={() => handleOptionSelect(group.id, opt.label, opt.extraPrice)}
                      className={`w-full flex items-center justify-between p-3 rounded-xl border text-xs font-medium transition-all ${
                        isSelected
                          ? 'border-amber-800 bg-amber-50/70 text-amber-950 font-semibold ring-1 ring-amber-800'
                          : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50 hover:border-stone-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isSelected ? 'border-amber-800 bg-amber-800 text-white' : 'border-stone-300 bg-white'
                          }`}
                        >
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                        <span>{opt.label}</span>
                      </div>
                      <span className="tabular-nums font-mono text-stone-600">
                        {opt.extraPrice > 0 ? `+ ${formatRupiah(opt.extraPrice)}` : 'Termasuk'}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Special Cook Note */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-stone-700 uppercase tracking-wider block">
              Catatan Khusus Pesanan
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: jangan pake kecap, pedes cabe rawit 5, es batu dikit..."
              className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg text-xs text-stone-900 focus:outline-none focus:ring-1 focus:ring-amber-800 focus:bg-white resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          <div>
            <span className="text-[11px] text-stone-500 block">Total per Porsi</span>
            <span className="text-lg font-bold font-mono text-stone-900">
              {formatRupiah(calculateTotal())}
            </span>
          </div>

          <button
            type="button"
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 text-xs font-bold text-white bg-amber-800 rounded-xl hover:bg-amber-900 shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Masukkan Pesanan</span>
          </button>
        </div>

      </div>
    </div>
  );
};
