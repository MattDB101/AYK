import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import styles from './RecipeBook.module.css';
import { useRecipeBookManager } from '../../../hooks/useRecipeBookManager';

function RecipeBookManager() {
  const [recipeBookSlides, setRecipeBookSlides] = useState([]);
  const { updateRecipeBook, loading: updateLoading, error: updateError } = useRecipeBookManager();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRecipeBook(recipeBookSlides);
      alert('Recipe book updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating recipe book:', error);
    }
  };

  return (
    <div>
      {updateError && <div className={styles.errorBanner}>Error: {updateError}</div>}
      <form onSubmit={handleSubmit}>
        <h1>Recipe Book Manager</h1>
        <SlideDeckUploader slides={recipeBookSlides} onSlidesChange={setRecipeBookSlides} label="Recipe Book Slides" />
        <button type="submit" className={styles.saveButton} disabled={updateLoading}>
          {'Update Recipe Book'}
        </button>
      </form>
    </div>
  );
}

export default RecipeBookManager;
