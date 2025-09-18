import { useState } from 'react';
import { projectStorage } from '../firebase/config';
import { ref, uploadBytes, deleteObject, listAll } from 'firebase/storage';

export const useRecipeBookManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload slides to /recipe-book-slides/
  const uploadRecipeBookSlides = async (slides) => {
    if (!slides || slides.length === 0) return null;
    const basePath = `recipe-book-slides`;

    // Delete existing slides if they exist
    try {
      const existingSlidesRef = ref(projectStorage, basePath);
      const existingSlides = await listAll(existingSlidesRef);
      for (const item of existingSlides.items) {
        await deleteObject(item);
      }
    } catch (err) {
      // Ignore if folder doesn't exist
    }

    // Upload new slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideNumber = (i + 1).toString().padStart(2, '0');
      const slideRef = ref(projectStorage, `${basePath}/${slideNumber}.png`);
      await uploadBytes(slideRef, slide.file);
    }
    return basePath;
  };

  // Update the recipe book slides
  const updateRecipeBook = async (slides) => {
    setLoading(true);
    setError(null);
    try {
      await uploadRecipeBookSlides(slides);
      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    updateRecipeBook,
    loading,
    error,
  };
};
