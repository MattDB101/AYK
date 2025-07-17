import { useCollection } from '../hooks/useCollection';

export function useProjectCheck(collection = 'projects') {
  const { documents, error } = useCollection(collection);
  const isLoading = !documents;
  const hasProjects = documents && documents.length > 0;

  return { isLoading, hasProjects, error };
}
