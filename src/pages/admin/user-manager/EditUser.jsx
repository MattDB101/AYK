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

function EditUser() {
  const navigate = useNavigate();
  const { teacherId } = useParams();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    schoolId: '',
    schoolName: '',
    county: '',
    accountCreated: false,
  });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load teacher data
  useEffect(() => {
    const fetchTeacher = async () => {
      try {
        const doc = await projectFirestore.collection('teachers').doc(teacherId).get();
        if (doc.exists) {
          setFormData(doc.data());
        } else {
          setError('Teacher not found');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchTeacher();
  }, [teacherId]);

  // Load schools for dropdown
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const snapshot = await projectFirestore.collection('schools').orderBy('name').get();
        setSchools(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        console.error('Error fetching schools:', err);
      }
    };

    fetchSchools();
  }, []);

  // Filter schools by selected county
  const filteredSchools = formData.county ? schools.filter((school) => school.county === formData.county) : schools;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If county changes, reset school selection (unless current school is in new county)
    if (name === 'county') {
      const currentSchool = schools.find((school) => school.id === formData.schoolId);
      if (currentSchool && currentSchool.county !== value) {
        setFormData((prev) => ({
          ...prev,
          [name]: value,
          schoolId: '',
          schoolName: '',
        }));
        return;
      }
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSchoolChange = (e) => {
    const selectedSchoolId = e.target.value;
    const selectedSchool = schools.find((school) => school.id === selectedSchoolId);

    setFormData((prev) => ({
      ...prev,
      schoolId: selectedSchoolId,
      schoolName: selectedSchool ? selectedSchool.name : '',
      county: selectedSchool ? selectedSchool.county : prev.county,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);

    try {
      // Check if email is being changed and already exists
      const originalDoc = await projectFirestore.collection('teachers').doc(teacherId).get();
      const originalEmail = originalDoc.data()?.email;

      if (formData.email !== originalEmail) {
        const existingTeacher = await projectFirestore
          .collection('teachers')
          .where('email', '==', formData.email)
          .get();

        if (!existingTeacher.empty) {
          setError('A teacher with this email already exists');
          setUpdateLoading(false);
          return;
        }
      }

      await projectFirestore.collection('teachers').doc(teacherId).update({
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        county: formData.county,
        updatedAt: new Date(),
      });

      alert('Teacher updated successfully!');
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setUpdateLoading(false);
    }
  };

  const handleCancel = () => {
    navigate('/admin');
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loadingContainer}>
          <LoadingDots text="Loading teacher" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button onClick={() => navigate('/admin/teachers')}>Back to Teachers</button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Teachers
          </button>
          <h1>Edit Teacher</h1>
        </div>
      </div>

      {error && <div className={styles.errorBanner}>Error: {error}</div>}

      <div className={styles.formContainer}>
        <form onSubmit={handleSubmit} className={styles.form}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="fname">First Name *</label>
              <input
                type="text"
                id="fname"
                name="fname"
                value={formData.fname}
                onChange={handleInputChange}
                required
                disabled={updateLoading}
                placeholder="Enter first name"
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="lname">Last Name *</label>
              <input
                type="text"
                id="lname"
                name="lname"
                value={formData.lname}
                onChange={handleInputChange}
                required
                disabled={updateLoading}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              required
              disabled={updateLoading}
              placeholder="Enter email address"
            />
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="county">County</label>
              <select
                id="county"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                disabled={updateLoading}
                className={styles.selectInput}
              >
                <option value="">Select a county</option>
                {IRISH_COUNTIES.map((county) => (
                  <option key={county} value={county}>
                    {county}
                  </option>
                ))}
              </select>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="schoolId">School</label>
              <select
                id="schoolId"
                name="schoolId"
                value={formData.schoolId}
                onChange={handleSchoolChange}
                disabled={updateLoading}
                className={styles.selectInput}
              >
                <option value="">No school assigned</option>
                {filteredSchools.map((school) => (
                  <option key={school.id} value={school.id}>
                    {school.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Account Status Display */}
          <div className={styles.formGroup}>
            <label>Account Status</label>
            <div className={styles.statusDisplay}>
              <span className={formData.accountCreated ? styles.statusActive : styles.statusPending}>
                {formData.accountCreated ? '✓ Account Created' : '⏳ Pending Account Creation'}
              </span>
            </div>
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={updateLoading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={updateLoading}>
              {updateLoading ? 'Updating...' : 'Update Teacher'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUser;
