import React from 'react';
import SlideDeck from '../../components/SlideDeck/SlideDeck';

function RecipeBook() {
  // The path for the recipe book slides is always 'recipe-book-slides'
  return (
    <div style={{ padding: '0 50px' }}>
      <SlideDeck slideDeckPath="recipe-book-slides" title="Our Recipes" />
    </div>
  );
}

export default RecipeBook;
