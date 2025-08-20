import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../../../hooks/recipes/useRecipes';
import { useRecipeManager } from '../../../hooks/recipes/useRecipeManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from './RecipeManager.module.css';

function RecipeManager() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const { groupedRecipes, loading: recipesLoading, error: recipesError } = useRecipes();
  const { deleteRecipe, loading: actionLoading, error: actionError } = useRecipeManager();

  // Flatten all recipes for display
  const allRecipes = [
    ...(groupedRecipes.breakfast || []),
    ...(groupedRecipes.lunch || []),
    ...(groupedRecipes.dinner || []),
    ...(groupedRecipes.dessert || []),
  ];

  // Filter recipes based on search
  const filteredRecipes = allRecipes.filter(
    (recipe) =>
      recipe.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      recipe.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (recipe) => {
    navigate(`/admin/recipes/edit/${recipe.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/recipes/create');
  };

  const handleDelete = async (recipe) => {
    if (window.confirm(`Are you sure you want to delete "${recipe.name}"?`)) {
      try {
        await deleteRecipe(recipe.id, recipe.imageUrl);
        alert('Recipe deleted successfully!');
      } catch (error) {
        alert('Error deleting recipe: ' + error.message);
      }
    }
  };

  if (recipesLoading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading recipes" />
      </div>
    );
  }

  if (recipesError) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading recipes: {recipesError}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>Recipe Manager</h2>
        </div>
        <button className={styles.addButton} onClick={handleCreate} disabled={actionLoading}>
          + Add New Recipe
        </button>
      </div>

      {actionError && <div className={styles.errorBanner}>Error: {actionError}</div>}

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.stats}>
          <span>{filteredRecipes.length} recipes found</span>
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
            {filteredRecipes.map((recipe) => (
              <tr key={recipe.id} className={styles.tableRow}>
                <td className={styles.imageCell}>
                  <img
                    src={recipe.imageUrl || '/default-recipe.png'}
                    alt={recipe.name}
                    className={styles.recipeImage}
                    onError={(e) => {
                      e.target.src = '/default-recipe.png';
                    }}
                  />
                </td>
                <td className={styles.nameCell}>
                  <strong>{recipe.name}</strong>
                </td>
                <td className={styles.categoryCell}>
                  <span className={`${styles.categoryBadge} ${styles[recipe.category]}`}>{recipe.category}</span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{recipe.description}</span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button className={styles.editButton} onClick={() => handleEdit(recipe)} disabled={actionLoading}>
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(recipe)}
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

      {filteredRecipes.length === 0 && (
        <div className={styles.emptyState}>
          <p>No recipes found</p>
          <button className={styles.addButton} onClick={handleCreate}>
            Add Your First Recipe
          </button>
        </div>
      )}
    </div>
  );
}

export default RecipeManager;
