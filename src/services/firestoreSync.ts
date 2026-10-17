import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  onSnapshot, 
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, validateFirestoreConnection } from '../lib/firebase';
import { Product, Order, WarkopSettings } from '../types';
import { INITIAL_PRODUCTS, INITIAL_ORDERS, INITIAL_SETTINGS } from '../data/defaultData';

export class FirestoreSyncService {
  private static isConnected: boolean = false;

  public static async initConnection() {
    this.isConnected = await validateFirestoreConnection();
  }

  // Seed default data if database is empty
  public static async seedInitialDataIfEmpty() {
    try {
      const prodSnapshot = await getDocs(collection(db, 'products'));
      if (prodSnapshot.empty) {
        // Seed initial products
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, 'products', p.id), p);
        }

        // Seed initial orders
        for (const o of INITIAL_ORDERS) {
          await setDoc(doc(db, 'orders', o.id), o);
        }

        // Seed initial settings
        await setDoc(doc(db, 'settings', 'config'), INITIAL_SETTINGS);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'products');
    }
  }

  // Real-time listener for Products
  public static subscribeProducts(onUpdate: (products: Product[]) => void) {
    try {
      return onSnapshot(collection(db, 'products'), (snapshot) => {
        if (!snapshot.empty) {
          const prods: Product[] = [];
          snapshot.forEach((d) => prods.push(d.data() as Product));
          onUpdate(prods);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'products');
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'products');
      return () => {};
    }
  }

  // Real-time listener for Orders
  public static subscribeOrders(onUpdate: (orders: Order[]) => void) {
    try {
      return onSnapshot(collection(db, 'orders'), (snapshot) => {
        if (!snapshot.empty) {
          const ords: Order[] = [];
          snapshot.forEach((d) => ords.push(d.data() as Order));
          ords.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
          onUpdate(ords);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'orders');
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'orders');
      return () => {};
    }
  }

  // Real-time listener for Settings
  public static subscribeSettings(onUpdate: (settings: WarkopSettings) => void) {
    try {
      return onSnapshot(doc(db, 'settings', 'config'), (d) => {
        if (d.exists()) {
          onUpdate(d.data() as WarkopSettings);
        }
      }, (err) => {
        handleFirestoreError(err, OperationType.GET, 'settings/config');
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.GET, 'settings/config');
      return () => {};
    }
  }

  // Save new order to Firestore
  public static async saveOrder(order: Order) {
    try {
      await setDoc(doc(db, 'orders', order.id), order);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `orders/${order.id}`);
    }
  }

  // Update order status (for Gojek order statuses)
  public static async updateOrderStatus(orderId: string, updatedOrder: Order) {
    try {
      await setDoc(doc(db, 'orders', orderId), updatedOrder);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
    }
  }

  // Save/Update product (e.g. on stock decrement or edit)
  public static async saveProduct(product: Product) {
    try {
      await setDoc(doc(db, 'products', product.id), product);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `products/${product.id}`);
    }
  }

  // Save batch products
  public static async syncAllProducts(products: Product[]) {
    try {
      for (const p of products) {
        await setDoc(doc(db, 'products', p.id), p);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'products');
    }
  }

  // Save Settings
  public static async saveSettings(settings: WarkopSettings) {
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/config');
    }
  }
}
