import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import { useGetOrders } from '../../../hooks/useGetOrders';
import styles from '../recipe-manager/RecipeManager.module.css';

function SchoolManager() {
  const navigate = useNavigate();
  const { orders, isLoading: loading, error } = useGetOrders();
  const [actionLoading, setActionLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Filter orders based on searchTerm (searches userName, userEmail, status, id)
  const filteredSchools = (orders || []).filter((o) => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      (o.userName && o.userName.toLowerCase().includes(q)) ||
      (o.userEmail && o.userEmail.toLowerCase().includes(q)) ||
      (o.status && o.status.toLowerCase().includes(q)) ||
      (o.id && o.id.toLowerCase().includes(q))
    );
  });

  const handleView = (order) => navigate(`/admin/orders/${order.id}`);

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading orders" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading orders: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Orders Manager</h2>
          <p>View all orders</p>
        </div>
        {/* placeholder button kept to preserve structure/styling */}
        <button className={styles.addButton} disabled>
          Orders
        </button>
      </div>

      <div className={styles.controls}>
        {/* legend / status header */}

        <div className={styles.stats}>
          <span>{filteredSchools.length} orders found</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Created</th>
              <th>Status</th>
              <th>Total Qty</th>
              <th>User Email</th>
              <th>User ID</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.map((order) => (
              <tr key={order.id} className={styles.tableRow}>
                <td className={styles.nameCell}>
                  <strong>
                    {order.createdAt && typeof order.createdAt.toDate === 'function'
                      ? order.createdAt.toDate().toLocaleString()
                      : order.createdAt instanceof Date
                      ? order.createdAt.toLocaleString()
                      : ''}
                  </strong>
                </td>
                <td className={styles.descriptionCell}>
                  <span
                    className={
                      styles.statusBadge +
                      ' ' +
                      (order.status === 'pending'
                        ? styles.statusPending
                        : order.status === 'complete'
                        ? styles.statusComplete
                        : '')
                    }
                  >
                    {order.status || ''}
                  </span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{order.totalQty ?? ''}</span>
                </td>

                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{order.userEmail || ''}</span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description + ' ' + styles.mono}>{order.userId || ''}</span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button className={styles.viewButton} onClick={() => handleView(order)}>
                      View order
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSchools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No orders found</p>
        </div>
      )}
    </div>
  );
}

export default SchoolManager;
