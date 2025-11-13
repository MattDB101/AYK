import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';

export const useGetOrders = () => {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchOrders = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const snapshot = await projectFirestore.collection('orders').orderBy('createdAt', 'desc').get();

        const list = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setOrders(list);
      } catch (err) {
        console.error('Error fetching orders:', err);
        setError(err.message || err);
        setOrders([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrders();
  }, []);

  return { orders, isLoading, error };
};
