import React, { useState, useEffect } from 'react';
import { projectStorage } from '../../firebase/config';
import { ref, getDownloadURL, listAll } from 'firebase/storage';
import LoadingDots from '../LoadingDots/LoadingDots';
import styles from './SlideDeck.module.css';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import DownloadIcon from '../icons/download-02';

function SlideDeck({ slideDeckPath, title, allowDownload }) {
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
        const slidesRef = ref(projectStorage, slideDeckPath);

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
    setCurrentSlide((prev) => (prev < slides.length - 1 ? prev + 1 : prev));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev > 0 ? prev - 1 : prev));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  const downloadSlides = async () => {
    const zip = new JSZip();
    console.log('Downloading slides:', slides);
    for (let idx = 0; idx < slides.length; idx++) {
      const slide = slides[idx];
      // Fetch the image as a blob (requires CORS to be set up)
      const response = await fetch(slide.url);
      const blob = await response.blob();
      zip.file(`slide-${idx + 1}.png`, blob);
    }

    const content = await zip.generateAsync({ type: 'blob' });
    saveAs(content, `${title || 'slides'}.zip`);
  };

  if (loading) {
    return (
      <div className={styles.slideDeckContainer}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.loadingState}>
          <LoadingDots text="Loading" />
        </div>
      </div>
    );
  }

  if (error || slides.length === 0) {
    return (
      <div className={styles.slideDeckContainer}>
        <h2 className={styles.title}>{title}</h2>
        <div className={styles.emptyState}>
          <p>{error || 'No slides available for this content.'}</p>
        </div>
      </div>
    );
  }

  return (
    <div id={title} className={styles.slideDeckContainer}>
      <div className={styles.downloadContainer}>
        <h2 className={styles.title}>{title}</h2>
        {allowDownload && (
          <div
            onClick={downloadSlides}
            className={styles.downloadIconContainer}
          >
            <DownloadIcon />

            <span>Download Worksheet</span>
          </div>
        )}
      </div>

      <div className={styles.slideContainer}>
        <button
          className={styles.navButton}
          onClick={prevSlide}
          disabled={currentSlide === 0}
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
          disabled={currentSlide === slides.length - 1}
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
