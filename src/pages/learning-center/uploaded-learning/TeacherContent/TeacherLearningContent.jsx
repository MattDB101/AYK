import React, { useState, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../../hooks/useDocument';
import { useTeacherLearningContent } from '../../../../hooks/uploaded-learning/useTeacherLearningContent';
import { AuthContext } from '../../../../context/AuthContext';
import Carousel from '../../../../components/Carousel/Carousel';
import SlideDeck from '../../../../components/SlideDeck/SlideDeck';
import LoadingDots from '../../../../components/LoadingDots/LoadingDots';
import styles from '../../recipe-book/RecipeBook.module.css';

function TeacherLearningContent() {
  const navigate = useNavigate();
  const { uploadedLearningId } = useParams();
  const { user } = useContext(AuthContext);

  // Fetch the main learning content document
  const {
    document: currentLearningContent,
    loading: contentLoading,
    error: contentError,
  } = useDocument(`uploaded-learning/${user?.schoolId}/learning-content`, uploadedLearningId);

  // Use the hook with the content ID
  const {
    learningContent,
    tips,
    videos,
    loading: resourcesLoading,
    error: resourcesError,
  } = useTeacherLearningContent(uploadedLearningId);
  console.log(tips);

  const handleContentClick = (contentId) => {
    // Find the content item by ID in tips or videos
    const allContent = [...tips, ...videos];
    const contentItem = allContent.find((item) => item.id === contentId);

    if (contentItem && contentItem.url) {
      window.open(contentItem.url, '_blank'); // Open the URL in a new tab
    } else {
      console.log('No URL found for content:', contentId);
    }
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
          <button className={styles.backButton} onClick={() => navigate('learning/teacher-content')}>
            ← Back to General Learning
          </button>
          <h1>Learning Content Not Found</h1>
        </div>
        <div className={styles.errorContainer}>
          <p>The learning content you're looking for doesn't exist.</p>
          <button className={styles.backButton} onClick={() => navigate('learning/teacher-content')}>
            ← Back to General Learning
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <button className={styles.backButton} onClick={() => navigate('/learning/teacher-content')}>
          ← Back to General Learning
        </button>
        <h1>Learning Content for {currentLearningContent.name}</h1>
      </div>

      <div className={styles.content}>
        <Carousel
          title="Videos"
          items={videos}
          onItemClick={handleContentClick}
          buttonText="Watch"
          imageField="thumbnailUrl"
          titleField="title"
          descriptionField="description"
        />

        <Carousel
          title="Tips"
          items={[...tips].reverse()}
          onItemClick={handleContentClick}
          imageField="thumbnailUrl"
          titleField="title"
          descriptionField="description"
        />

        <SlideDeck slideDeckPath={`uploaded-learning-slides/${user.schoolId}/${uploadedLearningId}`} />
      </div>
    </div>
  );
}

export default TeacherLearningContent;
