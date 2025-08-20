import React, { useState, useEffect } from 'react';
import { projectStorage } from '../../firebase/config';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import LoadingDots from '../LoadingDots/LoadingDots';
import styles from './SlideDeck.module.css';

function SlideDeck({ slideDeckPath }) {
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadSlides = async () => {
      if (!slideDeckPath) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Create reference to the slides folder
        const slidesRef = ref(projectStorage, `slides/${slideDeckPath}`);

        // List all items in the slides folder
        const listResult = await listAll(slidesRef);

        if (listResult.items.length === 0) {
          setError('No slides found');
          setLoading(false);
          return;
        }

        // Sort items by name to maintain order (01.png, 02.png, etc.)
        const sortedItems = listResult.items.sort((a, b) => {
          const aNum = parseInt(a.name.split('.')[0]);
          const bNum = parseInt(b.name.split('.')[0]);
          return aNum - bNum;
        });

        // Get download URLs for all slides
        const slidePromises = sortedItems.map(async (item) => {
          const url = await getDownloadURL(item);
          return {
            url,
            name: item.name,
          };
        });

        const loadedSlides = await Promise.all(slidePromises);
        setSlides(loadedSlides);
        setLoading(false);
      } catch (err) {
        console.error('Error loading slides:', err);
        setError('Failed to load slides');
        setLoading(false);
      }
    };

    loadSlides();
  }, [slideDeckPath]);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  if (loading) {
    return (
      <div className={styles.slideDeckContainer}>
        <h2 className={styles.title}>Slide Deck</h2>
        <div className={styles.loadingState}>
          <LoadingDots text="Loading slides" />
        </div>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className={styles.slideDeckContainer}>
        <h2 className={styles.title}>Slide Deck</h2>
        <div className={styles.emptyState}>
          <p>{error || 'No slides available for this content.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.slideDeckContainer}>
      <h2 className={styles.title}>Slide Deck</h2>

      <div className={styles.slideContainer}>
        <button
          className={styles.navButton}
          onClick={prevSlide}
          disabled={slides.length <= 1}
        >
          ◀
        </button>

        <div className={styles.slide}>
          <div className={styles.slideImageContainer}>
            <img
              src={slides[currentSlide].url}
              alt={`Slide ${currentSlide + 1}`}
              className={styles.slideImage}
            />
          </div>
        </div>

        <button
          className={styles.navButton}
          onClick={nextSlide}
          disabled={slides.length <= 1}
        >
          ▶
        </button>
      </div>

      {/* Slide indicators (dots) */}
      {slides.length > 1 && (
        <div className={styles.slideIndicators}>
          {slides.map((_, index) => (
            <button
              key={index}
              className={`${styles.indicator} ${
                currentSlide === index ? styles.active : ''
              }`}
              onClick={() => goToSlide(index)}
            />
          ))}
        </div>
      )}

      {/* Slide counter */}
      <div className={styles.slideCounter}>
        {currentSlide + 1} of {slides.length}
      </div>
    </div>
  );
}

export default SlideDeck;
