import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthContext } from '../../../hooks/useAuthContext';
import { useUploadedLearningManager } from '../../../hooks/uploaded-learning/useUploadedLearningManager';
import { useTeacherSchoolClasses } from '../../../hooks/useTeacherSchoolClasses';
import { projectFirestore } from '../../../firebase/config';
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import VideoContentManager from '../../../components/VideoContentManager/VideoContentManager';
import TipContentManager from '../../../components/TipContentManager/TipContentManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from './uploadedLearningStyles.module.css';

function EditUploadedLearning() {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { uploadedLearningId } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    targetClasses: [],
    targetClassNames: [],
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [slides, setSlides] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tips, setTips] = useState([]);
  const [contentLoading, setContentLoading] = useState(true);
  const [uploadedLearning, setUploadedLearning] = useState(null);
  const [learningLoading, setLearningLoading] = useState(true);
  const [learningError, setLearningError] = useState(null);

  const { updateUploadedLearning, loading: updateLoading, error: updateError } = useUploadedLearningManager();
  const { classes, schoolInfo, loading: classesLoading, error: classesError } = useTeacherSchoolClasses();

  // Load the learning content document
  useEffect(() => {
    const loadLearningContent = async () => {
      if (!uploadedLearningId || !user) return;

      try {
        setLearningLoading(true);
        const doc = await projectFirestore
          .collection('uploaded-learning')
          .doc(user.schoolId)
          .collection('learning-content')
          .doc(uploadedLearningId)
          .get();

        if (doc.exists) {
          setUploadedLearning({ id: doc.id, ...doc.data() });
        } else {
          setLearningError('Learning content not found');
        }
      } catch (err) {
        console.error('Error loading learning content:', err);
        setLearningError(err.message);
      } finally {
        setLearningLoading(false);
      }
    };

    loadLearningContent();
  }, [uploadedLearningId, user]);

  // Load all existing content (videos and tips together)
  useEffect(() => {
    const loadAllContent = async () => {
      if (!uploadedLearningId || !user) return;

      try {
        setContentLoading(true);

        // Get all content from the subcollection
        const contentSnapshot = await projectFirestore
          .collection('uploaded-learning')
          .doc(user.schoolId)
          .collection('learning-content')
          .doc(uploadedLearningId)
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
  }, [uploadedLearningId, user]);

  // Populate form when learning content loads
  useEffect(() => {
    if (uploadedLearning && classes.length > 0) {
      // Reconstruct targetClassNames from targetClasses and available classes
      const targetClassNames = (uploadedLearning.targetClasses || [])
        .map((classId) => {
          const classObj = classes.find((cls) => cls.id === classId);
          return classObj?.name || '';
        })
        .filter((name) => name !== '');

      setFormData({
        name: uploadedLearning.name || '',
        description: uploadedLearning.description || '',
        category: uploadedLearning.category || '',
        targetClasses: uploadedLearning.targetClasses || [],
        targetClassNames: targetClassNames,
      });
      setImagePreview(uploadedLearning.imageUrl || null);
    }
  }, [uploadedLearning, classes]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // Only reset classes if category changes, not for other inputs
    if (name === 'category') {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
        targetClasses: [],
        targetClassNames: [],
      }));
    } else {
      // For other inputs, just update that field
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
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

  const handleClassSelection = (e) => {
    const classId = e.target.value;
    const isChecked = e.target.checked;

    // Find the class object to get the name
    const selectedClass = classes.find((cls) => cls.id === classId);

    setFormData((prev) => {
      if (isChecked) {
        // Add class ID and name
        return {
          ...prev,
          targetClasses: [...prev.targetClasses, classId],
          targetClassNames: [...prev.targetClassNames, selectedClass?.name || ''],
        };
      } else {
        // Remove class ID and name
        const classIndex = prev.targetClasses.indexOf(classId);
        const newClassNames = [...prev.targetClassNames];
        if (classIndex > -1) {
          newClassNames.splice(classIndex, 1);
        }

        return {
          ...prev,
          targetClasses: prev.targetClasses.filter((id) => id !== classId),
          targetClassNames: newClassNames,
        };
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      // Combine videos and tips into a single content array
      const allContent = [...videos, ...tips];
      console.log('All content being sent to update:', allContent);

      // Add class names string AND school info to form data
      const submissionData = {
        ...formData,
        classNames: formData.targetClassNames.join(', '), // Convert array to comma-separated string
        schoolId: schoolInfo?.id || uploadedLearning.schoolId, // Use current or existing
        schoolName: schoolInfo?.name || uploadedLearning.schoolName, // Use current or existing
      };

      console.log('Submission data:', submissionData); // Debug log

      await updateUploadedLearning(uploadedLearningId, submissionData, imageFile, slides, allContent);
      alert('Learning content updated successfully!');
      navigate('/learning/upload');
    } catch (error) {
      console.error('Error updating learning content:', error);
    }
  };

  const handleCancel = () => {
    navigate('/learning/upload');
  };

  if (learningLoading || contentLoading || classesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading learning content" />
        </div>
      </div>
    );
  }

  if (learningError || !uploadedLearning) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error loading learning content: {learningError || 'Learning content not found'}</p>
          <button onClick={() => navigate('/learning/upload')}>Back to Learning Content</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Learning Content
          </button>
          <h1>Edit Learning Content</h1>
          {schoolInfo && <p>Editing content for: {schoolInfo.name}</p>}
        </div>
      </div>

      {updateError && <div className={styles.errorBanner}>Error: {updateError}</div>}
      {classesError && <div className={styles.errorBanner}>Classes Error: {classesError}</div>}

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
            <label>Select Classes *</label>
            <div className={styles.classSelection}>
              {classes.length > 0 ? (
                classes.map((classItem) => (
                  <label key={classItem.id} className={styles.classCheckbox}>
                    <input
                      type="checkbox"
                      value={classItem.id}
                      checked={formData.targetClasses.includes(classItem.id)}
                      onChange={handleClassSelection}
                      disabled={updateLoading}
                    />
                    <span>
                      {classItem.name} ({classItem.pupilCount} pupils)
                    </span>
                  </label>
                ))
              ) : (
                <p>No classes available in your school.</p>
              )}
            </div>
            {formData.targetClassNames.length > 0 && (
              <div className={styles.selectedClasses}>
                <small>Selected: {formData.targetClassNames.join(', ')}</small>
              </div>
            )}
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

          <SlideDeckUploader slides={slides} onSlidesChange={setSlides} />
          {uploadedLearning.slideDeckPath && slides.length === 0 && (
            <div className={styles.existingSlidesNote}>
              <p>📁 This learning content has existing slides. Upload new slides above to replace them.</p>
            </div>
          )}

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

export default EditUploadedLearning;
