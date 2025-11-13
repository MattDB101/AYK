import { useState, useEffect } from 'react';
import { projectFirestore } from '../../firebase/config';
import { useAuthContext } from '../useAuthContext';

export const useTeacherLearningContent = (uploadedLearningId) => {
  const { user } = useAuthContext();
  const [learningContent, setLearningContent] = useState([]);
  const [tips, setTips] = useState([]);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user || !user.schoolId || !user.classId) {
      setLearningContent([]);
      setTips([]);
      setVideos([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Fetch all learning content for this school/class
    const unsubscribeContent = projectFirestore
      .collection('uploaded-learning')
      .doc(user.schoolId)
      .collection('learning-content')
      .where('isActive', '==', true)
      .onSnapshot(
        (snapshot) => {
          const filtered = snapshot.docs
            .map((doc) => ({ id: doc.id, ...doc.data() }))
            .filter((doc) => Array.isArray(doc.targetClasses) && doc.targetClasses.includes(user.classId));
          setLearningContent(filtered);
          setLoading(false);
        },
        (err) => {
          setError(err.message);
          setLoading(false);
        }
      );

    // If a specific content ID is provided, fetch its tips and videos
    let unsubscribeTips = () => {};
    let unsubscribeVideos = () => {};
    if (uploadedLearningId) {
      const contentRef = projectFirestore
        .collection('uploaded-learning')
        .doc(user.schoolId)
        .collection('learning-content')
        .doc(uploadedLearningId)
        .collection('content');

      unsubscribeTips = contentRef.where('type', '==', 'tip').onSnapshot(
        (snapshot) => {
          setTips(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        },
        (err) => setError(err.message)
      );

      unsubscribeVideos = contentRef.where('type', '==', 'video').onSnapshot(
        (snapshot) => {
          setVideos(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
        },
        (err) => setError(err.message)
      );
    } else {
      setTips([]);
      setVideos([]);
    }

    return () => {
      unsubscribeContent();
      unsubscribeTips();
      unsubscribeVideos();
    };
  }, [user, uploadedLearningId]);

  return { learningContent, tips, videos, loading, error };
};
