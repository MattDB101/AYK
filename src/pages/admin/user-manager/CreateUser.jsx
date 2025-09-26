import React, { useState, useEffect } from 'react';
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

function CreateUser() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [formData, setFormData] = useState({
    userType: '', // Change this to empty string
    fname: '',
    lname: '',
    email: '',
    schoolId: '',
    schoolName: '',
    county: '',
    // Student-specific fields
    studentId: '',
    classId: '',
    className: '',
  });
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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
      if (formData.userType === 'student' && formData.schoolId) {
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
  }, [formData.schoolId, formData.userType]);

  // Filter schools by selected county
  const filteredSchools = formData.county ? schools.filter((school) => school.county === formData.county) : schools;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    // If user type changes, reset form
    if (name === 'userType') {
      setFormData((prev) => ({
        userType: value,
        fname: '',
        lname: '',
        email: '',
        schoolId: '',
        schoolName: '',
        county: '',
        studentId: '',
        classId: '',
        className: '',
      }));
      return;
    }

    // If county changes, reset school and class selection
    if (name === 'county') {
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
    setLoading(true);
    setError(null);

    try {
      const collection = formData.userType === 'teacher' ? 'teachers' : 'students';

      // Check if user with this email already exists in the target collection
      const existingUser = await projectFirestore.collection(collection).where('email', '==', formData.email).get();

      if (!existingUser.empty) {
        setError(`A ${formData.userType} with this email already exists`);
        setLoading(false);
        return;
      }

      // Prepare data based on user type
      let userData = {
        fname: formData.fname,
        lname: formData.lname,
        email: formData.email,
        schoolId: formData.schoolId,
        schoolName: formData.schoolName,
        county: formData.county,
        createdAt: new Date(),
        accountCreated: false, // Flag to indicate they need to create account
      };

      // Add student-specific fields
      if (formData.userType === 'student') {
        userData = {
          ...userData,
          studentId: formData.studentId,
          classId: formData.classId,
          className: formData.className,
        };
      }

      // Create user record in appropriate collection
      await projectFirestore.collection(collection).add(userData);

      alert(
        `${
          formData.userType === 'teacher' ? 'Teacher' : 'Student'
        } record created successfully! They can now sign up using the signup page with this email address.`
      );
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
            ← Back to Users
          </button>
          <h1>Add New User</h1>
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
                disabled={loading}
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
                disabled={loading}
                placeholder="Enter last name"
              />
            </div>
          </div>

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                disabled={loading}
                placeholder="Enter email address"
              />
              <small style={{ color: '#6b7280', fontSize: '0.85rem' }}>
                The {formData.userType || 'user'} will use this email to create their account
              </small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="userType">User Type *</label>
              <select
                id="userType"
                name="userType"
                value={formData.userType}
                onChange={handleInputChange}
                required
                disabled={loading}
                className={styles.selectInput}
              >
                <option value="" disabled>
                  Select Role
                </option>
                <option value="teacher">Teacher</option>
                <option value="student">Student</option>
              </select>
            </div>
          </div>

          {formData.userType === 'student' && (
            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="studentId">Student ID</label>
                <input
                  type="text"
                  id="studentId"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleInputChange}
                  disabled={loading}
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
                  disabled={loading || !formData.schoolId}
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

          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label htmlFor="county">County</label>
              <select
                id="county"
                name="county"
                value={formData.county}
                onChange={handleInputChange}
                disabled={loading}
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
                disabled={loading}
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

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={handleCancel} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className={styles.saveButton} disabled={loading}>
              {loading ? 'Creating...' : `Create ${formData.userType === 'teacher' ? 'Teacher' : 'Student'}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CreateUser;
