import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './VideoContentManager.module.css';

// Move VideoModal outside the main component to prevent re-creation
const VideoModal = ({
  showForm,
  editingVideo,
  formData,
  thumbnailPreview,
  thumbnailFile,
  onInputChange,
  onThumbnailChange,
  onSubmit,
  onCancel,
}) => {
  if (!showForm) return null;

  const handleModalClick = (e) => {
    if (e.target === e.currentTarget) {
      onCancel();
    }
  };

  return createPortal(
    <div className={styles.modal} onClick={handleModalClick}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h3>{editingVideo ? 'Edit Video' : 'Add New Video'}</h3>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onCancel}
          >
            ×
          </button>
        </div>

        <form onSubmit={onSubmit} className={styles.form}>
          <div className={styles.formGroup}>
            <label htmlFor="video-title">Video Title *</label>
            <input
              type="text"
              id="video-title"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              required
              placeholder="Enter video title"
              autoComplete="off"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="video-description">Description *</label>
            <textarea
              id="video-description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              required
              rows={3}
              placeholder="Describe what this video covers..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="video-url">Video URL *</label>
            <input
              type="url"
              id="video-url"
              name="url"
              value={formData.url}
              onChange={onInputChange}
              required
              placeholder="https://youtube.com/watch?v=..."
              autoComplete="off"
            />
            <small>YouTube, Vimeo, or any video URL</small>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="video-thumbnail">Custom Thumbnail (optional)</label>
            <input
              type="file"
              id="video-thumbnail"
              accept="image/*"
              onChange={onThumbnailChange}
            />
            <small>Upload a custom thumbnail or default will be used</small>

            {thumbnailPreview && (
              <div className={styles.thumbnailPreview}>
                <img src={thumbnailPreview} alt="Thumbnail preview" />
                <small>
                  {thumbnailFile
                    ? 'New thumbnail selected'
                    : 'Current thumbnail'}
                </small>
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <button
              type="button"
              className={styles.cancelButton}
              onClick={onCancel}
            >
              Cancel
            </button>
            <button type="submit" className={styles.saveButton}>
              {editingVideo ? 'Update Video' : 'Add Video'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

function VideoContentManager({ videos, onVideosChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingVideo, setEditingVideo] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    url: '',
    type: 'video',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      url: '',
      type: 'video',
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditingVideo(null);
  }, []);

  const handleAddVideo = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetForm();
      setShowForm(true);
    },
    [resetForm]
  );

  const handleEditVideo = useCallback((video) => {
    setFormData({
      title: video.title || '',
      description: video.description || '',
      url: video.url || '',
      type: video.type || 'video',
    });
    setThumbnailPreview(video.thumbnailUrl || null);
    setEditingVideo(video);
    setShowForm(true);
  }, []);

  const handleRemoveVideo = useCallback(
    (videoId) => {
      const updatedVideos = videos.filter((video) => video.id !== videoId);
      onVideosChange(updatedVideos);
    },
    [videos, onVideosChange]
  );

  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  const handleThumbnailChange = useCallback((e) => {
    const file = e.target.files[0];
    if (file) {
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => setThumbnailPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  }, []);

  const handleSubmit = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();

      console.log('Video form submitted');

      const videoData = {
        id: editingVideo ? editingVideo.id : Date.now(),
        ...formData,
        thumbnailFile: thumbnailFile,
        thumbnailUrl:
          editingVideo && !thumbnailFile ? editingVideo.thumbnailUrl : null,
      };

      if (editingVideo) {
        const updatedVideos = videos.map((video) =>
          video.id === editingVideo.id ? videoData : video
        );
        onVideosChange(updatedVideos);
      } else {
        onVideosChange([...videos, videoData]);
      }

      setShowForm(false);
      resetForm();

      return false;
    },
    [editingVideo, formData, thumbnailFile, videos, onVideosChange, resetForm]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>Video Content ({videos.length} videos)</h3>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddVideo}
        >
          + Add Video
        </button>
      </div>

      {/* Video List */}
      {videos.length > 0 && (
        <div className={styles.videoGrid}>
          {videos.map((video) => (
            <div key={video.id} className={styles.videoCard}>
              <div className={styles.videoThumbnail}>
                <img
                  src={video.thumbnailUrl || '/default-video-thumbnail.png'}
                  alt={video.title}
                  className={styles.thumbnailImage}
                  onError={(e) => {
                    e.target.src = '/default-video-thumbnail.png';
                  }}
                />
                <div className={styles.playIcon}>▶</div>
                {!video.thumbnailUrl && (
                  <div className={styles.defaultThumbnailBadge}>Default</div>
                )}
              </div>
              <div className={styles.videoInfo}>
                <h4 className={styles.videoTitle}>{video.title}</h4>
                <p className={styles.videoDescription}>{video.description}</p>
                <a
                  href={video.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.videoLink}
                >
                  {video.url}
                </a>
              </div>
              <div className={styles.videoActions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => handleEditVideo(video)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveVideo(video.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {videos.length === 0 && (
        <div className={styles.emptyState}>
          <p>No videos added yet</p>
          <small>
            Add instructional videos to help users follow the recipe
          </small>
        </div>
      )}

      {/* Render modal */}
      <VideoModal
        showForm={showForm}
        editingVideo={editingVideo}
        formData={formData}
        thumbnailPreview={thumbnailPreview}
        thumbnailFile={thumbnailFile}
        onInputChange={handleInputChange}
        onThumbnailChange={handleThumbnailChange}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
      />
    </div>
  );
}

export default VideoContentManager;
