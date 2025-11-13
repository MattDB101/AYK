import React, { useState } from 'react';
import RecipeManager from './recipe-manager/RecipeManager';
import SchoolManager from './school-manager/SchoolManager';
import GeneralLearningManager from './general-learning-manager/GeneralLearningManager';
import RecipeBookManager from './recipe-book-manager/RecipeBookManager';
import OrdersManager from './orders-manager/OrdersManager';
import UserManager from './user-manager/UserManager';
import styles from './AdminPanel.module.css';

function AdminPanel() {
  const [activeTab, setActiveTab] = useState('recipes');

  const tabs = [
    { id: 'recipes', label: 'Recipes', component: RecipeManager },
    { id: 'general-learning', label: 'General Learning', component: GeneralLearningManager },
    { id: 'schools', label: 'Schools', component: SchoolManager },
    { id: 'users', label: 'Users', component: UserManager },
    { id: 'recipe-book', label: 'Recipe Book', component: RecipeBookManager },
    { id: 'orders-manager', label: 'Orders Manager', component: OrdersManager },
  ];

  const ActiveComponent = tabs.find((tab) => tab.id === activeTab)?.component;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Admin Panel</h1>
        <p className={styles.subtitle}>Manage your application content</p>
      </div>

      <div className={styles.tabContainer}>
        <nav className={styles.tabNav}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        <div className={styles.tabContent}>{ActiveComponent && <ActiveComponent />}</div>
      </div>
    </div>
  );
}

export default AdminPanel;
