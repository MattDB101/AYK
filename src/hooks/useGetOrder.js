import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';

export const useGetOrder = (orderId) => {
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(orderId));
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const fetch = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const orderRef = projectFirestore.collection('orders').doc(String(orderId).trim());
        const orderDoc = await orderRef.get();

        if (cancelled) return;

        if (!orderDoc.exists) {
          setOrder(null);
          setError('Order not found');
          return;
        }

        // read order data
        const orderData = { id: orderDoc.id, ...orderDoc.data() };

        // fetch items subcollection (all docs)
        try {
          const itemsSnap = await orderRef.collection('items').get();
          const items = itemsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          orderData.items = items;
        } catch (itemsErr) {
          console.error('Error fetching order items:', itemsErr);
          // still return order without items, but surface error
          orderData.items = [];
          setError((prev) =>
            prev ? `${prev}; items error: ${itemsErr.message || itemsErr}` : itemsErr.message || String(itemsErr)
          );
        }

        if (!cancelled) setOrder(orderData);
      } catch (err) {
        console.error('Error fetching order:', err);
        if (!cancelled) {
          setError(err.message || String(err));
          setOrder(null);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    fetch();
    return () => {
      cancelled = true;
    };
  }, [orderId]);

  return { order, isLoading, error };
};
