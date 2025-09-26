import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { projectFirestore } from '../../../firebase/config';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
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

function EditSchool() {
  const navigate = useNavigate();
  const { schoolId } = useParams();
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
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load school data
  useEffect(() => {
    const fetchSchool = async () => {
      try {
        const doc = await projectFirestore.collection('schools').doc(schoolId).get();
        if (doc.exists) {
          setFormData(doc.data());
        } else {
          setError('School not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchool();
  }, [schoolId]);

  // Load classes
  useEffect(() => {
    const fetchClasses = async () => {
      try {
        const snapshot = await projectFirestore
          .collection('schools')
          .doc(schoolId)
          .collection('classes')
          .orderBy('name')
          .get();
        setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching classes:', err);
      }
    };

    if (schoolId) {
      fetchClasses();
    }
  }, [schoolId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);

    try {
      await projectFirestore
        .collection('schools')
        .doc(schoolId)
        .update({
          ...formData,
          updatedAt: new Date(),
        });
      alert('School updated successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    try {
      const docRef = await projectFirestore
        .collection('schools')
        .doc(schoolId)
        .collection('classes')
        .add({
          ...classForm,
          pupilCount: parseInt(classForm.pupilCount),
          createdAt: new Date(),
        });
      const newClass = {
        id: docRef.id,
        ...classForm,
        pupilCount: parseInt(classForm.pupilCount),
        createdAt: new Date(),
      };
      setClasses((prev) => [...prev, newClass]);
      setClassForm({ name: '', pupilCount: '' });
      setShowAddClass(false);
    } catch (err) {
      alert('Error adding class: ' + err.message);
    }
  };

  const handleDeleteClass = async (classId, className) => {
    if (window.confirm(`Are you sure you want to delete class "${className}"?`)) {
      try {
        await projectFirestore.collection('schools').doc(schoolId).collection('classes').doc(classId).delete();
        setClasses((prev) => prev.filter((c) => c.id !== classId));
        alert('Class deleted successfully!');
      } catch (err) {
        alert('Error deleting class: ' + err.message);
      }
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading school" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button onClick={() => navigate('/admin')}>Back to Schools</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Schools
          </button>
          <h1>Edit School</h1>
        </div>
      </div>

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
                disabled={updateLoading}
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
              disabled={updateLoading}
              rows={3}
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
                disabled={updateLoading}
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
                disabled={updateLoading}
              />
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update School'}
            </button>
          </div>

          {/* Classes Section */}
          <div className={styles.section}>
            <div className={styles.sectionHeader}>
              <h3>Classes ({classes.length})</h3>
              <button type="button" className={styles.addButton} onClick={() => setShowAddClass(true)}>
                + Add Class
              </button>
            </div>

            {showAddClass && (
              <div className={styles.classForm}>
                <h4>Add New Class</h4>
                <form onSubmit={handleAddClass}>
                  <div className={styles.formRow}>
                    <div className={styles.formGroup}>
                      <label>Class Name *</label>
                      <input
                        type="text"
                        value={classForm.name}
                        onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="e.g. Year 1, Reception"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label>Pupil Count *</label>
                      <input
                        type="number"
                        min="0"
                        value={classForm.pupilCount}
                        onChange={(e) => setClassForm((prev) => ({ ...prev, pupilCount: e.target.value }))}
                        required
                      />
                    </div>
                  </div>
                  <div className={styles.formActions}>
                    <button type="submit">Add Class</button>
                    <button type="button" onClick={() => setShowAddClass(false)}>
                      Cancel
                    </button>
                  </div>
                </form>
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
                    onClick={() => handleDeleteClass(schoolClass.id, schoolClass.name)}
                    className={styles.deleteButton}
                  >
                    Delete
                  </button>
                </div>
              ))}
              {classes.length === 0 && <p>No classes added yet. Click "Add Class" to get started.</p>}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditSchool;
