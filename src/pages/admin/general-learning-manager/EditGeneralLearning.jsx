import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDocument } from '../../../hooks/useDocument';
import { useGeneralLearningManager } from '../../../hooks/learning-resources/useGeneralLearningManager';
import { projectFirestore } from '../../../firebase/config';
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import VideoContentManager from '../../../components/VideoContentManager/VideoContentManager';
import TipContentManager from '../../../components/TipContentManager/TipContentManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-manager/RecipeForm.module.css';

function EditGeneralLearning() {
  const navigate = useNavigate();
  const { generalLearningId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [slides, setSlides] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tips, setTips] = useState([]);

  const [contentLoading, setContentLoading] = useState(true);

  const {
    document: generalLearning,
    loading: learningLoading,
    error: learningError,
  } = useDocument('general-learning', generalLearningId);
  const { updateGeneralLearning, loading: updateLoading, error: updateError } = useGeneralLearningManager();

  // Load all existing content (videos and tips together)
  useEffect(() => {
    const loadAllContent = async () => {
      if (!generalLearningId) return;

      try {
        setContentLoading(true);

        // Get all content from the subcollection
        const contentSnapshot = await projectFirestore
          .collection('general-learning')
          .doc(generalLearningId)
          .collection('content')
          .get();

        const allContent = contentSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        console.log('Loaded content from Firestore:', allContent);

        // Separate by type
        const existingVideos = allContent.filter((item) => item.type === 'video');
        const existingTips = allContent.filter((item) => item.type === 'tip');

        console.log('Separated videos:', existingVideos);
        console.log('Separated tips:', existingTips);

        setVideos(existingVideos);
        setTips(existingTips);
      } catch (err) {
        console.error('Error loading content:', err);
      } finally {
        setContentLoading(false);
      }
    };

    loadAllContent();
  }, [generalLearningId]);

  // Populate form when general learning content loads
  useEffect(() => {
    if (generalLearning) {
      setFormData({
        name: generalLearning.name || '',
        description: generalLearning.description || '',
        category: generalLearning.category || '',
      });
      setImagePreview(generalLearning.imageUrl || null);
    }
  }, [generalLearning]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setImagePreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Combine videos and tips into a single content array
      const allContent = [...videos, ...tips];
      console.log('All content being sent to update:', allContent);
      await updateGeneralLearning(generalLearningId, formData, imageFile, slides, allContent);
      alert('Learning content updated successfully!');
      navigate('/admin');
    } catch (error) {
      console.error('Error updating learning content:', error);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (learningLoading || contentLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading learning content" />
        </div>
      </div>
    );
  }

  if (learningError || !generalLearning) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading learning content: {learningError || 'Learning content not found'}</p>
          <button onClick={() => navigate('/admin')}>Back to Admin Panel</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Admin Panel
          </button>
          <h1>Edit Learning Content</h1>
          <p>Update learning content information</p>
        </div>
      </div>

      {updateError && <div className={styles.errorBanner}>Error: {updateError}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Learning Content Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={updateLoading}
                placeholder="Enter learning content name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="category">Category *</label>
              <select
                id="category"
                name="category"
                value={formData.category}
                onChange={handleInputChange}
                required
                disabled={updateLoading}
              >
                <option value="" disabled>
                  Select a category
                </option>
                <option value="safety">Kitchen Safety & Hygiene</option>
                <option value="techniques">Cooking Techniques</option>
                <option value="management">Time Management</option>
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="description">Description *</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
              disabled={updateLoading}
              rows={4}
              placeholder="Describe the learning content..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="image">Learning Content Image</label>
            <input type="file" id="image" accept="image/*" onChange={handleImageChange} disabled={updateLoading} />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
                <small>{imageFile ? 'New image selected' : 'Current image'}</small>
              </div>
            )}
          </div>
          {generalLearning.slideDeckPath && slides.length === 0 && (
            <div className={styles.existingSlidesNote}>
              <p>📁 This learning content has existing slides. Upload new slides below to replace them.</p>
            </div>
          )}
          <SlideDeckUploader slides={slides} onSlidesChange={setSlides} />

          <VideoContentManager videos={videos} onVideosChange={setVideos} />
          <TipContentManager tips={tips} onTipsChange={setTips} />

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={updateLoading}>
              Update Learning Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditGeneralLearning;
