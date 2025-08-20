import React, { useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import styles from './TipContentManager.module.css';

// Move TipModal outside the main component to prevent re-creation
const TipModal = ({
  showForm,
  editingTip,
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
          <h3>{editingTip ? 'Edit Tip' : 'Add New Tip'}</h3>
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
            <label htmlFor="tip-title">Tip Title *</label>
            <input
              type="text"
              id="tip-title"
              name="title"
              value={formData.title}
              onChange={onInputChange}
              required
              placeholder="Enter tip title (e.g., Tip #1)"
              autoComplete="off"
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tip-description">Tip Content *</label>
            <textarea
              id="tip-description"
              name="description"
              value={formData.description}
              onChange={onInputChange}
              required
              rows={4}
              placeholder="Enter your tip or advice..."
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="tip-thumbnail">Custom Thumbnail (optional)</label>
            <input
              type="file"
              id="tip-thumbnail"
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
              {editingTip ? 'Update Tip' : 'Add Tip'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

function TipContentManager({ tips, onTipsChange }) {
  const [showForm, setShowForm] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    type: 'tip',
  });
  const [thumbnailFile, setThumbnailFile] = useState(null);
  const [thumbnailPreview, setThumbnailPreview] = useState(null);

  const resetForm = useCallback(() => {
    setFormData({
      title: '',
      description: '',
      type: 'tip',
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setEditingTip(null);
  }, []);

  const handleAddTip = useCallback(
    (e) => {
      e.preventDefault();
      e.stopPropagation();
      resetForm();
      setShowForm(true);
    },
    [resetForm]
  );

  const handleEditTip = useCallback((tip) => {
    setFormData({
      title: tip.title || '',
      description: tip.description || '',
      type: tip.type || 'tip',
    });
    setThumbnailPreview(tip.thumbnailUrl || null);
    setEditingTip(tip);
    setShowForm(true);
  }, []);

  const handleRemoveTip = useCallback(
    (tipId) => {
      const updatedTips = tips.filter((tip) => tip.id !== tipId);
      onTipsChange(updatedTips);
    },
    [tips, onTipsChange]
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

      const tipData = {
        id: editingTip ? editingTip.id : Date.now(),
        ...formData,
        thumbnailFile: thumbnailFile,
        thumbnailUrl:
          editingTip && !thumbnailFile ? editingTip.thumbnailUrl : null,
      };

      if (editingTip) {
        const updatedTips = tips.map((tip) =>
          tip.id === editingTip.id ? tipData : tip
        );
        onTipsChange(updatedTips);
      } else {
        onTipsChange([...tips, tipData]);
      }

      setShowForm(false);
      resetForm();
    },
    [editingTip, formData, thumbnailFile, tips, onTipsChange, resetForm]
  );

  const handleCancel = useCallback(() => {
    setShowForm(false);
    resetForm();
  }, [resetForm]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h3>Tips & Advice ({tips.length} tips)</h3>
        </div>
        <button
          type="button"
          className={styles.addButton}
          onClick={handleAddTip}
        >
          + Add Tip
        </button>
      </div>

      {/* Tips List */}
      {tips.length > 0 && (
        <div className={styles.tipsGrid}>
          {tips.map((tip) => (
            <div key={tip.id} className={styles.tipCard}>
              <div className={styles.tipThumbnail}>
                <img
                  src={tip.thumbnailUrl || '/default-video-thumbnail.png'}
                  alt={tip.title}
                  className={styles.thumbnailImage}
                  onError={(e) => {
                    e.target.src = '/default-video-thumbnail.png';
                  }}
                />
              </div>
              <div className={styles.tipInfo}>
                <h4 className={styles.tipTitle}>{tip.title}</h4>
                <p className={styles.tipDescription}>{tip.description}</p>
              </div>
              <div className={styles.tipActions}>
                <button
                  type="button"
                  className={styles.editButton}
                  onClick={() => handleEditTip(tip)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className={styles.removeButton}
                  onClick={() => handleRemoveTip(tip.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tips.length === 0 && (
        <div className={styles.emptyState}>
          <p>No tips added yet</p>
          <small>
            Add helpful tips and advice to guide users through the recipe
          </small>
        </div>
      )}

      {/* Render modal */}
      <TipModal
        showForm={showForm}
        editingTip={editingTip}
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

export default TipContentManager;
