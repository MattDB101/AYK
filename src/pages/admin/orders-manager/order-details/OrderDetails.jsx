import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import LoadingDots from '../../../../components/LoadingDots/LoadingDots';
import { useGetOrder } from '../../../../hooks/useGetOrder';
import useUpdateOrderItemStatus from '../../../../hooks/useUpdateOrderItemStatus';
import { projectFirestore } from '../../../../firebase/config';
import styles from './OrderDetails.module.css';

export default function OrderDetails() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { order, isLoading, error } = useGetOrder(orderId);
  const { updateItemStatus, loading: updating } = useUpdateOrderItemStatus();

  // local copy so UI updates immediately after actions even if hook doesn't re-fetch
  const [localOrder, setLocalOrder] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  console.log(order);

  useEffect(() => {
    setActionError('');
  }, [orderId]);

  // keep localOrder in sync with hook result
  useEffect(() => {
    setLocalOrder(order ? { ...order } : null);
  }, [order]);

  useEffect(() => {
    if (!order?.schoolId) {
      setSchoolName('');
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const doc = await projectFirestore.collection('schools').doc(String(order.schoolId)).get();
        if (cancelled) return;
        setSchoolName(doc.exists ? doc.data().name || '' : '');
      } catch (err) {
        console.error('Error loading school:', err);
        if (!cancelled) setSchoolName('');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [order?.schoolId]);

  const formatDate = (ts) => {
    if (!ts) return '';
    if (typeof ts.toDate === 'function') return ts.toDate().toLocaleString();
    if (ts instanceof Date) return ts.toLocaleString();
    const d = new Date(ts);
    return isNaN(d.getTime()) ? '' : d.toLocaleString();
  };

  const statusOrder = useMemo(() => ['pending', 'processing', 'dispatched', 'delivered'], []);
  const currentStatusIndex = useMemo(
    () => statusOrder.indexOf(order?.status || 'pending'),
    [order?.status, statusOrder]
  );

  const updateStatus = async (newStatus) => {
    if (!order?.id) return;
    // don't allow regressions
    const newIndex = statusOrder.indexOf(newStatus);
    if (newIndex <= currentStatusIndex) return;

    setActionLoading(true);
    setActionError('');
    try {
      const now = new Date();
      const orderRef = projectFirestore.collection('orders').doc(order.id);
      const updates = { status: newStatus };
      if (newStatus === 'processing') updates.processedAt = now;
      if (newStatus === 'dispatched') updates.shippedAt = now;
      if (newStatus === 'delivered') updates.deliveredAt = now;

      // Prepare batch: update order and all related classOrders docs (one per classId)
      const batch = projectFirestore.batch();
      batch.update(orderRef, updates);

      // use the most up-to-date items (localOrder falls back to order)
      const items = Array.isArray(localOrder?.items ? localOrder.items : order?.items)
        ? localOrder?.items || order?.items
        : [];
      const classIds = [...new Set(items.map((it) => String(it.classId || it.class || '')))].filter((id) => id);
      classIds.forEach((cid) => {
        const classRef = projectFirestore.collection('classOrders').doc(String(cid));
        const classUpdates = { status: newStatus };
        if (newStatus === 'processing') classUpdates.processedAt = now;
        if (newStatus === 'dispatched') classUpdates.shippedAt = now;
        if (newStatus === 'delivered') classUpdates.deliveredAt = now;
        // ensure orderId is current
        classUpdates.orderId = order.id;
        batch.set(classRef, classUpdates, { merge: true });
      });

      await batch.commit();

      // update local copy so UI reflects change immediately
      setLocalOrder((prev) => {
        if (!prev) return prev;
        return { ...prev, ...updates };
      });
      // naive local update — the useGetOrder hook's snapshot should update the UI, but force-refetch not needed
    } catch (err) {
      console.error('Error updating status:', err);
      setActionError(err.message || String(err));
    } finally {
      setActionLoading(false);
    }
  };

  // mark order as complete (updates /orders/{orderId}.status = 'complete')
  const markComplete = async () => {
    if (!order?.id) return;
    if (order.status === 'complete') return;
    setActionLoading(true);
    setActionError('');
    try {
      await projectFirestore.collection('orders').doc(order.id).update({ status: 'complete' });

      // update local copy so UI updates without refresh
      setLocalOrder((prev) => (prev ? { ...prev, status: 'complete' } : prev));

      // optional: force a small delay to ensure server write settles before UI shows it
      // await new Promise((r) => setTimeout(r, 300));
    } catch (err) {
      console.error('Error marking complete:', err);
      setActionError(err.message || String(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading order" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading order: {error}</p>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  if (!order) {
    return (
      <div className={styles.container}>
        <h2>Order not found</h2>
        <button onClick={() => navigate(-1)}>Back</button>
      </div>
    );
  }

  // prefer localOrder (optimistic) when rendering
  const displayed = localOrder ?? order;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Order Details</h2>
        </div>
        <div>
          <button className={styles.addButton} onClick={() => navigate(-1)}>
            Back
          </button>
        </div>
      </div>

      <div className={styles.controls}>
        <div className={styles.stats}>
          <div>
            <strong>School:</strong> {schoolName || displayed.schoolId || '—'}
          </div>
          <div>
            <strong>User Email:</strong> {displayed.userEmail || displayed.user?.email || '—'}
          </div>{' '}
          <div>
            <strong> Order ID:</strong> {displayed.id || '—'}
          </div>{' '}
          <div>
            <strong> Created On:</strong> {formatDate(displayed.createdAt) || '—'}
          </div>
          <div>
            <strong>Total Qty:</strong> {displayed.totalQty ?? 0}
          </div>
          <div>
            <strong>Status:</strong> {displayed.status}
          </div>
          <div style={{ marginTop: 8 }}>
            {actionLoading && <span style={{ marginLeft: 12 }}>Updating…</span>}
            {actionError && <div style={{ color: '#b00020', marginTop: 8 }}>{actionError}</div>}
          </div>
          <div style={{ marginTop: 12 }}>
            <button
              className={styles.addButton}
              disabled={actionLoading || displayed.status === 'complete'}
              onClick={markComplete}
              title="Mark order as complete"
            >
              {displayed.status === 'complete' ? 'Completed' : 'Mark as Complete'}
            </button>
          </div>
        </div>
      </div>

      {/* items */}
      {displayed.items && Array.isArray(displayed.items) && (
        <div style={{ marginTop: 20 }}>
          <h3>Items</h3>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Qty</th>
                <th>Requested Delivery</th>
                <th>Class</th>
                <th>Notes</th>
                <th>Processed</th>
                <th>Dispatched</th>
                <th>Delivered</th>
              </tr>
            </thead>
            <tbody>
              {displayed.items.map((it, i) => {
                const itemId = it.id || it.itemId || '';
                const classId = it.classId || it.class || '';
                const processedAtExists = !!(it.processedAt || it.processedAt === 0);
                const shippedAtExists = !!(it.shippedAt || it.shippedAt === 0);
                const deliveredAtExists = !!(it.deliveredAt || it.deliveredAt === 0);

                const onAction = async (action) => {
                  setActionError('');
                  try {
                    await updateItemStatus({ orderId: order.id, itemId, classId, action });
                    // update local copy for this item timestamp so UI updates immediately
                    setLocalOrder((prev) => {
                      if (!prev) return prev;
                      const items = (prev.items || []).map((x) => {
                        if ((x.id || x.itemId || '') === (itemId || '')) {
                          const now = new Date();
                          if (action === 'processing') return { ...x, processedAt: now };
                          if (action === 'dispatched') return { ...x, shippedAt: now };
                          if (action === 'delivered') return { ...x, deliveredAt: now };
                        }
                        return x;
                      });
                      return { ...prev, items };
                    });
                  } catch (err) {
                    setActionError(err.message || String(err));
                  }
                };

                return (
                  <tr key={itemId || i}>
                    <td style={{ display: 'none' }}>{itemId}</td>
                    {/* itemId hidden */}
                    <td style={{ display: 'none' }}>{classId}</td>
                    {/* classId hidden */}
                    <td>{it.recipeName || it.recipe || it.name || ''}</td>
                    <td>{it.qty ?? ''}</td>
                    <td>{it.deliveryDate || ''}</td>
                    <td>{it.className || it.classId || it.class || ''}</td>

                    <td>
                      {it.notes ? (
                        <button
                          type="button"
                          className={styles.formActions}
                          onClick={() => alert(it.notes)}
                          title="View note"
                        >
                          View Note
                        </button>
                      ) : (
                        ''
                      )}
                    </td>

                    <td>
                      {processedAtExists ? (
                        <span>{formatDate(it.processedAt)}</span>
                      ) : (
                        <button
                          className={styles.formActions}
                          disabled={updating}
                          onClick={() => onAction('processing')}
                          title="Mark this item as processing"
                        >
                          Mark Processing
                        </button>
                      )}
                    </td>

                    <td>
                      {shippedAtExists ? (
                        <span>{formatDate(it.shippedAt)}</span>
                      ) : (
                        <button
                          className={styles.formActions}
                          disabled={updating}
                          onClick={() => onAction('dispatched')}
                          title="Mark this item as dispatched"
                        >
                          Mark Dispatched
                        </button>
                      )}
                    </td>

                    <td>
                      {deliveredAtExists ? (
                        <span>{formatDate(it.deliveredAt)}</span>
                      ) : (
                        <button
                          className={styles.formActions}
                          disabled={updating}
                          onClick={() => onAction('delivered')}
                          title="Mark this item as delivered"
                        >
                          Mark Delivered
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* <div style={{ marginTop: 20 }}>
        <h3>Raw data</h3>
        <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: 12, borderRadius: 6 }}>
          {JSON.stringify(order, null, 2)}
        </pre>
      </div> */}
    </div>
  );
}
