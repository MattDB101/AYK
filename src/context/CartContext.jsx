import React, { createContext, useContext, useState, useEffect } from 'react';

const CartContext = createContext();

export function useCart() {
  return useContext(CartContext);
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(() => {
    const stored = localStorage.getItem('cart');
    return stored ? JSON.parse(stored) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const addToCart = (item) => {
    setCart((prev) => {
      // If item with same id and year exists, increase qty
      const idx = prev.findIndex((i) => i.id === item.id && i.year === item.year);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx].qty = updated[idx].qty + 1;
        return updated;
      }
      return [...prev, { ...item }];
    });
  };

  const removeFromCart = (id, year) => {
    setCart((prev) => prev.filter((i) => !(i.id === id && i.year === year)));
  };

  const clearCart = () => setCart([]);

  const updateQty = (item, qty) => {
    setCart((prev) =>
      prev.map((i) => (i.id === item.id && i.year === item.year ? { ...i, qty: Math.max(1, qty) } : i))
    );
  };

  const updateNotes = (item, notes) => {
    setCart((prev) => prev.map((i) => (i.id === item.id && i.year === item.year ? { ...i, notes } : i)));
  };

  const updateDate = (item, date) => {
    setCart((prev) => prev.map((i) => (i.id === item.id && i.year === item.year ? { ...i, date } : i)));
  };

  const updateYear = (item, year) => {
    setCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, year } : i)));
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        updateQty,
        updateNotes,
        updateDate,
        updateYear,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}
