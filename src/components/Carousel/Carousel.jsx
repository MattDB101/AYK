import React, { useState } from 'react';
import styles from './Carousel.module.css';

function Carousel({
  title,
  items = [],
  onItemClick,
  buttonText,
  itemsPerView = 3,
  imageField = 'imageUrl',
  titleField = 'name',
  descriptionField = 'description',
}) {
  const [currentPosition, setCurrentPosition] = useState(0);

  const maxPosition = Math.max(0, items.length - itemsPerView);
  const canGoLeft = currentPosition > 0;
  const canGoRight = currentPosition < maxPosition;
  const showArrows = items.length > itemsPerView;

  const handleNav = (direction) => {
    if (direction === 'next') {
      setCurrentPosition(Math.min(currentPosition + 1, maxPosition));
    } else {
      setCurrentPosition(Math.max(currentPosition - 1, 0));
    }
  };

  if (items.length === 0) {
    return (
      <div className={styles.categorySection}>
        <h2 className={styles.categoryTitle}>{title}</h2>
        <div className={styles.emptyState}>
          <p>No {title.toLowerCase()} available</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.categorySection}>
      <h2 className={styles.categoryTitle}>{title}</h2>

      <div className={styles.carouselWrapper}>
        <button
          className={`${styles.arrowButton} ${styles.arrowLeft} ${
            !canGoLeft ? styles.disabled : ''
          } ${!showArrows ? styles.invisible : ''}`}
          onClick={() => handleNav('prev')}
          disabled={!canGoLeft || !showArrows}
        >
          ◀
        </button>

        <div className={styles.carouselContainer}>
          <div className={styles.recipeCarousel}>
            <div
              className={styles.recipeTrack}
              style={{
                transform: `translateX(-${
                  currentPosition * (100 / itemsPerView)
                }%)`,
              }}
            >
              {items.map((item) => (
                <div key={item.id} className={styles.recipeCard}>
                  <div className={styles.recipeImageContainer}>
                    <img
                      src={
                        item[imageField] ||
                        item.thumbnailUrl ||
                        '/default-video-thumbnail.png'
                      }
                      alt={item[titleField] || item.title}
                      className={styles.recipeImage}
                      onError={(e) => {
                        e.target.src = '/default-video-thumbnail.png';
                      }}
                    />
                  </div>
                  <div className={styles.recipeInfo}>
                    <h3 className={styles.recipeName}>
                      {item[titleField] || item.title}
                    </h3>
                    <p className={styles.recipeDescription}>
                      {item[descriptionField] || item.description}
                    </p>
                    {buttonText && (
                      <button
                        className={styles.viewMoreButton}
                        onClick={() => onItemClick && onItemClick(item.id)}
                      >
                        {buttonText}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          className={`${styles.arrowButton} ${styles.arrowRight} ${
            !canGoRight ? styles.disabled : ''
          } ${!showArrows ? styles.invisible : ''}`}
          onClick={() => handleNav('next')}
          disabled={!canGoRight || !showArrows}
        >
          ▶
        </button>
      </div>
    </div>
  );
}

export default Carousel;
