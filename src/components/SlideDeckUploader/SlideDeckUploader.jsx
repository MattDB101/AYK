import React, { useState } from 'react';
import styles from './SlideDeckUploader.module.css';

function SlideDeckUploader({ slides, onSlidesChange }) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (files) => {
    const imageFiles = Array.from(files).filter((file) =>
      file.type.startsWith('image/')
    );

    if (imageFiles.length === 0) {
      alert('Please select only image files (PNG, JPG, etc.)');
      return;
    }

    const newSlides = imageFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
    }));

    onSlidesChange([...slides, ...newSlides]);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    handleFileSelect(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleInputChange = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      handleFileSelect(files);
    }
  };

  const removeSlide = (slideId) => {
    const updatedSlides = slides.filter((slide) => slide.id !== slideId);
    onSlidesChange(updatedSlides);
  };

  const moveSlide = (fromIndex, toIndex) => {
    const updatedSlides = [...slides];
    const [movedSlide] = updatedSlides.splice(fromIndex, 1);
    updatedSlides.splice(toIndex, 0, movedSlide);
    onSlidesChange(updatedSlides);
  };

  const clearAllSlides = () => {
    if (window.confirm('Are you sure you want to remove all slides?')) {
      onSlidesChange([]);
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>Slide Deck ({slides.length} slides)</h3>
          <p>Upload image files to create a slide deck for this recipe</p>
        </div>
        {slides.length > 0 && (
          <button
            type="button"
            className={styles.clearButton}
            onClick={clearAllSlides}
          >
            Clear All
          </button>
        )}
      </div>

      {/* Upload Area */}
      <div
        className={`${styles.uploadArea} ${dragOver ? styles.dragOver : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('slide-file-input').click()}
      >
        <div className={styles.uploadContent}>
          <div className={styles.uploadIcon}>📁</div>
          <p className={styles.uploadText}>
            Drop image files here or click to browse
          </p>
          <p className={styles.uploadSubtext}>
            Supports: PNG, JPG, JPEG, GIF, WebP
          </p>
        </div>
        <input
          id="slide-file-input"
          type="file"
          multiple
          accept="image/*"
          onChange={handleInputChange}
          className={styles.hiddenInput}
        />
      </div>

      {/* Slides Preview */}
      {slides.length > 0 && (
        <div className={styles.slidesContainer}>
          <h4 className={styles.previewTitle}>Slide Preview</h4>
          <div className={styles.slidesGrid}>
            {slides.map((slide, index) => (
              <div key={slide.id} className={styles.slideCard}>
                <div className={styles.slideNumber}>Slide {index + 1}</div>

                <div className={styles.slidePreview}>
                  <img
                    src={slide.preview}
                    alt={`Slide ${index + 1}`}
                    className={styles.slideImage}
                  />
                </div>

                <div className={styles.slideInfo}>
                  <p className={styles.slideName}>{slide.name}</p>
                  <div className={styles.slideActions}>
                    <button
                      type="button"
                      className={styles.moveButton}
                      onClick={() => moveSlide(index, Math.max(0, index - 1))}
                      disabled={index === 0}
                      title="Move up"
                    >
                      ↑
                    </button>
                    <button
                      type="button"
                      className={styles.moveButton}
                      onClick={() =>
                        moveSlide(index, Math.min(slides.length - 1, index + 1))
                      }
                      disabled={index === slides.length - 1}
                      title="Move down"
                    >
                      ↓
                    </button>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => removeSlide(slide.id)}
                      title="Remove slide"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {slides.length === 0 && (
        <div className={styles.emptyState}>
          <p>No slides uploaded yet</p>
          <small>
            Upload image files to create a slide deck for step-by-step
            instructions
          </small>
        </div>
      )}
    </div>
  );
}

export default SlideDeckUploader;
