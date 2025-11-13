import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { projectFirestore } from '../firebase/config';

export const useOrder = () => {
  const { user } = useContext(AuthContext);

  const createOrder = async (cart) => {
    if (!user) throw new Error('Not authenticated');

    const orderMeta = {
      userId: user.uid,
      userEmail: user.email,
      createdAt: new Date(),
      status: 'pending',
      schoolId: user?.claims?.schoolId || user?.schoolId || '',
      totalQty: cart.reduce((sum, item) => sum + (item.qty || 1), 0),
      processedAt: '',
      shippedAt: '',
      deliveredAt: '',
    };

    try {
      // create top-level order doc
      const orderRef = await projectFirestore.collection('orders').add(orderMeta);

      // group items by classId and build per-class item lists
      const classGroups = cart.reduce((acc, item) => {
        const classId = item.class;
        if (!acc[classId]) acc[classId] = [];
        acc[classId].push(item);
        return acc;
      }, {});

      // prepare batch for creating items and classOrders
      const batch = projectFirestore.batch();

      // add items under orders/{orderId}/items, include classId + className + recipeName
      cart.forEach((item) => {
        // console.log(item);
        const itemRef = orderRef.collection('items').doc();
        batch.set(itemRef, {
          recipeId: item.id,
          recipeName: item.name,
          classId: item.class,
          className: item.className,
          qty: item.qty,
          notes: item.notes || '',
          deliveryDate: item.date,
          status: 'pending',
          schoolId: orderMeta.schoolId || '',
        });
      });

      // build per-class totals and items summary, then write classOrders docs
      Object.keys(classGroups).forEach((classId) => {
        const itemsForClass = classGroups[classId];
        const totalQty = itemsForClass.reduce((s, it) => s + (it.qty || 1), 0);
        const itemsSummary = itemsForClass.map((it) => ({
          recipeId: it.id,
          recipeName: it.name,
          qty: it.qty,
        }));

        const classOrderRef = projectFirestore.collection('classOrders').doc(classId);
        batch.set(classOrderRef, {
          orderId: orderRef.id,
          classId: classId,
          className: itemsForClass[0]?.className,
          schoolId: orderMeta.schoolId || '',
          createdAt: orderMeta.createdAt,
          processedAt: '',
          shippedAt: '',
          deliveredAt: '',
          status: orderMeta.status,
          totalQty,
          userId: user.uid,
          userEmail: user.email,
          ...itemsSummary[0],
        });
      });

      // commit batch
      await batch.commit();

      return orderRef.id;
    } catch (err) {
      console.error('createOrder error:', err);
      throw err;
    }
  };

  return { createOrder };
};
