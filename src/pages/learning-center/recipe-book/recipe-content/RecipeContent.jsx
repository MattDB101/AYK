import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../../hooks/useDocument';
import { useRecipeContent } from '../../../../hooks/recipes/useRecipeContent';
import Carousel from '../../../../components/Carousel/Carousel';
import SlideDeck from '../../../../components/SlideDeck/SlideDeck';
import LoadingDots from '../../../../components/LoadingDots/LoadingDots';
import styles from '../RecipeBook.module.css';

function RecipeContent() {
  const navigate = useNavigate();
  const { recipeId } = useParams();

  // Get the specific recipe by ID
  const { document: currentRecipe, loading: recipeLoading, error: recipeError } = useDocument('recipes', recipeId);

  // Get the recipe's subcollection content (tips and videos)
  const { content, loading: contentLoading, error: contentError } = useRecipeContent(recipeId);

  const handleContentClick = (contentId) => {
    console.log('Clicked content:', contentId);
    // navigate(`/learning/recipes/${recipeId}/content/${contentId}`);
  };

  // Loading state - wait for both recipe and content to load
  if (recipeLoading || contentLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading recipe content" />
        </div>
      </div>
    );
  }

  // Error state
  if (recipeError || contentError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading recipe: {recipeError || contentError}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  // If recipe not found
  if (!currentRecipe) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/learning/recipes')}>
            ← Back to Recipe Book
          </button>
          <h1>Recipe Not Found</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>The recipe you're looking for doesn't exist.</p>
          <button className={styles.backButton} onClick={() => navigate('/learning/recipes')}>
            ← Back to Recipe Book
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/learning/recipes')}>
          ← Back to Recipe Book
        </button>
        <h1>Recipe Book Content for {currentRecipe.name}</h1>
      </div>

      <div className={styles.content}>
        <Carousel
          title="Videos"
          items={content.videos || []}
          onItemClick={handleContentClick}
          buttonText="Watch"
          imageField="thumbnailUrl"
          titleField="title"
          descriptionField="description"
        />

        <Carousel
          title="Tips"
          items={[...(content.tips || [])].reverse()}
          onItemClick={handleContentClick}
          imageField="thumbnailUrl"
          titleField="title"
          descriptionField="description"
        />

        <SlideDeck slideDeckPath={currentRecipe.slideDeckPath} />
      </div>
    </div>
  );
}

export default RecipeContent;
