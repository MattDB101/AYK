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
  const { userId, userType: urlUserType } = useParams(); // Get both userId and userType from URL
  const [schools, setSchools] = useState([]);
  const [classes, setClasses] = useState([]);
  const [userType, setUserType] = useState(null);
  const [formData, setFormData] = useState({
    fname: '',
    lname: '',
    email: '',
    schoolId: '',
    schoolName: '',
    county: '',
    accountCreated: false,
    // Student-specific fields
    studentId: '',
    classId: '',
    className: '',
  });
  const [loading, setLoading] = useState(true);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load user data from appropriate collection
  useEffect(() => {
    const fetchUser = async () => {
      try {
        // If userType is in URL, use that, otherwise check both collections
        if (urlUserType) {
          const collection = urlUserType === 'teacher' ? 'teachers' : 'students';
          const doc = await projectFirestore.collection(collection).doc(userId).get();

          if (doc.exists) {
            setFormData(doc.data());
            setUserType(urlUserType);
          } else {
            setError(`${urlUserType === 'teacher' ? 'Teacher' : 'Student'} not found`);
          }
        } else {
          // Check both collections if userType not specified
          const [teacherDoc, studentDoc] = await Promise.all([
            projectFirestore.collection('teachers').doc(userId).get(),
            projectFirestore.collection('students').doc(userId).get(),
          ]);

          if (teacherDoc.exists) {
            setFormData(teacherDoc.data());
            setUserType('teacher');
          } else if (studentDoc.exists) {
            setFormData(studentDoc.data());
            setUserType('student');
          } else {
            setError('User not found');
          }
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId, urlUserType]);

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

  // Load classes when school is selected (for students)
  useEffect(() => {
    const fetchClasses = async () => {
      if (userType === 'student' && formData.schoolId) {
        try {
          const snapshot = await projectFirestore
            .collection('schools')
            .doc(formData.schoolId)
            .collection('classes')
            .orderBy('name')
            .get();
          setClasses(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        } catch (err) {
          console.error('Error fetching classes:', err);
          setClasses([]);
        }
      } else {
        setClasses([]);
      }
    };

    fetchClasses();
  }, [formData.schoolId, userType]);

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
          classId: '',
          className: '',
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
      classId: '', // Reset class when school changes
      className: '',
    }));
  };

  const handleClassChange = (e) => {
    const selectedClassId = e.target.value;
    const selectedClass = classes.find((cls) => cls.id === selectedClassId);

    setFormData((prev) => ({
      ...prev,
      classId: selectedClassId,
      className: selectedClass ? selectedClass.name : '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUpdateLoading(true);
    setError(null);

    try {
      const collection = userType === 'teacher' ? 'teachers' : 'students';

      // Check if email is being changed and already exists
      const originalDoc = await projectFirestore.collection(collection).doc(userId).get();
      const originalEmail = originalDoc.data()?.email;

      if (formData.email !== originalEmail) {
        const existingUser = await projectFirestore.collection(collection).where('email', '==', formData.email).get();

        if (!existingUser.empty) {
          setError(`A ${userType} with this email already exists`);
          setUpdateLoading(false);
          return;
        }
      }

      // Prepare update data based on user type
      let updateData = {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        county: formData.county,
        updatedAt: new Date(),
      };

      // Add student-specific fields if updating a student
      if (userType === 'student') {
        updateData = {
          ...updateData,
          studentId: formData.studentId,
          classId: formData.classId,
          className: formData.className,
        };
      }

      await projectFirestore.collection(collection).doc(userId).update(updateData);

      alert(`${userType === 'teacher' ? 'Teacher' : 'Student'} updated successfully!`);
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
          <LoadingDots text="Loading user" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.container}>
        <div className={styles.errorContainer}>
          <p>Error: {error}</p>
          <button onClick={() => navigate('/admin/users')}>Back to Users</button>
        </div>
      </div>
    );
  }

  const userTypeLabel = userType === 'teacher' ? 'Teacher' : 'Student';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <button className={styles.backButton} onClick={handleCancel}>
            ← Back to Users
          </button>
          <h1>Edit {userTypeLabel}</h1>
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

          {/* Student-specific fields */}
          {userType === 'student' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  disabled={updateLoading}
                  placeholder="Enter student ID (optional)"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="classId">Class</label>
                <select
                  id="classId"
                  name="classId"
                  value={formData.classId}
                  onChange={handleClassChange}
                  disabled={updateLoading || !formData.schoolId}
                  className={styles.selectInput}
                >
                  <option value="">No class assigned</option>
                  {classes.map((cls) => (
                    <option key={cls.id} value={cls.id}>
                      {cls.name} ({cls.pupilCount} pupils)
                    </option>
                  ))}
                </select>
                {formData.schoolId && classes.length === 0 && (
                  <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>No classes available for this school</small>
                )}
              </div>
            </div>
          )}

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
              {updateLoading ? 'Updating...' : `Update ${userTypeLabel}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditUser;
