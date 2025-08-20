import React, { useState, useEffect } from 'react';
import { useRecipeManager } from '../../../hooks/recipes/useRecipeManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-manager/RecipeForm.module.css';

function RecipeForm({ recipe, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'breakfast',
    slideDeckPath: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const { addRecipe, updateRecipe, loading, error } = useRecipeManager();

  // Populate form when editing
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        description: recipe.description || '',
        category: recipe.category || 'breakfast',
        slideDeckPath: recipe.slideDeckPath || '',
      });
      setImagePreview(recipe.imageUrl || null);
    }
  }, [recipe]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (recipe) {
        // Update existing recipe
        await updateRecipe(recipe.id, formData, imageFile);
        alert('Recipe updated successfully!');
      } else {
        // Add new recipe
        await addRecipe(formData, imageFile);
        alert('Recipe added successfully!');
      }
      onSuccess();
    } catch (error) {
      console.error('Error saving recipe:', error);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{recipe ? 'Edit Recipe' : 'Add New Recipe'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            ×
          </button>
        </div>

        {error && <div className={styles.errorBanner}>Error: {error}</div>}

        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Recipe Name *</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              required
              disabled={loading}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="category">Category *</label>
            <select
              id="category"
              name="category"
              value={formData.category}
              onChange={handleInputChange}
              required
              disabled={loading}
            >
              <option value="breakfast">Breakfast</option>
              <option value="lunch">Lunch</option>
              <option value="dinner">Dinner</option>
              <option value="dessert">Dessert</option>
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={loading}
              rows={3}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="slideDeckPath">Slide Deck Path</label>
            <input
              type="text"
              id="slideDeckPath"
              name="slideDeckPath"
              value={formData.slideDeckPath}
              onChange={handleInputChange}
              disabled={loading}
              placeholder="e.g., chicken and bacon"
            />
            <small>Path to the slide deck folder in Firebase Storage</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">Recipe Image</label>
            <input type="file" id="image" accept="image/*" onChange={handleImageChange} disabled={loading} />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? (
                <LoadingDots text={recipe ? 'Updating' : 'Adding'} />
              ) : recipe ? (
                'Update Recipe'
              ) : (
                'Add Recipe'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default RecipeForm;
