import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUploadedLearningManager } from '../../../hooks/uploaded-learning/useUploadedLearningManager';
import { useTeacherSchoolClasses } from '../../../hooks/useTeacherSchoolClasses';
import { useAuthContext } from '../../../hooks/useAuthContext'; // Add this import
import SlideDeckUploader from '../../../components/SlideDeckUploader/SlideDeckUploader';
import VideoContentManager from '../../../components/VideoContentManager/VideoContentManager';
import TipContentManager from '../../../components/TipContentManager/TipContentManager';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';

import styles from './UploadedLearningStyles.module.css';

function CreateUploadedLearning() {
  const navigate = useNavigate();
  const { user } = useAuthContext(); // Add this
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    targetClasses: [],
    targetClassNames: [], // Add this to store class names
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [slides, setSlides] = useState([]);
  const [videos, setVideos] = useState([]);
  const [tips, setTips] = useState([]);

  const { addUploadedLearning, loading, error } = useUploadedLearningManager();
  const { classes, schoolInfo, loading: classesLoading, error: classesError } = useTeacherSchoolClasses();

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
      const allContent = [...videos, ...tips];

      // Add school information, teacher info, and format class names to form data
      const submissionData = {
        ...formData,
        schoolId: schoolInfo?.id,
        schoolName: schoolInfo?.name,
        teacherId: user?.uid, // Add teacher ID
        classNames: formData.targetClassNames.join(', '), // Convert array to comma-separated string
      };

      console.log('Creating with data:', submissionData); // Debug log

      await addUploadedLearning(submissionData, imageFile, slides, allContent);
      alert('Learning content created successfully!');
      navigate('/learning/upload');
    } catch (error) {
      console.error('Error creating learning resource:', error);
    }
  };

  const handleCancel = () => {
    navigate('/learning/upload');
  };

  if (classesLoading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading classes..." />
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
          <h1>Add New Learning Content</h1>
          {schoolInfo && <p>Creating content for: {schoolInfo.name}</p>}
        </div>
      </div>

      {error && <div className={styles.errorBanner}>Error: {error}</div>}
      {classesError && <div className={styles.errorBanner}>Classes Error: {classesError}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
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
                disabled={loading}
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
              disabled={loading}
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
                      disabled={loading}
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
            <label htmlFor="image">Image</label>
            <input type="file" id="image" accept="image/*" onChange={handleImageChange} disabled={loading} />
            {imagePreview && (
              <div className={styles.imagePreview}>
                <img src={imagePreview} alt="Preview" />
              </div>
            )}
          </div>

          <SlideDeckUploader slides={slides} onSlidesChange={setSlides} />
          <VideoContentManager videos={videos} onVideosChange={setVideos} />
          <TipContentManager tips={tips} onTipsChange={setTips} />

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              Create Learning Content
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUploadedLearning;
