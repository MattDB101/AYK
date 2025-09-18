import React from 'react';
import styles from './LearningCenter.module.css';
import { useNavigate } from 'react-router-dom';

function LearningCenter() {
  const navigate = useNavigate();

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1>Recipe Book Content</h1>
        <div className={styles.imageContainer}>
          <img src="Recipe Book.jpg" alt="Recipe Book Content" />
        </div>
        <h3>Tailored content for recipes in the All You Knead recipe book.</h3>
        <button className={styles.button} onClick={() => navigate('/learning/recipes')}>
          Go
        </button>
      </div>
      <div className={styles.card}>
        <h1>General Learning Content</h1>
        <div className={styles.imageContainer}>
          <img src="General Content.png" alt="General Content" />
        </div>
        <h3>General learning content for the Home Economics Curriculum.</h3>
        <button className={styles.button} onClick={() => navigate('/learning/general')}>
          Go
        </button>
      </div>
      <div className={styles.card}>
        <h1>Upload Content</h1>
        <div className={styles.imageContainer}>
          <img src="Upload Content.jpg" alt="Upload Content" />
        </div>
        <h3>Upload your own resources for either recipes or general learning content.</h3>
        <button className={styles.button} onClick={() => navigate('/learning/upload')}>
          Go
        </button>
      </div>
    </div>
  );
}

export default LearningCenter;
