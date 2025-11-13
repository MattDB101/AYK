import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '../../hooks/useAuthContext';
import styles from './Dashboard.module.css';

import Toolbar from '../../components/Toolbar/Toolbar';
import useSchoolClasses from '../../hooks/useSchoolClasses';
import useClassOrder from '../../hooks/useClassOrder';

export default function Dashboard() {
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  // prefer claim location but fall back to top-level (safe)
  const schoolId = user?.claims?.schoolId || user?.schoolId;
  const { classes: classesList, loading: loadingClasses } = useSchoolClasses(schoolId);
  const { classOrder, loading: loadingClassOrder } = useClassOrder(selectedClass.id);
  const firstName = useMemo(() => (user?.displayName ? user.displayName.split(' ')[0] : 'Teacher'), [user]);

  // ensure a class is selected when the user first lands — pick the first class available
  useEffect(() => {
    if (!selectedClass && Array.isArray(classesList) && classesList.length > 0) {
      setSelectedClass(classesList[0]);
    }
  }, [classesList, selectedClass]);

  // helper to convert possible Firestore Timestamp / Date / number / string into a Date or null
  const toDateObj = (ts) => {
    if (!ts) return null;
    if (typeof ts === 'object' && ts !== null && typeof ts.toDate === 'function') {
      const d = ts.toDate();
      return isNaN(d.getTime()) ? null : d;
    }
    if (ts instanceof Date) return isNaN(ts.getTime()) ? null : ts;
    if (typeof ts === 'number') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
    if (typeof ts === 'string') {
      const d = new Date(ts);
      return isNaN(d.getTime()) ? null : d;
    }
    return null;
  };

  // build timeline from classOrder timestamps (only include entries with valid dates)
  const timeline = useMemo(() => {
    if (!classOrder) return [];
    const entries = [];
    const add = (field, text) => {
      const d = toDateObj(classOrder[field]);
      if (d) entries.push({ date: d, text });
    };

    add('createdAt', 'We have received your order.');
    add('processedAt', 'Your order is being processed.');
    add('shippedAt', 'Your order is out for delivery!');
    add('deliveredAt', 'Your order has been delivered.');

    // sort ascending by date
    entries.sort((a, b) => a.date - b.date);

    // format for rendering
    return entries.map((e) => ({ time: e.date.toLocaleString(), text: e.text }));
  }, [classOrder]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (!search) return;
    navigate(`/learning?query=${encodeURIComponent(search)}`);
  };

  // console.log(classesList);
  // selectedClass may be an object (from your current code)

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.centerDashboard}>
        <header className={styles.header}>
          <div>
            <h2 className={styles.welcome}>Welcome back, {firstName}!</h2>
            <p className={styles.sub}>This is your dashboard for {selectedClass?.name || 'your class'}.</p>

            {/* show latest classOrder summary */}
            <div style={{ marginTop: 6, fontSize: 13, color: '#496b3e' }}>
              {loadingClassOrder
                ? 'Checking class order…'
                : classOrder
                ? `Latest class order: ${classOrder.status || 'unknown'} — ${classOrder.totalQty ?? 0} items`
                : 'No active class order'}
            </div>
          </div>
          <div className={styles.headerActions}>
            {loadingClasses ? (
              <div className={styles.switchClass} aria-hidden>
                Loading classes...
              </div>
            ) : schoolId ? (
              <select
                className={styles.switchClass}
                value={selectedClass}
                onChange={(e) => setSelectedClass(classesList.find((c) => c.id === e.target.value) || null)}
                aria-label="Switch class"
              >
                <option value="">{`Switch class`}</option>
                {classesList.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name || `Class ${c.id}`}
                  </option>
                ))}
              </select>
            ) : (
              <button
                className={styles.switchClass}
                onClick={() => navigate('/settings/classes')}
                aria-label="Switch class"
              >
                Switch class ▾
              </button>
            )}
          </div>
        </header>

        <section className={styles.grid}>
          <article className={styles.card}>
            <div className={styles.cardTitle}>
              <h3>Delivery Progress - {classOrder?.recipeName}</h3>
              <button className={styles.help}>?</button>
            </div>
            <div className={styles.deliveryCardContainer}>
              <div className={styles.deliveryCardDetails}>
                <ol className={styles.timeline}>
                  {timeline.map((item, idx) => (
                    <li key={idx} className={styles.timelineItem}>
                      <div className={styles.time}>{item.time}</div>
                      <div className={styles.message}>{item.text}</div>
                    </li>
                  ))}
                </ol>
              </div>
              <div className={styles.deliveryCardImage}>
                <img src="./delivery_image.png" alt="Delivery illustration" />
              </div>
            </div>
          </article>

          {/* New image-only card */}
          <article className={styles.card}>
            <div className={styles.cardImageOnly}>
              <img src="./card.png" alt="Card" className={styles.cardImage} />
            </div>
          </article>

          <article className={styles.card}>
            <div className={styles.quickAccessInner}>
              <div className={styles.quickAccessText}>
                <h3>Learning Centre Quick Access</h3>
                <p>Looking for a recipe or resource?</p>
                <p>Search for keywords and you will be directed to relevant content!</p>
              </div>
              <div className={styles.searchContainer}>
                <form className={styles.searchForm} onSubmit={handleSearch}>
                  <input
                    className={styles.searchInput}
                    placeholder="Search learning centre..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    aria-label="Search learning centre"
                  />
                  <button className={styles.searchButton} type="submit">
                    Go
                  </button>
                </form>

                <div className={styles.quickAccessImage}>
                  <img src="./search.png" alt="Learning illustration" />
                </div>
              </div>
            </div>
          </article>
        </section>
      </div>
      <div className={styles.rightMenu}>
        <div className={styles.toolbarOverride}>
          <Toolbar />
        </div>
      </div>
    </div>
  );
}
