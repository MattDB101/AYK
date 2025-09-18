import React from 'react';
import SlideDeck from '../../components/SlideDeck/SlideDeck';

function RecipeBook() {
  // The path for the recipe book slides is always 'recipe-book-slides'
  return (
    <div>
      <SlideDeck slideDeckPath="recipe-book-slides" title="Our Recipes" />
    </div>
  );
}

export default RecipeBook;
