import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../../hooks/useDocument';
import { useGeneralLearningContent } from '../../../../hooks/learning-resources/useGeneralLearningContent';
import Carousel from '../../../../components/Carousel/Carousel';
import SlideDeck from '../../../../components/SlideDeck/SlideDeck';
import LoadingDots from '../../../../components/LoadingDots/LoadingDots';
import styles from '../../recipe-book/RecipeBook.module.css';

function GeneralLearningContent() {
  const navigate = useNavigate();
  const { generalLearningId } = useParams();

  // Get the specific learning content by ID
  const {
    document: currentLearningContent,
    loading: contentLoading,
    error: contentError,
  } = useDocument('general-learning', generalLearningId);

  // Get the learning content's subcollection content (tips and videos)
  const { content, loading: resourcesLoading, error: resourcesError } = useGeneralLearningContent(generalLearningId);

  const handleContentClick = (contentId) => {
    console.log('Clicked content:', contentId);
    // navigate(`/learning/general/${generalLearningId}/content/${contentId}`);
  };

  // Loading state - wait for both learning content and resources to load
  if (contentLoading || resourcesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading learning content" />
        </div>
      </div>
    );
  }

  // Error state
  if (contentError || resourcesError) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading learning content: {contentError || resourcesError}</p>
          <button onClick={() => window.location.reload()}>Try Again</button>
        </div>
      </div>
    );
  }

  // If learning content not found
  if (!currentLearningContent) {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <button className={styles.backButton} onClick={() => navigate('/learning/general')}>
            ← Back to General Learning
          </button>
          <h1>Learning Content Not Found</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>The learning content you're looking for doesn't exist.</p>
          <button className={styles.backButton} onClick={() => navigate('/learning/general')}>
            ← Back to General Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/learning/general')}>
          ← Back to General Learning
        </button>
        <h1>Learning Content for {currentLearningContent.name}</h1>
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

        <SlideDeck slideDeckPath={currentLearningContent.slideDeckPath} />
      </div>
    </div>
  );
}

export default GeneralLearningContent;
