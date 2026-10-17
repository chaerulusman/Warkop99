import { Category, Order, Product } from '../types';

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(amount: number): string {
  return new Intl.NumberFormat('id-ID').format(amount);
}

export function formatDateTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatTimeOnly(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export const CATEGORY_LABELS: Record<Category, string> = {
  kopi: 'Kopi & Espresso',
  mie: 'Mi Instan & Dok-dok',
  rokok: 'Rokok & Eceran',
  minuman: 'Minuman Segar',
  makanan: 'Makanan & Cemilan',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  kopi: '☕',
  mie: '🍜',
  rokok: '🚬',
  minuman: '🥤',
  makanan: '🥪',
};

// Export orders to CSV file
export function exportOrdersToCSV(orders: Order[], storeName: string) {
  const headers = [
    'ID Transaksi',
    'Waktu',
    'Saluran',
    'Pelanggan / Meja',
    'Detail Gojek (Driver / Order ID)',
    'Rincian Menu',
    'Total Item',
    'Metode Bayar',
    'Omzet Penjualan (Rp)',
    'Potongan Komisi Gojek (Rp)',
    'Pendapatan Bersih (Rp)',
    'Modal HPP (Rp)',
    'Laba Bersih (Rp)',
    'Status',
  ];

  const rows = orders.map((o) => {
    const itemList = o.items.map((i) => `${i.name} (x${i.quantity})`).join('; ');
    const totalQty = o.items.reduce((sum, i) => sum + i.quantity, 0);
    const gojekInfo = o.channel === 'gofood' && o.gofoodDetails
      ? `Gojek ${o.gofoodDetails.orderId} - Driver: ${o.gofoodDetails.driverName}`
      : '-';

    return [
      `"${o.id}"`,
      `"${formatDateTime(o.createdAt)}"`,
      `"${o.channel === 'gofood' ? 'Gojek (GoFood)' : 'Penjualan Langsung'}"`,
      `"${o.customerName || o.tableOrNote || 'Pelanggan Walk-in'}"`,
      `"${gojekInfo}"`,
      `"${itemList}"`,
      totalQty,
      `"${o.paymentMethod.toUpperCase()}"`,
      o.total,
      o.commissionAmount,
      o.netRevenue,
      o.totalCost,
      o.grossProfit,
      `"${o.status}"`,
    ];
  });

  const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  const nowStr = new Date().toISOString().slice(0, 10);
  link.setAttribute('download', `Rekap_Penjualan_${storeName.replace(/\s+/g, '_')}_${nowStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
