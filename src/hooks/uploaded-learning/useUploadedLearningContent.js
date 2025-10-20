import { useState, useEffect } from 'react';
import { projectFirestore } from '../../firebase/config';

export const useUploadedLearningContent = (uploadedLearningId) => {
  const [content, setContent] = useState({ tips: [], videos: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!uploadedLearningId) {
      setContent({ tips: [], videos: [] });
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const unsubscribeTips = projectFirestore
      .collection('uploaded-learning')
      .doc(uploadedLearningId)
      .collection('content')
      .where('type', '==', 'tip')
      .onSnapshot(
        (snapshot) => {
          const tips = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setContent((prev) => ({ ...prev, tips }));
        },
        (err) => {
          console.error('Error fetching tips:', err);
          setError(err.message);
        }
      );

    const unsubscribeVideos = projectFirestore
      .collection('uploaded-learning')
      .doc(uploadedLearningId)
      .collection('content')
      .where('type', '==', 'video')
      .onSnapshot(
        (snapshot) => {
          const videos = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));

          setContent((prev) => ({ ...prev, videos }));
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching videos:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => {
      unsubscribeTips();
      unsubscribeVideos();
    };
  }, [uploadedLearningId]);

  return { content, loading, error };
};
