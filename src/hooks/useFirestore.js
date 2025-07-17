import { useReducer, useEffect, useState } from 'react';
import { projectFirestore, timestamp } from '../firebase/config';
import { useAuthContext } from './useAuthContext';

let initialState = {
  document: null,
  isPending: false,
  error: null,
  success: null,
};

const firestoreReducer = (state, action) => {
  switch (action.type) {
    case 'IS_PENDING':
      return { isPending: true, document: null, sucess: false, error: null };

    case 'ADDED_DOCUMENT':
      return {
        isPending: false,
        document: action.payload,
        success: true,
        error: null,
      };

    case 'DELETED_DOCUMENT':
      return {
        isPending: false,
        document: action.payload,
        success: true,
        error: null,
      };

    case 'ERROR':
      return {
        isPending: false,
        document: null,
        success: false,
        error: action.payload,
      };

    default:
      return state;
  }
};

export const useFirestore = (collection) => {
  const [response, dispatch] = useReducer(firestoreReducer, initialState);
  const [isCancelled, setIsCancelled] = useState(false);
  const { user } = useAuthContext();
  const ref = projectFirestore.collection(collection);

  const dispatchIfNotCancelled = (action) => {
    if (!isCancelled) {
      dispatch(action);
    }
  };

  const addDocument = async (doc) => {
    dispatch({ type: 'IS_PENDING' });
    try {
      const lastModified = timestamp.fromDate(new Date());
      const modifiedBy = user.displayName;
      const addedDocument = await ref.add({ ...doc, lastModified, modifiedBy });
      dispatchIfNotCancelled({
        type: 'ADDED_DOCUMENT',
        payload: addedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({ type: 'ERROR', payload: err.message });
    }
  };

  // Add document to the collection passed as an argument (useful when the collection you're adding to can change)
  const addDocumentToCollection = async (collectionName, doc) => {
    const ref = projectFirestore.collection(collectionName);
    dispatch({ type: 'IS_PENDING' });
    try {
      const lastModified = timestamp.fromDate(new Date());
      const modifiedBy = user.displayName;
      const addedDocument = await ref.add({ ...doc, lastModified, modifiedBy });
      dispatchIfNotCancelled({
        type: 'ADDED_DOCUMENT',
        payload: addedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({ type: 'ERROR', payload: err.message });
    }
  };

  const updateDocument = async (id, updatedDoc) => {
    dispatch({ type: 'IS_PENDING' });
    try {
      const lastModified = timestamp.fromDate(new Date());
      const modifiedBy = user.displayName;
      const updatedDocument = await ref.doc(id).update({
        ...updatedDoc,
        lastModified,
        modifiedBy,
      });
      dispatchIfNotCancelled({
        type: 'UPDATED_DOCUMENT',
        payload: updatedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({ type: 'ERROR', payload: err.message });
    }
  };

  const deleteDocument = async (id) => {
    dispatch({ type: 'IS_PENDING' });
    try {
      // Mark the document as inactive
      const updatedDocument = await ref.doc(id).update({ inactive: true });
      dispatchIfNotCancelled({
        type: 'UPDATED_DOCUMENT',
        payload: updatedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({
        type: 'ERROR',
        payload: 'Failed to mark document as inactive.',
      });
    }
  };

  const restoreDocument = async (id) => {
    dispatch({ type: 'IS_PENDING' });
    try {
      // Mark the document as inactive
      const updatedDocument = await ref.doc(id).update({ inactive: false });
      dispatchIfNotCancelled({
        type: 'UPDATED_DOCUMENT',
        payload: updatedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({
        type: 'ERROR',
        payload: 'Failed to mark document as inactive.',
      });
    }
  };

  const removeDocument = async (id) => {
    dispatch({ type: 'IS_PENDING' });
    try {
      const deletedDocument = await ref.doc(id).delete();
      dispatchIfNotCancelled({
        type: 'DELETED_DOCUMENT',
        payload: deletedDocument,
      });
    } catch (err) {
      console.log(err);
      dispatchIfNotCancelled({
        type: 'ERROR',
        payload: 'Failed to delete row(s).',
      });
    }
  };

  const increaseValidateCount = async () => {
    const ref = projectFirestore.collection('page_visits').doc('validation');
    try {
      const doc = await ref.get();
      const currentCount = doc.exists && doc.data().total ? doc.data().total : 0;
      await ref.set({ total: currentCount + 1 }, { merge: true });
      return currentCount + 1;
    } catch (err) {
      console.error('Failed to increase validate total:', err);
      throw err;
    }
  };

  useEffect(() => {
    return () => setIsCancelled(true);
  }, []);

  return {
    addDocument,
    addDocumentToCollection,
    updateDocument,
    deleteDocument,
    increaseValidateCount,
    removeDocument,
    restoreDocument,
    response,
  };
};
