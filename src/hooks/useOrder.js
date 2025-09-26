import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { projectFirestore } from '../firebase/config';

export const useOrder = () => {
  const { user } = useContext(AuthContext);

  const createOrder = async (cart) => {
    if (!user) throw new Error('Not authenticated');
    const orderMeta = {
      userId: user.uid,
      userName: user.displayName || '',
      userEmail: user.email,
      createdAt: new Date(),
      status: 'pending',
      totalQty: cart.reduce((sum, item) => sum + (item.qty || 1), 0),
    };
    const orderRef = await projectFirestore.collection('orders').add(orderMeta);
    const batch = projectFirestore.batch();
    cart.forEach((item) => {
      const itemRef = orderRef.collection('items').doc();
      batch.set(itemRef, {
        recipeId: item.id,
        recipeName: item.name,
        class: item.year,
        qty: item.qty || 1,
        notes: item.notes || '',
        deliveryDate: item.date || '',
        status: 'pending',
      });
    });
    await batch.commit();
    return orderRef.id;
  };

  return { createOrder };
};
