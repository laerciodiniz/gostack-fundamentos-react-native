import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Omit<Product, 'quantity'>): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const STORAGE_KEY = '@GoMarketplace:products';

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const storagedProducts = await AsyncStorage.getItem(STORAGE_KEY);

      if (storagedProducts) {
        setProducts([...JSON.parse(storagedProducts)]);
      }
    }

    loadProducts();
  }, []);

  const increment = useCallback(
    async id => {
      const newProducts = products.map(product =>
        product.id === id
          ? { ...product, quantity: product.quantity + 1 }
          : product,
      );

      setProducts(newProducts);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const listProducts = products.filter(product => product.id !== id);
      const newProduct = products.find(product => product.id === id);

      if (newProduct && newProduct.quantity > 1) {
        const newProducts = products.map(product =>
          product.id === id
            ? { ...product, quantity: product.quantity - 1 }
            : product,
        );

        setProducts(newProducts);

        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newProducts));
      } else {
        await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(listProducts));
        setProducts([]);
        setProducts(listProducts);
      }
    },
    [products],
  );

  const addToCart = useCallback(
    async product => {
      const productExists = products.find(p => p.id === product.id);

      if (productExists) {
        increment(product.id);
        return;
      }

      setProducts([...products, { ...product, quantity: 1 }]);

      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(products));
    },
    [products, increment],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
