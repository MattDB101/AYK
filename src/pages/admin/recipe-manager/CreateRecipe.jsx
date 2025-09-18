import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipeManager } from '../../../hooks/recipes/useRecipeManager';
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import VideoContentManager from '../../../components/VideoContentManager/VideoContentManager';
import TipContentManager from '../../../components/TipContentManager/TipContentManager';

import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from './RecipeForm.module.css';

function CreateRecipe() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [slides, setSlides] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tips, setTips] = useState([]);
  const [recipeSlides, setRecipeSlides] = useState([]);
  const [recipeCardSlides, setRecipeCardSlides] = useState([]);
  const [workSheetSlides, setWorkSheetSlides] = useState([]);
  const [allergens, setAllergens] = useState([]);

  const { addRecipe, loading, error } = useRecipeManager();

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
      const allContent = [...videos, ...tips];
      await addRecipe(
        { ...formData, allergens },
        imageFile,
        {
          recipeSlides,
          recipeCardSlides,
          workSheetSlides,
        },
        allContent
      );
      alert('Recipe created successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error creating recipe:', error);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Admin Panel
          </button>
          <h1>Add New Recipe</h1>
          <p>Create a new recipe for your collection</p>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>Error: {error}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
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
                placeholder="Enter recipe name"
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
                <option value="" disabled>
                  Select a category
                </option>

                <option value="breakfast">Breakfast</option>
                <option value="lunch">Lunch</option>
                <option value="dinner">Dinner</option>
                <option value="dessert">Dessert</option>
              </select>
            </div>
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
              rows={4}
              placeholder="Describe the recipe..."
            />
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

          {/* Recipe Slides */}
          <SlideDeckUploader slides={recipeSlides} onSlidesChange={setRecipeSlides} label="Recipe Slides" />

          {/* Recipe Card Slides */}
          <SlideDeckUploader
            slides={recipeCardSlides}
            onSlidesChange={setRecipeCardSlides}
            label="Recipe Card Slides"
          />

          {/* Work Sheet Slides */}
          <SlideDeckUploader slides={workSheetSlides} onSlidesChange={setWorkSheetSlides} label="Work Sheet Slides" />

          <VideoContentManager videos={videos} onVideosChange={setVideos} />
          <TipContentManager tips={tips} onTipsChange={setTips} />

          <div className={styles.formGroup}>
            <label>Allergens</label>
            <div className={styles.allergenCheckboxes}>
              {[...Array(14)].map((_, i) => {
                const allergenNumber = i + 1;
                return (
                  <label key={allergenNumber} className={styles.allergenLabel}>
                    <input
                      type="checkbox"
                      value={allergenNumber}
                      checked={allergens.includes(allergenNumber)}
                      onChange={(e) =>
                        setAllergens((prev) =>
                          e.target.checked ? [...prev, allergenNumber] : prev.filter((a) => a !== allergenNumber)
                        )
                      }
                      disabled={loading}
                    />
                    Allergen {allergenNumber}
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {'Add Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateRecipe;
