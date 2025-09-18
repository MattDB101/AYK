import React, { useState } from 'react';
import { useRecipes } from '../../hooks/recipes/useRecipes';
import { useCart } from '../../context/cartContext';
import { useNavigate } from 'react-router-dom'; // <-- Add this import
import styles from './orders.module.css';
import ArrowDown01Icon from '../../components/icons/arrow-down-01-stroke-rounded';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';

const FILTERS = ['Breakfast', 'Lunch', 'Dinner', 'Dessert'];
const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

function Orders() {
  const { groupedRecipes, loading, error } = useRecipes();
  const { addToCart } = useCart();
  const navigate = useNavigate(); // <-- Add this line
  const [activeFilters, setActiveFilters] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [selectedYear, setSelectedYear] = useState('');
  const [shakeButtonId, setShakeButtonId] = useState(null);
  const [highlightYear, setHighlightYear] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedQty, setSelectedQty] = useState(1);

  // Flatten grouped recipes for easier filtering/search
  const allRecipes = [
    ...(groupedRecipes.breakfast || []),
    ...(groupedRecipes.lunch || []),
    ...(groupedRecipes.dinner || []),
    ...(groupedRecipes.dessert || []),
  ];

  // Filter recipes
  const filteredRecipes = allRecipes.filter((recipe) => {
    const recipeCategory = (recipe.category || '').toLowerCase();
    const matchesFilter =
      activeFilters.length === 0 || activeFilters.map((f) => f.toLowerCase()).includes(recipeCategory);
    const matchesSearch = recipe.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const recipesPerPage = 6;
  const totalPages = Math.ceil(filteredRecipes.length / recipesPerPage);
  const paginatedRecipes = filteredRecipes.slice((page - 1) * recipesPerPage, page * recipesPerPage);

  // Handle filter button click
  const handleFilterClick = (filter) => {
    setPage(1);
    if (activeFilters.includes(filter)) {
      setActiveFilters(activeFilters.filter((f) => f !== filter));
    } else {
      setActiveFilters([...activeFilters, filter]);
    }
  };

  // Clear all filters
  const handleClearFilters = () => {
    setActiveFilters([]);
    setPage(1);
  };

  // Handle year selection
  const handleYearChange = (e) => {
    setSelectedYear(e.target.value);
  };

  // Handle add to cart
  const handleAddToCart = (recipe) => {
    if (!selectedYear) {
      setShakeButtonId(recipe.id);
      setHighlightYear(true);
      setTimeout(() => setShakeButtonId(null), 500);
      setTimeout(() => setHighlightYear(false), 20000);
      return;
    }
    setHighlightYear(false);

    // Use local date formatting
    const pad = (n) => n.toString().padStart(2, '0');
    const formatDateLocal = (date) => `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;

    addToCart({
      ...recipe,
      year: selectedYear,
      date: selectedDate ? formatDateLocal(selectedDate) : null,
      qty: selectedQty,
    });
  };

  return (
    <div className={styles.ordersContainer}>
      {/* Step 01: Select Class */}

      <div className={styles.cartContainer}>
        <div className={styles.actions}>
          <div className={styles.stepHeadingContainer}>
            <span className={styles.stepLabel}>
              Step <span className={styles.stepCircle}>01</span>
            </span>
          </div>
          <h2 className={styles.selectClass}>Order Details:</h2>
          <div className={styles.yearDropdownContainer}>
            <div className={styles.yearAndDateRow}>
              <label htmlFor="year-select" className={styles.yearDropdownLabel}></label>
              <div className={styles.selectWrapper}>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={handleYearChange}
                  className={`${styles.yearDropdown} ${highlightYear ? styles.yearDropdownError : ''}`}
                >
                  <option value="" disabled>
                    Select Year
                  </option>
                  {YEARS.map((year) => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                <span className={styles.arrowIcon}>
                  <ArrowDown01Icon width={20} height={20} color="#fff" />
                </span>
              </div>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Delivery Date"
                  value={selectedDate}
                  onChange={setSelectedDate}
                  format="dd-MM-yyyy"
                  slotProps={{
                    textField: {
                      size: 'small',
                      className: styles.orderDateInput,
                      variant: 'outlined',
                      placeholder: 'DD-MM-YYYY',
                      InputLabelProps: { style: { color: '#588157', fontFamily: 'Bitter', fontWeight: 600 } },
                      sx: {
                        background: '#ffffff',
                        borderRadius: '32px',
                        fontFamily: 'Bitter',
                        color: '#588157',

                        width: '200px',

                        '& input': {
                          padding: '6px 6px 8px 18px',
                          fontSize: '1.2rem',
                          fontFamily: 'Bitter',
                          fontWeight: 600,
                          color: '#588157',
                        },
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '32px',

                          '& fieldset': {
                            borderColor: '#588157',

                            borderWidth: '3px',
                          },
                          '&:hover fieldset': {
                            borderColor: '#588157',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#588157',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: '#588157',
                          fontFamily: 'Bitter',

                          fontWeight: 600,
                        },
                      },
                    },
                  }}
                  shouldDisableDate={(date) => {
                    // Example: Only allow weekdays (Mon-Fri)
                    const day = date.getDay();
                    return day === 0 || day === 6;
                  }}
                />
              </LocalizationProvider>
              <div className={styles.cartQtySection}>
                <div className={styles.qtyLabel}>Qty:</div>

                <button
                  className={styles.cartQtyBtn}
                  onClick={() => setSelectedQty((q) => Math.max(1, q - 1))}
                  type="button"
                >
                  &#8722;
                </button>
                <span className={styles.cartQtyValue}>{selectedQty}</span>
                <button className={styles.cartQtyBtn} onClick={() => setSelectedQty((q) => q + 1)} type="button">
                  &#43;
                </button>
              </div>
            </div>
          </div>
        </div>
        <button className={`${styles.btn} ${styles.viewCartBtn}`} onClick={() => navigate('/orders/cart')}>
          View Basket
        </button>
      </div>

      {/* Step 02: Select Recipes */}
      <div className={styles.stepHeadingContainer}>
        <span className={styles.stepLabel}>
          Step <span className={styles.stepCircle}>02</span>
        </span>
      </div>
      <h2 className={styles.selectRecipes}>Select recipes:</h2>
      <div className={styles.innerContent}>
        <div className={styles.filters}>
          {FILTERS.map((filter) => (
            <button
              key={filter}
              className={`${styles.filterBtn} ${activeFilters.includes(filter) ? styles.active : ''}`}
              onClick={() => handleFilterClick(filter)}
            >
              {filter}
            </button>
          ))}
          <button className={styles.clearFiltersBtn} onClick={handleClearFilters}>
            Clear Filters ✕
          </button>
          <input
            type="text"
            className={styles.searchInput}
            placeholder="Search recipe book..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {loading && <div className={styles.loading}>Loading recipes...</div>}
        {error && <div className={styles.error}>Error: {error}</div>}

        <div className={styles.recipeGrid}>
          {paginatedRecipes.map((recipe) => (
            <div key={recipe.id} className={styles.recipeCard}>
              <img src={recipe.imageUrl} alt={recipe.name} className={styles.recipeImage} />
              <div className={styles.recipeContent}>
                <h3 className={styles.recipeTitle}>{recipe.name}</h3>
                <p className={styles.recipeDesc}>{recipe.description}</p>
                <div className={styles.recipeMetaContainer}>
                  <div className={styles.recipeMeta}>
                    <span className={styles.recipeComponents}>
                      Uses Components
                      <br />
                      {recipe.allergens?.join(' & ') || 'N/A'}
                    </span>
                  </div>
                  <button
                    className={`${styles.addToCartBtn} ${shakeButtonId === recipe.id ? styles.shake : ''}`}
                    onClick={() => handleAddToCart(recipe)}
                    title={!selectedYear ? 'Select a year before adding to basket' : ''}
                  >
                    Add To Basket
                  </button>
                </div>
                {recipe.isVegetarian && <span className={styles.vegBadge}>V</span>}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.pagination}>
          <span className={styles.paginationInfo}>
            Showing {paginatedRecipes.length > 0 ? (page - 1) * recipesPerPage + 1 : 0} to{' '}
            {Math.min(page * recipesPerPage, filteredRecipes.length)} of {filteredRecipes.length} results
          </span>
          <div className={styles.pageNumbers}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`${styles.pageBtn} ${page === i + 1 ? styles.activePage : ''}`}
                onClick={() => setPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Orders;
