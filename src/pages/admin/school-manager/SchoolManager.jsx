import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { projectFirestore } from '../../../firebase/config';
import LoadingDots from '../../../components/LoadingDots/LoadingDots';
import styles from '../recipe-manager/RecipeManager.module.css';

function SchoolManager() {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch schools
  useEffect(() => {
    const fetchSchools = async () => {
      try {
        setLoading(true);
        const snapshot = await projectFirestore.collection('schools').orderBy('name').get();
        setSchools(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchSchools();
  }, []);

  // Filter schools based on search
  const filteredSchools = schools.filter(
    (school) =>
      school.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      school.county.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (school.address && school.address.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleEdit = (school) => {
    navigate(`/admin/schools/edit/${school.id}`);
  };

  const handleCreate = () => {
    navigate('/admin/schools/create');
  };

  const handleDelete = async (school) => {
    if (window.confirm(`Are you sure you want to delete "${school.name}"?`)) {
      try {
        setActionLoading(true);
        // Delete all classes first
        const classesSnapshot = await projectFirestore.collection('schools').doc(school.id).collection('classes').get();

        const batch = projectFirestore.batch();
        classesSnapshot.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        // Delete the school
        batch.delete(projectFirestore.collection('schools').doc(school.id));
        await batch.commit();

        setSchools((prev) => prev.filter((s) => s.id !== school.id));
        alert('School deleted successfully!');
      } catch (error) {
        alert('Error deleting school: ' + error.message);
      } finally {
        setActionLoading(false);
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <LoadingDots text="Loading schools" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.errorContainer}>
        <p>Error loading schools: {error}</p>
        <button onClick={() => window.location.reload()}>Try Again</button>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h2>School Manager</h2>
          <p>Manage schools and their classes</p>
        </div>
        <button className={styles.addButton} onClick={handleCreate} disabled={actionLoading}>
          + Add New School
        </button>
      </div>

      <div className={styles.controls}>
        <div className={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search schools..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
          />
        </div>
        <div className={styles.stats}>
          <span>{filteredSchools.length} schools found</span>
        </div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>School Name</th>
              <th>County</th>
              <th>Address</th>
              <th>Contact</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSchools.map((school) => (
              <tr key={school.id} className={styles.tableRow}>
                <td className={styles.nameCell}>
                  <strong>{school.name}</strong>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{school.county}</span>
                </td>
                <td className={styles.descriptionCell}>
                  <span className={styles.description}>{school.address}</span>
                </td>
                <td className={styles.descriptionCell}>
                  <div>
                    {school.phone && <div>📞 {school.phone}</div>}
                    {school.email && <div>📧 {school.email}</div>}
                  </div>
                </td>
                <td className={styles.actionsCell}>
                  <div className={styles.actionButtons}>
                    <button className={styles.editButton} onClick={() => handleEdit(school)} disabled={actionLoading}>
                      Edit
                    </button>
                    <button
                      className={styles.deleteButton}
                      onClick={() => handleDelete(school)}
                      disabled={actionLoading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredSchools.length === 0 && (
        <div className={styles.emptyState}>
          <p>No schools found</p>
          <button className={styles.addButton} onClick={handleCreate}>
            Add Your First School
          </button>
        </div>
      )}
    </div>
  );
}

export default SchoolManager;
