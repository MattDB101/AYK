import { useState, useEffect } from 'react';
import { projectFirestore } from '../../firebase/config';

export const useRecipes = () => {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const unsubscribe = projectFirestore
      .collection('recipes')
      .where('isActive', '==', true)
      // Remove orderBy entirely to avoid index requirement
      .onSnapshot(
        (snapshot) => {
          const recipeList = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setRecipes(recipeList);
          setLoading(false);
        },
        (err) => {
          console.error('Error fetching recipes:', err);
          setError(err.message);
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, []);

  // Group recipes by category and sort alphabetically within each category
  const groupedRecipes = {
    breakfast: recipes.filter((recipe) => recipe.category === 'breakfast').sort((a, b) => a.name.localeCompare(b.name)), // Sort by name A-Z
    lunch: recipes.filter((recipe) => recipe.category === 'lunch').sort((a, b) => a.name.localeCompare(b.name)),
    dinner: recipes.filter((recipe) => recipe.category === 'dinner').sort((a, b) => a.name.localeCompare(b.name)),
    dessert: recipes.filter((recipe) => recipe.category === 'dessert').sort((a, b) => a.name.localeCompare(b.name)),
  };

  return { recipes, groupedRecipes, loading, error };
};
