import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeneralLearning } from '../../../hooks/learning-resources/useGeneralLearning';
import { useGeneralLearningManager } from '../../../hooks/learning-resources/useGeneralLearningManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-manager/RecipeManager.module.css';

function GeneralLearningManager() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { groupedLearningContent, loading: learningLoading, error: learningError } = useGeneralLearning();
  const { deleteGeneralLearning, loading: actionLoading, error: actionError } = useGeneralLearningManager();

  // Flatten all learning content for display
  const allLearningContent = [
    ...(groupedLearningContent.safety || []),
    ...(groupedLearningContent.techniques || []),
    ...(groupedLearningContent.management || []),
  ];

  // Filter learning content based on search
  const filteredLearningContent = allLearningContent.filter(
    (learningItem) =>
      learningItem.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      learningItem.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (learningItem) => {
    navigate(`/admin/general-learning/edit/${learningItem.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/general-learning/create');
  };

  const handleDelete = async (learningItem) => {
    if (window.confirm(`Are you sure you want to delete "${learningItem.name}"?`)) {
      try {
        await deleteGeneralLearning(learningItem.id, learningItem.imageUrl, learningItem.slideDeckPath);
        alert('Learning content deleted successfully!');
      } catch (error) {
        alert('Error deleting learning content: ' + error.message);
      }
    }
  };

  if (learningLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading learning content" />
      </div>
    );
  }

  if (learningError) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading learning content: {learningError}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>General Learning Manager</h2>
        </div>
        <button className={styles.addButton} onClick={handleCreate} disabled={actionLoading}>
          + Add New Learning Content
        </button>
      </div>

      {actionError && <div className={styles.errorBanner}>Error: {actionError}</div>}

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search learning content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.stats}>
          <span>{filteredLearningContent.length} learning items found</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Image</th>
              <th>Name</th>
              <th>Category</th>
              <th>Description</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLearningContent.map((learningItem) => (
              <tr key={learningItem.id} className={styles.tableRow}>
                <td className={styles.imageCell}>
                  <img
                    src={learningItem.imageUrl || '/default-recipe.png'}
                    alt={learningItem.name}
                    className={styles.recipeImage}
                    onError={(e) => {
                      e.target.src = '/default-recipe.png';
                    }}
                  />
                </td>
                <td className={styles.nameCell}>
                  <strong>{learningItem.name}</strong>
                </td>
                <td className={styles.categoryCell}>
                  <span className={`${styles.categoryBadge} ${styles[learningItem.category]}`}>
                    {learningItem.category}
                  </span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{learningItem.description}</span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button
                      className={styles.editButton}
                      onClick={() => handleEdit(learningItem)}
                      disabled={actionLoading}
                    >
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(learningItem)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredLearningContent.length === 0 && (
        <div className={styles.emptyState}>
          <p>No learning content found</p>
          <button className={styles.addButton} onClick={handleCreate}>
            Add Your First Learning Content
          </button>
        </div>
      )}
    </div>
  );
}

export default GeneralLearningManager;
