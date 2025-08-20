import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useRecipes } from '../../../hooks/recipes/useRecipes';
import Carousel from '../../../components/Carousel/Carousel';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from './RecipeBook.module.css';

function RecipeBookLearning() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { groupedRecipes, loading, error } = useRecipes();

  const handleRecipeClick = (recipeId) => {
    navigate(`/learning/recipes/${recipeId}`);
  };

  // Filter recipes based on search term
  const filteredRecipes = {
    breakfast:
      groupedRecipes.breakfast?.filter((recipe) => recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) || [],
    lunch: groupedRecipes.lunch?.filter((recipe) => recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) || [],
    dinner:
      groupedRecipes.dinner?.filter((recipe) => recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) || [],
    dessert:
      groupedRecipes.dessert?.filter((recipe) => recipe.name.toLowerCase().includes(searchTerm.toLowerCase())) || [],
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading recipes" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading recipes: {error}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/learning')}>
          ← Back to Learning Center
        </button>
        <h1>Recipe Book Content</h1>

        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>🔍</button>
        </div>
      </div>
      <p className={styles.subtitle}>Content for your previously ordered recipes</p>

      <div className={styles.content}>
        <Carousel
          title="Breakfast Recipes"
          items={filteredRecipes.breakfast}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />

        <Carousel
          title="Lunch Recipes"
          items={filteredRecipes.lunch}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />

        <Carousel
          title="Dinner Recipes"
          items={filteredRecipes.dinner}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />

        <Carousel
          title="Dessert Recipes"
          items={filteredRecipes.dessert}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />
      </div>
    </div>
  );
}

export default RecipeBookLearning;
