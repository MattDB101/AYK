import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectFirestore } from '../../../firebase/config';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-manager/RecipeManager.module.css';

function UserManager() {
  const navigate = useNavigate();
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('all'); // 'all', 'teachers', 'students'

  // Fetch both teachers and students
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true);

        // Fetch teachers and students in parallel
        const [teachersSnapshot, studentsSnapshot] = await Promise.all([
          projectFirestore.collection('teachers').orderBy('lname').get(),
          projectFirestore.collection('students').orderBy('lname').get(),
        ]);

        const teachersData = teachersSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          userType: 'teacher',
        }));

        const studentsData = studentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          userType: 'student',
        }));

        setTeachers(teachersData);
        setStudents(studentsData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Combine and filter users
  const allUsers = [...teachers, ...students];

  const filteredUsers = allUsers.filter((user) => {
    const matchesSearch =
      `${user.fname} ${user.lname}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email && user.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.schoolName && user.schoolName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (user.className && user.className.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesType = userTypeFilter === 'all' || user.userType === userTypeFilter.slice(0, -1); // Remove 's' from 'teachers'/'students'

    return matchesSearch && matchesType;
  });

  const handleEdit = (user) => {
    navigate(`/admin/users/edit/${user.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/users/create');
  };

  const handleDelete = async (user) => {
    const userTypeLabel = user.userType === 'teacher' ? 'Teacher' : 'Student';
    if (window.confirm(`Are you sure you want to delete "${user.fname} ${user.lname}" (${userTypeLabel})?`)) {
      try {
        setActionLoading(true);
        const collection = user.userType === 'teacher' ? 'teachers' : 'students';
        await projectFirestore.collection(collection).doc(user.id).delete();

        // Update local state
        if (user.userType === 'teacher') {
          setTeachers((prev) => prev.filter((t) => t.id !== user.id));
        } else {
          setStudents((prev) => prev.filter((s) => s.id !== user.id));
        }

        alert(`${userTypeLabel} deleted successfully!`);
      } catch (error) {
        alert(`Error deleting ${userTypeLabel.toLowerCase()}: ` + error.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  // Get stats
  const stats = {
    total: allUsers.length,
    teachers: teachers.length,
    students: students.length,
    filtered: filteredUsers.length,
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading users" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading users: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>User Manager</h2>
          <p>Manage teachers and students</p>
        </div>
        <button className={styles.addButton} onClick={handleCreate} disabled={actionLoading}>
          + Add New User
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.controlsContainer}>
          <div className={styles.searchContainer}>
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          <select
            value={userTypeFilter}
            onChange={(e) => setUserTypeFilter(e.target.value)}
            className={styles.filterSelect}
          >
            <option value="all">All Users ({stats.total})</option>
            <option value="teachers">Teachers ({stats.teachers})</option>
            <option value="students">Students ({stats.students})</option>
          </select>
        </div>

        <div className={styles.stats}>
          <span>{stats.filtered} users found</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Email</th>
              <th>School</th>
              <th>Additional Info</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map((user) => (
              <tr key={`${user.userType}-${user.id}`} className={styles.tableRow}>
                <td className={styles.nameCell}>
                  <strong>
                    {user.fname} {user.lname}
                  </strong>
                </td>
                <td className={styles.typeCell}>
                  <span className={`${styles.userTypeBadge} ${styles[user.userType]}`}>
                    {user.userType === 'teacher' ? 'Teacher' : 'Student'}
                  </span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{user.email}</span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{user.schoolName || 'No school assigned'}</span>
                </td>
                <td className={styles.descriptionCell}>
                  {user.userType === 'student' ? (
                    <div>
                      {user.className && <div>Class: {user.className}</div>}
                      {user.studentId && <div>ID: {user.studentId}</div>}
                    </div>
                  ) : (
                    <span className={styles.description}>-</span>
                  )}
                </td>
                <td className={styles.statusCell}>
                  <span className={`${styles.statusBadge} ${user.accountCreated ? styles.active : styles.pending}`}>
                    {user.accountCreated ? 'Active' : 'Pending'}
                  </span>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button className={styles.editButton} onClick={() => handleEdit(user)} disabled={actionLoading}>
                      Edit
                    </button>
                    <button className={styles.deleteButton} onClick={() => handleDelete(user)} disabled={actionLoading}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredUsers.length === 0 && (
        <div className={styles.emptyState}>
          <p>No users found</p>
          <button className={styles.addButton} onClick={handleCreate}>
            Add Your First User
          </button>
        </div>
      )}
    </div>
  );
}

export default UserManager;
