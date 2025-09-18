import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../hooks/useDocument';
import { useRecipeManager } from '../../../hooks/recipes/useRecipeManager';
import { projectFirestore } from '../../../firebase/config';
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import VideoContentManager from '../../../components/VideoContentManager/VideoContentManager';
import TipContentManager from '../../../components/TipContentManager/TipContentManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from './RecipeForm.module.css';

function EditRecipe() {
  const navigate = useNavigate();
  const { recipeId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'breakfast',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [videos, setVideos] = useState([]);
  const [tips, setTips] = useState([]);
  const [recipeSlides, setRecipeSlides] = useState([]);
  const [recipeCardSlides, setRecipeCardSlides] = useState([]);
  const [workSheetSlides, setWorkSheetSlides] = useState([]);
  const [allergens, setAllergens] = useState([]); // array of numbers 1-14

  const [videosLoading, setVideosLoading] = useState(true);
  const [tipsLoading, setTipsLoading] = useState(true);

  const { document: recipe, loading: recipeLoading, error: recipeError } = useDocument('recipes', recipeId);
  const { updateRecipe, loading: updateLoading, error: updateError } = useRecipeManager();

  // Load existing video content
  useEffect(() => {
    const loadVideoContent = async () => {
      if (!recipeId) return;

      try {
        setVideosLoading(true);
        const contentSnapshot = await projectFirestore
          .collection('recipes')
          .doc(recipeId)
          .collection('content')
          .where('type', '==', 'video')
          .get();

        const existingVideos = contentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setVideos(existingVideos);
      } catch (err) {
        console.error('Error loading video content:', err);
      } finally {
        setVideosLoading(false);
      }
    };

    loadVideoContent();
  }, [recipeId]);

  // Load existing tip content
  useEffect(() => {
    const loadTipContent = async () => {
      if (!recipeId) return;

      try {
        setTipsLoading(true);
        const contentSnapshot = await projectFirestore
          .collection('recipes')
          .doc(recipeId)
          .collection('content')
          .where('type', '==', 'tip')
          .get();

        const existingTips = contentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        setTips(existingTips);
      } catch (err) {
        console.error('Error loading tip content:', err);
      } finally {
        setTipsLoading(false);
      }
    };

    loadTipContent();
  }, [recipeId]);

  // Populate form when recipe loads
  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        description: recipe.description || '',
        category: recipe.category || '',
      });
      setImagePreview(recipe.imageUrl || null);
      setAllergens(recipe.allergens || []);
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
      const allContent = [...videos, ...tips];
      await updateRecipe(
        recipeId,
        { ...formData, allergens },
        imageFile,
        {
          recipeSlides,
          recipeCardSlides,
          workSheetSlides,
        },

        allContent
      );
      alert('Recipe updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating recipe:', error);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (recipeLoading || videosLoading || tipsLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading recipe" />
        </div>
      </div>
    );
  }

  if (recipeError || !recipe) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading recipe: {recipeError || 'Recipe not found'}</p>
          <button onClick={() => navigate('/admin')}>Back to Admin Panel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Admin Panel
          </button>
          <h1>Edit Recipe</h1>
          <p>Update recipe information</p>
        </div>
      </div>

      {updateError && <div className={styles.errorBanner}>Error: {updateError}</div>}

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
                disabled={updateLoading}
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
                disabled={updateLoading}
              >
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
              disabled={updateLoading}
              rows={4}
              placeholder="Describe the recipe..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">Recipe Image</label>
            <input type="file" id="image" accept="image/*" onChange={handleImageChange} disabled={updateLoading} />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <small>{imageFile ? 'New image selected' : 'Current image'}</small>
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
                      onChange={(e) => {
                        setAllergens((prev) =>
                          e.target.checked ? [...prev, allergenNumber] : prev.filter((a) => a !== allergenNumber)
                        );
                      }}
                      disabled={updateLoading}
                    />
                    Allergen {allergenNumber}
                  </label>
                );
              })}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={updateLoading}>
              {'Update Recipe'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditRecipe;
