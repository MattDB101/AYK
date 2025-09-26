import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectFirestore } from '../../../firebase/config';
import styles from '../recipe-manager/RecipeForm.module.css';

const IRISH_COUNTIES = [
  'Antrim',
  'Armagh',
  'Carlow',
  'Cavan',
  'Clare',
  'Cork',
  'Derry',
  'Donegal',
  'Down',
  'Dublin',
  'Fermanagh',
  'Galway',
  'Kerry',
  'Kildare',
  'Kilkenny',
  'Laois',
  'Leitrim',
  'Limerick',
  'Longford',
  'Louth',
  'Mayo',
  'Meath',
  'Monaghan',
  'Offaly',
  'Roscommon',
  'Sligo',
  'Tipperary',
  'Tyrone',
  'Waterford',
  'Westmeath',
  'Wexford',
  'Wicklow',
];

function CreateSchool() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    county: '',
    phone: '',
    email: '',
  });
  const [classes, setClasses] = useState([]);
  const [showAddClass, setShowAddClass] = useState(false);
  const [classForm, setClassForm] = useState({
    name: '',
    pupilCount: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddClass = (e) => {
    e.preventDefault();

    if (!classForm.name.trim() || !classForm.pupilCount) {
      alert('Please fill in all class fields');
      return;
    }

    const newClass = {
      id: Date.now().toString(), // Temporary ID for display
      name: classForm.name.trim(),
      pupilCount: parseInt(classForm.pupilCount),
    };

    setClasses((prev) => [...prev, newClass]);
    setClassForm({ name: '', pupilCount: '' });
    setShowAddClass(false);
  };

  const handleDeleteClass = (classId) => {
    setClasses((prev) => prev.filter((c) => c.id !== classId));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Create the school document first
      const schoolRef = await projectFirestore.collection('schools').add({
        ...formData,
        createdAt: new Date(),
      });

      // Add classes as subcollection if any exist
      if (classes.length > 0) {
        const batch = projectFirestore.batch();
        classes.forEach((schoolClass) => {
          const classRef = schoolRef.collection('classes').doc();
          batch.set(classRef, {
            name: schoolClass.name,
            pupilCount: schoolClass.pupilCount,
            createdAt: new Date(),
          });
        });
        await batch.commit();
      }

      alert('School created successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Schools
          </button>
          <h1>Add New School</h1>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>Error: {error}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="name">School Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter school name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="county">County *</label>
              <select
                id="county"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={styles.selectInput}
              >
                <option value="" disabled>
                  Select a county
                </option>
                {IRISH_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="address">Address *</label>
            <textarea
              id="address"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              required
              disabled={loading}
              rows={3}
              placeholder="Enter full address"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="phone">Phone</label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter phone number"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                disabled={loading}
                placeholder="Enter email address"
              />
            </div>
          </div>

          {/* Classes Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Classes ({classes.length})</h3>
              <button
                type="button"
                className={styles.addButton}
                onClick={() => setShowAddClass(true)}
                disabled={loading}
              >
                + Add Class
              </button>
            </div>

            {showAddClass && (
              <div className={styles.classForm}>
                <h4>Add New Class</h4>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label>Class Name *</label>
                    <input
                      type="text"
                      value={classForm.name}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="e.g. 1st Year Group A"
                      disabled={loading}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label>Pupil Count *</label>
                    <input
                      type="number"
                      min="0"
                      value={classForm.pupilCount}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, pupilCount: e.target.value }))}
                      disabled={loading}
                    />
                  </div>
                </div>
                <div className={styles.formActions}>
                  <button type="button" onClick={handleAddClass} disabled={loading}>
                    Add Class
                  </button>
                  <button type="button" onClick={() => setShowAddClass(false)} disabled={loading}>
                    Cancel
                  </button>
                </div>
              </div>
            )}

            <div className={styles.classesList}>
              {classes.map((schoolClass) => (
                <div key={schoolClass.id} className={styles.classItem}>
                  <div>
                    <strong>{schoolClass.name}</strong>
                    <span> - {schoolClass.pupilCount} pupils</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteClass(schoolClass.id)}
                    className={styles.deleteButton}
                    disabled={loading}
                  >
                    Remove
                  </button>
                </div>
              ))}
              {classes.length === 0 && <p>No classes added yet. Click "Add Class" to get started.</p>}
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Creating...' : 'Create School'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateSchool;
