import { useState } from 'react';
import { projectFirestore } from '../firebase/config';

export default function useUpdateOrderItemStatus() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * updateItemStatus({ orderId, itemId, classId, action })
   * action: 'processing' | 'dispatched' | 'delivered'
   * Writes timestamp to:
   *  - /orders/{orderId}/items/{itemId} field (processedAt/shippedAt/deliveredAt)
   *  - /classOrders/{classId} field (same field name), merges with existing doc
   */
  const updateItemStatus = async ({ orderId, itemId, classId, action }) => {
    if (!orderId || !itemId) throw new Error('orderId and itemId required');
    const fieldMap = {
      processing: 'processedAt',
      dispatched: 'shippedAt',
      delivered: 'deliveredAt',
    };
    const field = fieldMap[action];
    if (!field) throw new Error('invalid action');

    const ts = new Date();
    setLoading(true);
    setError(null);

    try {
      const batch = projectFirestore.batch();

      // update item document in the order's items subcollection
      const itemRef = projectFirestore
        .collection('orders')
        .doc(String(orderId))
        .collection('items')
        .doc(String(itemId));
      batch.set(itemRef, { [field]: ts }, { merge: true });

      // also update the classOrders doc (classId is used as doc id)
      if (classId) {
        const classRef = projectFirestore.collection('classOrders').doc(String(classId));
        // ensure orderId is present and merge so we don't clobber other fields
        batch.set(classRef, { [field]: ts, orderId: String(orderId) }, { merge: true });
      }

      await batch.commit();
      return { success: true, ts };
    } catch (err) {
      setError(err.message || String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { updateItemStatus, loading, error };
}
