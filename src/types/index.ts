export type Category = 'kopi' | 'mie' | 'rokok' | 'minuman' | 'makanan';

export interface CustomizationOption {
  label: string;
  extraPrice: number;
}

export interface ProductCustomization {
  id: string;
  name: string;
  options: CustomizationOption[];
}

export interface Product {
  id: string;
  name: string;
  category: Category;
  price: number; // Harga jual warkop langsung
  gofoodPrice: number; // Harga jual di GoFood
  costPrice: number; // Modal / HPP
  stock: number;
  unit: string;
  minStockAlert: number;
  isAvailable: boolean;
  isFavorite?: boolean;
  customizations?: ProductCustomization[];
}

export interface SelectedOption {
  title: string;
  label: string;
  extraPrice: number;
}

export interface CartItem {
  cartItemId: string; // unique key in cart
  productId: string;
  name: string;
  category: Category;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
  selectedOptions: SelectedOption[];
  note?: string;
  subtotal: number;
}

export type ChannelType = 'langsung' | 'gofood';

export type PaymentMethod = 'tunai' | 'qris' | 'gopay' | 'transfer';

export type GoFoodStatus = 'incoming' | 'preparing' | 'ready' | 'picked_up' | 'completed' | 'cancelled';

export interface GoFoodDetails {
  orderId: string; // e.g. GF-9124
  driverName: string;
  driverPhone: string;
  customerName: string;
  deliveryPin: string;
  commissionRate: number; // e.g. 0.20 (20%)
  gofoodStatus: GoFoodStatus;
  estimatedPickupTime: string;
  createdAt: string;
}

export interface Order {
  id: string;
  channel: ChannelType;
  items: CartItem[];
  subtotal: number;
  discount: number;
  commissionAmount: number; // Gojek cut
  total: number; // Total bayar
  netRevenue: number; // Diterima warkop (total - komisi)
  totalCost: number; // Total modal HPP
  grossProfit: number; // netRevenue - totalCost
  paymentMethod: PaymentMethod;
  cashReceived?: number;
  change?: number;
  tableOrNote?: string;
  customerName?: string;
  gofoodDetails?: GoFoodDetails;
  status: 'completed' | 'cancelled';
  createdAt: string;
}

export interface WarkopSettings {
  storeName: string;
  address: string;
  phone: string;
  gofoodStoreOpen: boolean;
  gofoodDefaultCommission: number; // 0.20 (20%)
  soundEnabled: boolean;
  qrisMerchantName: string;
}
