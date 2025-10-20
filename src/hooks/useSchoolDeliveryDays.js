import { useState, useEffect } from 'react';
import { projectFirestore } from '../firebase/config';
import { useAuthContext } from './useAuthContext';

export const useSchoolDeliveryDays = () => {
  const [deliveryDays, setDeliveryDays] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuthContext();

  useEffect(() => {
    const fetchSchoolDeliveryDays = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Find the teacher record by userId
        const teacherQuery = await projectFirestore.collection('teachers').where('userId', '==', user.uid).get();

        if (teacherQuery.empty) {
          setError('Teacher record not found');
          setLoading(false);
          return;
        }

        const teacherData = teacherQuery.docs[0].data();
        const schoolId = teacherData.schoolId;

        if (!schoolId) {
          setError('No school assigned to teacher');
          setLoading(false);
          return;
        }

        // Get the school document and its delivery days
        const schoolDoc = await projectFirestore.collection('schools').doc(schoolId).get();

        if (!schoolDoc.exists) {
          setError('School not found');
          setLoading(false);
          return;
        }

        const schoolData = schoolDoc.data();
        const schoolDeliveryDays = schoolData.deliveryDays || {
          monday: false,
          tuesday: false,
          wednesday: false,
          thursday: false,
          friday: false,
        };

        setDeliveryDays(schoolDeliveryDays);
        setError(null);
      } catch (err) {
        console.error('Error fetching school delivery days:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSchoolDeliveryDays();
  }, [user]);

  // Helper function to check if a specific day is allowed
  const isDayAllowed = (dayOfWeek) => {
    if (!deliveryDays) return false;

    const dayMap = {
      1: 'monday',
      2: 'tuesday',
      3: 'wednesday',
      4: 'thursday',
      5: 'friday',
    };

    return deliveryDays[dayMap[dayOfWeek]] || false;
  };

  return { deliveryDays, loading, error, isDayAllowed };
};
