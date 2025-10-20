import { useState } from 'react';
import { projectFirestore, projectStorage } from '../../firebase/config';
import { ref, uploadBytes, getDownloadURL, deleteObject, listAll } from 'firebase/storage';
import { useAuthContext } from '../useAuthContext';

export const useUploadedLearningManager = () => {
  const { user } = useAuthContext();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Upload content thumbnails with proper storage tracking
  const uploadContentThumbnails = async (uploadedLearningId, content) => {
    const updatedContent = [];

    for (const item of content) {
      let itemData = { ...item };

      // Upload custom thumbnail if provided
      if (item.thumbnailFile) {
        try {
          // Create a unique filename for the thumbnail
          const timestamp = Date.now();
          const fileExtension = item.thumbnailFile.name.split('.').pop();
          const thumbnailFileName = `${user.uid}_${uploadedLearningId}_${item.type}_${item.id}_${timestamp}.${fileExtension}`;

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

  // Save content to user's learning content subcollection
  const saveContent = async (uploadedLearningId, content) => {
    if (!content || content.length === 0 || !user) return;

    // Upload thumbnails and clean data
    const processedContent = await uploadContentThumbnails(uploadedLearningId, content);

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
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .doc(uploadedLearningId)
        .collection('content')
        .doc(item.id.toString())
        .set(contentData);
    }
  };

  // Delete content with proper thumbnail cleanup
  const deleteContent = async (uploadedLearningId, contentId, thumbnailStoragePath) => {
    if (!user) return;

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
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .doc(uploadedLearningId)
        .collection('content')
        .doc(contentId.toString())
        .delete();

      console.log(`Deleted content: ${contentId}`);
    } catch (err) {
      console.error('Error deleting content:', err);
    }
  };

  // Upload slides to storage
  const uploadSlides = async (uploadedLearningId, slides) => {
    if (!slides || slides.length === 0 || !user) return null;

    const slideFolderPath = `${user.schoolId}/${uploadedLearningId}`;

    try {
      const existingSlidesRef = ref(projectStorage, `uploaded-learning-slides/${slideFolderPath}`);
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
      const slideRef = ref(projectStorage, `uploaded-learning-slides/${slideFolderPath}/${slideNumber}.png`);

      try {
        await uploadBytes(slideRef, slide.file);
        console.log(`Uploaded slide ${slideNumber} to uploaded-learning-slides/${slideFolderPath}/${slideNumber}.png`);
      } catch (err) {
        console.error(`Error uploading slide ${slideNumber}:`, err);
        throw new Error(`Failed to upload slide ${slideNumber}`);
      }
    }

    return slideFolderPath;
  };

  // Add new learning content
  const addUploadedLearning = async (uploadedLearningData, imageFile, slides = [], content = []) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = null;
      let slideDeckPath = null;

      // Upload main learning image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `uploaded-learning/${user.uid}/${uploadedLearningData.category}/${uploadedLearningData.name
            .toLowerCase()
            .replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Create learning document first to get ID
      const uploadedLearningDoc = {
        ...uploadedLearningData,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (imageUrl) {
        uploadedLearningDoc.imageUrl = imageUrl;
      }

      console.log('Creating document with data:', uploadedLearningDoc);

      const docRef = await projectFirestore
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .add(uploadedLearningDoc);

      // Upload slides if provided (using the doc ID)
      if (slides.length > 0) {
        slideDeckPath = await uploadSlides(docRef.id, slides);
        // Update document with slide path
        await docRef.update({ slideDeckPath });
      }

      // Save content with proper thumbnail handling
      if (content.length > 0) {
        await saveContent(docRef.id, content);
      }

      setLoading(false);
      return { id: docRef.id, ...uploadedLearningDoc, slideDeckPath };
    } catch (err) {
      console.error('Create error:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Update learning content
  const updateUploadedLearning = async (id, uploadedLearningData, imageFile, slides = [], content = []) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

    setLoading(true);
    setError(null);

    try {
      let imageUrl = uploadedLearningData.imageUrl;
      let slideDeckPath = uploadedLearningData.slideDeckPath;

      // Upload new main image if provided
      if (imageFile) {
        const imageRef = ref(
          projectStorage,
          `uploaded-learning/${user.uid}/${uploadedLearningData.category}/${uploadedLearningData.name
            .toLowerCase()
            .replace(/\s+/g, '-')}`
        );
        const uploadResult = await uploadBytes(imageRef, imageFile);
        imageUrl = await getDownloadURL(uploadResult.ref);
      }

      // Handle slide updates
      if (slides.length > 0) {
        slideDeckPath = await uploadSlides(id, slides);
      }

      // Update learning document - only include defined fields
      const updateData = {
        name: uploadedLearningData.name,
        description: uploadedLearningData.description,
        category: uploadedLearningData.category,
        targetClasses: uploadedLearningData.targetClasses || [],
        classNames: uploadedLearningData.classNames || '',
        updatedAt: new Date(),
      };

      // Only add schoolId and schoolName if they are defined
      if (uploadedLearningData.schoolId !== undefined && uploadedLearningData.schoolId !== null) {
        updateData.schoolId = uploadedLearningData.schoolId;
      }

      if (uploadedLearningData.schoolName !== undefined && uploadedLearningData.schoolName !== null) {
        updateData.schoolName = uploadedLearningData.schoolName;
      }

      if (imageUrl !== undefined && imageUrl !== null) {
        updateData.imageUrl = imageUrl;
      }

      if (slideDeckPath !== undefined && slideDeckPath !== null) {
        updateData.slideDeckPath = slideDeckPath;
      }

      console.log('Final update data being sent to Firestore:', updateData);

      await projectFirestore
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .doc(id)
        .update(updateData);

      // Handle content updates with proper thumbnail cleanup
      if (content.length > 0) {
        // Delete all existing content first (with thumbnail cleanup)
        const existingContent = await projectFirestore
          .collection('uploaded-learning')
          .doc(user.schoolId)
          .collection('learning-content')
          .doc(id)
          .collection('content')
          .get();

        for (const doc of existingContent.docs) {
          const data = doc.data();
          await deleteContent(id, doc.id, data.thumbnailStoragePath);
        }

        // Save new content
        await saveContent(id, content);
      }

      setLoading(false);
      return { id, ...updateData };
    } catch (err) {
      console.error('Update error:', err);
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  // Delete learning content
  const deleteUploadedLearning = async (id, imageUrl, slideDeckPath) => {
    if (!user) {
      throw new Error('User not authenticated');
    }

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
          const slidesRef = ref(projectStorage, `uploaded-learning-slides/${slideDeckPath}`);
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
          .collection('uploaded-learning')
          .doc(user.schoolId)
          .collection('learning-content')
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

      // Delete learning document
      await projectFirestore
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .doc(id)
        .delete();

      setLoading(false);
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return {
    addUploadedLearning,
    updateUploadedLearning,
    deleteUploadedLearning,
    loading,
    error,
  };
};
