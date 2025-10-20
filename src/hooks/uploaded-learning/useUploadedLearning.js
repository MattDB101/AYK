import { useState, useEffect } from 'react';
import { projectFirestore } from '../../firebase/config';
import { useAuthContext } from '../useAuthContext';

export const useUploadedLearning = () => {
  const { user } = useAuthContext();
  const [learningContent, setLearningContent] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      setLearningContent([]);
      setLoading(false);
      return;
    }

    const unsubscribe = projectFirestore
      .collection('uploaded-learning')
      .doc(user.schoolId)
      .collection('learning-content')
      .where('isActive', '==', true)
      .onSnapshot(
        async (snapshot) => {
          const contentList = [];

          // Fetch each learning content with its subcontent
          for (const doc of snapshot.docs) {
            const learningData = {
              id: doc.id,
              ...doc.data(),
            };

            // Fetch content for this learning item to get thumbnails
            try {
              const contentSnapshot = await projectFirestore
                .collection('uploaded-learning')
                .doc(user.schoolId)
                .collection('learning-content')
                .doc(doc.id)
                .collection('content')
                .get();

              const content = contentSnapshot.docs.map((contentDoc) => ({
                id: contentDoc.id,
                ...contentDoc.data(),
              }));

              learningData.content = content;

              // Add a preview thumbnail from first video/tip with thumbnail
              const firstThumbnail = content.find((item) => item.thumbnailUrl);
              if (firstThumbnail) {
                learningData.previewThumbnail = firstThumbnail.thumbnailUrl;
              }
            } catch (err) {
              console.warn(`Could not fetch content for learning ${doc.id}:`, err);
              learningData.content = [];
            }

            contentList.push(learningData);
          }

          setLearningContent(contentList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching learning content:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [user]);

  // Group content by category and sort alphabetically within each category
  const groupedLearningContent = {
    safety: learningContent
      .filter((content) => content.category === 'safety')
      .sort((a, b) => a.name.localeCompare(b.name)),
    techniques: learningContent
      .filter((content) => content.category === 'techniques')
      .sort((a, b) => a.name.localeCompare(b.name)),
    management: learningContent
      .filter((content) => content.category === 'management')
      .sort((a, b) => a.name.localeCompare(b.name)),
  };

  return { learningContent, groupedLearningContent, loading, error };
};
