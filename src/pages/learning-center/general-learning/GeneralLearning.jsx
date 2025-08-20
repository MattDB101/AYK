import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGeneralLearning } from '../../../hooks/learning-resources/useGeneralLearning';
import Carousel from '../../../components/Carousel/Carousel';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-book/RecipeBook.module.css';

function RecipeBookLearning() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const { groupedLearningContent, loading, error } = useGeneralLearning();

  const handleRecipeClick = (contentId) => {
    navigate(`/learning/general/${contentId}`);
  };

  const filteredContent = {
    safety:
      groupedLearningContent.safety?.filter((content) =>
        content.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
    techniques:
      groupedLearningContent.techniques?.filter((content) =>
        content.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
    management:
      groupedLearningContent.management?.filter((content) =>
        content.name.toLowerCase().includes(searchTerm.toLowerCase())
      ) || [],
  };

  // Loading state
  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading: {error}</p>
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
            placeholder="Search Content..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
          <button className={styles.searchButton}>🔍</button>
        </div>
      </div>

      <div className={styles.content}>
        <Carousel
          title="Kitchen Safety & Hygiene"
          items={filteredContent.safety}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />

        <Carousel
          title="Cooking Techniques"
          items={filteredContent.techniques}
          onItemClick={handleRecipeClick}
          buttonText="View more"
          imageField="imageUrl"
          titleField="name"
          descriptionField="description"
        />

        <Carousel
          title="Time Management In The Kitchen"
          items={filteredContent.management}
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
