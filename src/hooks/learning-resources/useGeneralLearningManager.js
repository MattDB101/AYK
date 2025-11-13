import { useState } from 'react';
import { projectFirestore, projectStorage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';

export const useGeneralLearningManager = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload content thumbnails with proper storage tracking
  const uploadContentThumbnails = async (generalLearningId, content) => {
    const updatedContent = [];

    for (const item of content) {
      let itemData = { ...item };

      // Upload custom thumbnail if provided
      if (item.thumbnailFile) {
        try {
          // Create a unique filename for the thumbnail
          const timestamp = Date.now();
          const fileExtension = item.thumbnailFile.name.split('.').pop();
          const thumbnailFileName = `${generalLearningId}_${item.type}_${item.id}_${timestamp}.${fileExtension}`;

          const thumbnailRef = ref(projectStorage, `learning-content-thumbnails/${thumbnailFileName}`);

          console.log(`Uploading thumbnail: ${thumbnailFileName}`);
          await uploadBytes(thumbnailRef, item.thumbnailFile);
          const thumbnailUrl = await getDownloadURL(thumbnailRef);

          itemData.thumbnailUrl = thumbnailUrl;
          itemData.thumbnailStoragePath = `learning-content-thumbnails/${thumbnailFileName}`;

          console.log(`Thumbnail uploaded successfully: ${thumbnailUrl}`);
        } catch (err) {
          console.error('Error uploading thumbnail:', err);
          // Continue without custom thumbnail but log the error
        }
      }

      // Remove the file object before storing in database
      delete itemData.thumbnailFile;
      updatedContent.push(itemData);
    }

    return updatedContent;
  };

  // Save content to general learning subcollection
  const saveContent = async (generalLearningId, content) => {
    if (!content || content.length === 0) return;

    // Upload thumbnails and clean data
    const processedContent = await uploadContentThumbnails(generalLearningId, content);

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
        .collection('general-learning')
        .doc(generalLearningId)
        .collection('content')
        .doc(item.id.toString())
        .set(contentData);
    }
  };

  // Delete content with proper thumbnail cleanup
  const deleteContent = async (generalLearningId, contentId, thumbnailStoragePath) => {
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
        .collection('general-learning')
        .doc(generalLearningId)
        .collection('content')
        .doc(contentId.toString())
        .delete();

      console.log(`Deleted content: ${contentId}`);
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // Upload slides to storage
  const uploadSlides = async (generalLearningId, generalLearningName, slides) => {
    if (!slides || slides.length === 0) return null;

    const slideFolderPath = generalLearningName.toLowerCase().replace(/\s+/g, '-');

    // Delete existing slides if they exist
    try {
      const existingSlidesRef = ref(projectStorage, `learning-slides/${slideFolderPath}`);
      const existingSlides = await listAll(existingSlidesRef);

      // Delete all existing slides
      for (const item of existingSlides.items) {
        await deleteObject(item);
      }
    } catch (err) {
      console.log('No existing slides to delete or error deleting:', err);
    }

    // Upload new slides
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const slideNumber = (i + 1).toString().padStart(2, '0');
      const slideRef = ref(projectStorage, `learning-slides/${slideFolderPath}/${slideNumber}.png`);

      try {
        await uploadBytes(slideRef, slide.file);
        console.log(`Uploaded slide ${slideNumber} to learning-slides/${slideFolderPath}/${slideNumber}.png`);
      } catch (err) {
        console.error(`Error uploading slide ${slideNumber}:`, err);
        throw new Error(`Failed to upload slide ${slideNumber}`);
      }
    }

    return slideFolderPath;
  };

  // Add new general learning content
  const addGeneralLearning = async (generalLearningData, imageFile, slides = [], content = []) => {
    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;
      let slideDeckPath = null;

      // Upload main general learning image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `general-learning/${generalLearningData.category}/${generalLearningData.name
            .toLowerCase()
            .replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Upload slides if provided
      if (slides.length > 0) {
        slideDeckPath = await uploadSlides(null, generalLearningData.name, slides);
      }

      // Create general learning document
      const generalLearningDoc = {
        ...generalLearningData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (imageUrl) {
        generalLearningDoc.imageUrl = imageUrl;
      }

      if (slideDeckPath) {
        generalLearningDoc.slideDeckPath = slideDeckPath;
      }

      const docRef = await projectFirestore.collection('general-learning').add(generalLearningDoc);

      // Save content with proper thumbnail handling
      if (content.length > 0) {
        await saveContent(docRef.id, content);
      }

      setLoading(false);
      return { id: docRef.id, ...generalLearningDoc };
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Update general learning content
  const updateGeneralLearning = async (id, generalLearningData, imageFile, slides = [], content = []) => {
    setLoading(true);
    setError(null);

    try {
      let imageUrl = generalLearningData.imageUrl;
      let slideDeckPath = generalLearningData.slideDeckPath;

      // Upload new main image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `general-learning/${generalLearningData.category}/${generalLearningData.name
            .toLowerCase()
            .replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Handle slide updates
      if (slides.length > 0) {
        slideDeckPath = await uploadSlides(id, generalLearningData.name, slides);
      }

      // Update general learning document
      const updateData = {
        name: generalLearningData.name,
        description: generalLearningData.description,
        category: generalLearningData.category,
        updatedAt: new Date(),
      };

      if (imageUrl !== undefined && imageUrl !== null) {
        updateData.imageUrl = imageUrl;
      }

      if (slideDeckPath !== undefined && slideDeckPath !== null) {
        updateData.slideDeckPath = slideDeckPath;
      }

      await projectFirestore.collection('general-learning').doc(id).update(updateData);

      // Handle content updates with proper thumbnail preservation & cleanup
      if (content.length > 0) {
        // Fetch existing content docs
        const existingSnapshot = await projectFirestore
          .collection('general-learning')
          .doc(id)
          .collection('content')
          .get();

        const existingContent = {};
        existingSnapshot.docs.forEach((doc) => {
          existingContent[doc.id] = doc.data();
        });

        // Upload any new thumbnails and remove File objects
        const processedContent = await uploadContentThumbnails(id, content);

        // Upsert each content item, preserving thumbnails when not replaced
        for (const item of processedContent) {
          const itemId = item.id.toString();
          const itemData = {
            title: item.title,
            description: item.description,
            type: item.type || 'video',
            updatedAt: new Date(),
          };

          // If thumbnail was uploaded, item.thumbnailUrl and thumbnailStoragePath will be set by uploadContentThumbnails
          if (item.thumbnailUrl) itemData.thumbnailUrl = item.thumbnailUrl;
          if (item.thumbnailStoragePath) itemData.thumbnailStoragePath = item.thumbnailStoragePath;

          // Preserve existing thumbnail if none provided for this item
          if (
            existingContent[itemId] &&
            !itemData.thumbnailStoragePath &&
            existingContent[itemId].thumbnailStoragePath
          ) {
            itemData.thumbnailUrl = existingContent[itemId].thumbnailUrl;
            itemData.thumbnailStoragePath = existingContent[itemId].thumbnailStoragePath;
          }

          // Only include url for videos
          if (item.type === 'video' && item.url && item.url.trim() !== '') {
            itemData.url = item.url;
          }

          // Save/update the content document (merge to avoid overwriting other fields)
          await projectFirestore
            .collection('general-learning')
            .doc(id)
            .collection('content')
            .doc(itemId)
            .set(itemData, { merge: true });

          // If a new thumbnail replaced an old one, delete the old storage object
          if (
            itemData.thumbnailStoragePath &&
            existingContent[itemId] &&
            existingContent[itemId].thumbnailStoragePath &&
            existingContent[itemId].thumbnailStoragePath !== itemData.thumbnailStoragePath
          ) {
            try {
              const oldThumbRef = ref(projectStorage, existingContent[itemId].thumbnailStoragePath);
              await deleteObject(oldThumbRef);
            } catch (err) {
              console.warn('Could not delete old thumbnail:', err);
            }
          }
        }

        // Delete any items that were removed
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

  // Delete general learning content
  const deleteGeneralLearning = async (id, imageUrl, slideDeckPath) => {
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
          const slidesRef = ref(projectStorage, `learning-slides/${slideDeckPath}`);
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
        const contentCollection = await projectFirestore
          .collection('general-learning')
          .doc(id)
          .collection('content')
          .get();

        for (const doc of contentCollection.docs) {
          const data = doc.data();
          await deleteContent(id, doc.id, data.thumbnailStoragePath);
        }
      } catch (contentError) {
        console.warn('Could not delete content:', contentError);
      }

      // Delete general learning document
      await projectFirestore.collection('general-learning').doc(id).delete();

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    addGeneralLearning,
    updateGeneralLearning,
    deleteGeneralLearning,
    loading,
    error,
  };
};
