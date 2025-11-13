import { useState } from 'react';
import { projectFirestore, projectStorage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export const useRecipeManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload content thumbnails (handles both videos and tips)
  const uploadContentThumbnails = async (recipeId, content) => {
    const updatedContent = [];

    for (const item of content) {
      let itemData = { ...item };

      // Upload custom thumbnail if provided
      if (item.thumbnailFile) {
        try {
          const timestamp = Date.now();
          const fileExtension = item.thumbnailFile.name.split('.').pop();
          const thumbnailFileName = `${recipeId}_${item.type}_${item.id}_${timestamp}.${fileExtension}`;

          const thumbnailRef = ref(projectStorage, `recipe-content-thumbnails/${thumbnailFileName}`);
          await uploadBytes(thumbnailRef, item.thumbnailFile);
          const thumbnailUrl = await getDownloadURL(thumbnailRef);

          itemData.thumbnailUrl = thumbnailUrl;
          itemData.thumbnailStoragePath = `recipe-content-thumbnails/${thumbnailFileName}`;

          console.log(`Thumbnail uploaded successfully: ${thumbnailUrl}`);
        } catch (err) {
          console.error('Error uploading thumbnail:', err);
          // Continue without custom thumbnail
        }
      }

      // Remove the file object before storing in database
      delete itemData.thumbnailFile;
      updatedContent.push(itemData);
    }

    return updatedContent;
  };

  // Save content to recipe subcollection (handles both videos and tips)
  const saveContent = async (recipeId, content) => {
    if (!content || content.length === 0) return;

    // Upload thumbnails and clean data
    const processedContent = await uploadContentThumbnails(recipeId, content);

    // Save each content item as a document in the content subcollection
    for (const item of processedContent) {
      console.log('Processing item:', item);

      // Start with base content data
      const contentData = {
        title: item.title,
        description: item.description,
        type: item.type || 'video',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Add thumbnailUrl and storage path if they exist
      if (item.thumbnailUrl) {
        contentData.thumbnailUrl = item.thumbnailUrl;
      }

      if (item.thumbnailStoragePath) {
        contentData.thumbnailStoragePath = item.thumbnailStoragePath;
      }

      // Only add URL field for videos
      if (item.type === 'video' && item.hasOwnProperty('url') && item.url && item.url.trim() !== '') {
        contentData.url = item.url;
      }

      console.log('Saving content data to Firestore:', contentData);

      await projectFirestore
        .collection('recipes')
        .doc(recipeId)
        .collection('content')
        .doc(item.id.toString())
        .set(contentData);
    }
  };

  // Delete content with thumbnail cleanup
  const deleteContent = async (recipeId, contentId, thumbnailStoragePath) => {
    try {
      // Delete thumbnail from storage if exists using storage path
      if (thumbnailStoragePath) {
        try {
          const thumbnailRef = ref(projectStorage, thumbnailStoragePath);
          await deleteObject(thumbnailRef);
          console.log(`Deleted thumbnail: ${thumbnailStoragePath}`);
        } catch (err) {
          console.warn('Could not delete thumbnail:', err);
        }
      }

      // Delete document from subcollection
      await projectFirestore
        .collection('recipes')
        .doc(recipeId)
        .collection('content')
        .doc(contentId.toString())
        .delete();

      console.log(`Deleted content: ${contentId}`);
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // Upload slides to storage for a given path
  const uploadSlides = async (recipeName, slides, baseFolder = 'slides') => {
    if (!slides || slides.length === 0) return null;
    const recipeFolder = recipeName.toLowerCase().replace(/\s+/g, '-');
    const basePath = `${baseFolder}/${recipeFolder}`;

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

  // Add a new recipe
  const addRecipe = async (recipeData, imageFile, allSlides = {}, content = []) => {
    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;
      let slideDeckPath = null;
      let recipeCardSlidePath = null;
      let workSheetSlidePath = null;

      // Upload main recipe image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `recipes/${recipeData.category}/${recipeData.name.toLowerCase().replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Upload slides for each type
      // Recipe Slides (main)
      if (allSlides.recipeSlides && allSlides.recipeSlides.length > 0) {
        slideDeckPath = await uploadSlides(recipeData.name, allSlides.recipeSlides, 'slides');
      }
      // Recipe Card Slides
      if (allSlides.recipeCardSlides && allSlides.recipeCardSlides.length > 0) {
        recipeCardSlidePath = await uploadSlides(recipeData.name, allSlides.recipeCardSlides, 'recipe-card-slides');
      }
      // Work Sheet Slides
      if (allSlides.workSheetSlides && allSlides.workSheetSlides.length > 0) {
        workSheetSlidePath = await uploadSlides(recipeData.name, allSlides.workSheetSlides, 'worksheet-slides');
      }

      // Create recipe document
      const recipeDoc = {
        ...recipeData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (imageUrl) recipeDoc.imageUrl = imageUrl;
      if (slideDeckPath) recipeDoc.slideDeckPath = slideDeckPath;
      if (recipeCardSlidePath) recipeDoc.recipeCardSlidePath = recipeCardSlidePath;
      if (workSheetSlidePath) recipeDoc.workSheetSlidePath = workSheetSlidePath;

      const docRef = await projectFirestore.collection('recipes').add(recipeDoc);

      // Save content (videos and tips)
      if (content.length > 0) {
        await saveContent(docRef.id, content);
      }

      setLoading(false);
      return { id: docRef.id, ...recipeDoc };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Update a recipe
  const updateRecipe = async (id, recipeData, imageFile, allSlides = {}, content = []) => {
    setLoading(true);
    setError(null);

    try {
      let imageUrl = recipeData.imageUrl;
      let slideDeckPath = recipeData.slideDeckPath;
      let recipeCardSlidePath = recipeData.recipeCardSlidePath;
      let workSheetSlidePath = recipeData.workSheetSlidePath;

      // Upload new main image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `recipes/${recipeData.category}/${recipeData.name.toLowerCase().replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Upload slides for each type
      if (allSlides.recipeSlides && allSlides.recipeSlides.length > 0) {
        slideDeckPath = await uploadSlides(recipeData.name, allSlides.recipeSlides, 'slides');
      }
      if (allSlides.recipeCardSlides && allSlides.recipeCardSlides.length > 0) {
        recipeCardSlidePath = await uploadSlides(recipeData.name, allSlides.recipeCardSlides, 'recipe-card-slides');
      }
      if (allSlides.workSheetSlides && allSlides.workSheetSlides.length > 0) {
        workSheetSlidePath = await uploadSlides(recipeData.name, allSlides.workSheetSlides, 'worksheet-slides');
      }

      // Update recipe document
      const updateData = {
        name: recipeData.name,
        description: recipeData.description,
        allergens: recipeData.allergens,
        category: recipeData.category,
        updatedAt: new Date(),
      };

      if (imageUrl !== undefined && imageUrl !== null) {
        updateData.imageUrl = imageUrl;
      }
      if (slideDeckPath !== undefined && slideDeckPath !== null) {
        updateData.slideDeckPath = slideDeckPath;
      }
      if (recipeCardSlidePath !== undefined && recipeCardSlidePath !== null) {
        updateData.recipeCardSlidePath = recipeCardSlidePath;
      }
      if (workSheetSlidePath !== undefined && workSheetSlidePath !== null) {
        updateData.workSheetSlidePath = workSheetSlidePath;
      }

      await projectFirestore.collection('recipes').doc(id).update(updateData);

      // Handle content updates with proper thumbnail preservation & cleanup
      if (content.length > 0) {
        // Fetch existing content docs
        const existingContentSnapshot = await projectFirestore
          .collection('recipes')
          .doc(id)
          .collection('content')
          .get();

        const existingContent = {};
        existingContentSnapshot.docs.forEach((doc) => {
          existingContent[doc.id] = doc.data();
        });

        // First upload any new thumbnails and clean data
        const processedContent = await uploadContentThumbnails(id, content);

        for (const item of processedContent) {
          // Start with item data returned from uploadContentThumbnails
          let itemData = { ...item };

          // Preserve existing thumbnail if no new thumbnail was uploaded for this item
          if (existingContent[item.id] && (!itemData.thumbnailStoragePath || itemData.thumbnailStoragePath === '')) {
            itemData.thumbnailUrl = existingContent[item.id].thumbnailUrl;
            itemData.thumbnailStoragePath = existingContent[item.id].thumbnailStoragePath;
          }

          // If a new thumbnail was uploaded and an old thumbnail exists, delete the old one
          if (
            itemData.thumbnailStoragePath &&
            existingContent[item.id] &&
            existingContent[item.id].thumbnailStoragePath &&
            existingContent[item.id].thumbnailStoragePath !== itemData.thumbnailStoragePath
          ) {
            try {
              const oldThumbRef = ref(projectStorage, existingContent[item.id].thumbnailStoragePath);
              await deleteObject(oldThumbRef);
            } catch (err) {
              console.warn('Could not delete old thumbnail:', err);
            }
          }

          // Ensure no File/Blob objects are saved to Firestore
          if ('thumbnailFile' in itemData) {
            delete itemData.thumbnailFile;
          }

          // Save/update the content document (merge to avoid overwriting other fields)
          await projectFirestore
            .collection('recipes')
            .doc(id)
            .collection('content')
            .doc(item.id.toString())
            .set(itemData, { merge: true });
        }

        // Delete any items that were removed (and their thumbnails)
        for (const existingId of Object.keys(existingContent)) {
          if (!processedContent.find((item) => item.id.toString() === existingId)) {
            await deleteContent(id, existingId, existingContent[existingId].thumbnailStoragePath);
          }
        }
      }

      setLoading(false);
      return { id, ...updateData };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Delete a recipe
  const deleteRecipe = async (id, imageUrl, slideDeckPath) => {
    setLoading(true);
    setError(null);

    try {
      // Delete main image from storage if it exists
      if (imageUrl) {
        try {
          const imageRef = ref(projectStorage, imageUrl);
          await deleteObject(imageRef);
        } catch (imgError) {
          console.warn('Could not delete main image:', imgError);
        }
      }

      // Delete slides from storage if they exist
      if (slideDeckPath) {
        try {
          const slidesRef = ref(projectStorage, slideDeckPath);
          const slidesList = await listAll(slidesRef);

          for (const item of slidesList.items) {
            await deleteObject(item);
          }
        } catch (slideError) {
          console.warn('Could not delete slides:', slideError);
        }
      }

      // Delete content subcollection with thumbnail cleanup
      try {
        const contentCollection = await projectFirestore.collection('recipes').doc(id).collection('content').get();

        for (const doc of contentCollection.docs) {
          const data = doc.data();
          await deleteContent(id, doc.id, data.thumbnailStoragePath);
        }
      } catch (contentError) {
        console.warn('Could not delete content:', contentError);
      }

      // Delete recipe document
      await projectFirestore.collection('recipes').doc(id).delete();

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    addRecipe,
    updateRecipe,
    deleteRecipe,
    loading,
    error,
  };
};
