import styles from './SetupProfile.module.css';
import { useState } from 'react';
import { useAuthContext } from '../../hooks/useAuthContext';
import { projectAuth, projectFirestore, projectStorage } from '../../firebase/config'; // Import projectAuth
import { doc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile } from 'firebase/auth'; // Import updateProfile function

export default function SetupProfile() {
  const [fname, setFname] = useState('');
  const [lname, setLname] = useState('');
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!fname.trim() || !lname.trim()) {
      setError('Please enter both first and last name');
      return;
    }

    setIsPending(true);
    setError(null);

    try {
      let avatarURL = null;
      if (profileImage) {
        // Upload to Firebase Storage
        const filename = `avatars/${user.uid}/${Date.now()}.${profileImage.name.split('.').pop()}`;
        const storageRef = ref(projectStorage, filename);
        const uploadResult = await uploadBytes(storageRef, profileImage);
        avatarURL = await getDownloadURL(uploadResult.ref);
      }

      const displayName = `${fname.trim()} ${lname.trim()}`;

      // Update Firebase Auth profile using the actual Firebase Auth user
      // projectAuth.currentUser gives you the real Firebase Auth user object
      if (projectAuth.currentUser) {
        await updateProfile(projectAuth.currentUser, {
          displayName: displayName,
          photoURL: avatarURL || projectAuth.currentUser.photoURL,
        });
      }

      // Save to Firestore - this is what App.jsx checks
      const profileData = {
        fname: fname.trim(),
        lname: lname.trim(),
        displayName: displayName,
        email: user.email,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (avatarURL) {
        profileData.photoURL = avatarURL;
      }

      await setDoc(doc(projectFirestore, 'teachers', user.uid), profileData, { merge: true });

      // Force a page refresh to trigger the profile check in App.jsx
      window.location.reload();
    } catch (err) {
      console.error('Profile setup error:', err);
      setError(err.message);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className={styles['setup-form-container']}>
      <form onSubmit={handleSubmit} className={styles['setup-form']}>
        <div className={styles['setup-form-contents']}>
          <h2>Complete Your Profile</h2>
          <div className={styles['setup50-50']}>
            <div className={styles['setup50-50-left']}>
              <label>
                <span>First Name</span>
                <input type="text" onChange={(e) => setFname(e.target.value)} value={fname} required />
              </label>
            </div>
            <div className={styles['setup50-50-right']}>
              <label>
                <span>Last Name</span>
                <input type="text" onChange={(e) => setLname(e.target.value)} value={lname} required />
              </label>
            </div>
          </div>

          <div className={styles['setup-form-profile-img']}>
            <h3>Profile Photo</h3>
            <img
              src={imagePreview || user?.photoURL || '/default-avatar.jpg'}
              alt="Profile"
              className={styles['profile-img']}
            />
            <div className={styles['file-input-wrapper']}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className={styles['file-input']}
                id="profile-upload"
              />
              <label htmlFor="profile-upload" className={styles['file-input-button']}>
                Choose Photo
              </label>
            </div>
          </div>

          {!isPending && <button className="btn">Save Changes</button>}
          {isPending && (
            <button className="btn" disabled>
              Loading...
            </button>
          )}
          {error && <div className={styles.err}>{error}</div>}
        </div>
      </form>
    </div>
  );
}
