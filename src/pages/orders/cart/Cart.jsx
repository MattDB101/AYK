import { useCart } from '../../../context/CartContext';
import styles from './cart.module.css';
import { useNavigate } from 'react-router-dom';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { useOrder } from '../../../hooks/useOrder';

const YEARS = ['1st Year', '2nd Year', '3rd Year', '4th Year', '5th Year', '6th Year'];

function Cart() {
  const { cart, removeFromCart, clearCart, updateQty, updateNotes, updateDate, updateYear } = useCart();
  const navigate = useNavigate();
  const { createOrder } = useOrder();

  const increaseQty = (item) => {
    updateQty(item, (item.qty || 1) + 1);
  };

  const decreaseQty = (item) => {
    if ((item.qty || 1) > 1) {
      updateQty(item, (item.qty || 1) - 1);
    }
  };

  // Only allow weekdays (Mon-Fri)
  const isAllowedDate = (date) => {
    if (!date) return false;
    const day = date.getDay();
    return day !== 0 && day !== 6;
  };

  const handleConfirmOrder = async () => {
    try {
      await createOrder(cart);
      clearCart();
      alert('Order placed successfully!');
    } catch (err) {
      alert('Error placing order: ' + err.message);
    }
  };

  return (
    <div className={styles.cartContainer}>
      <button className={styles.backButton} onClick={() => navigate('/order')}>
        ← Return to Ordering Page
      </button>
      <div className={styles.cartBox}>
        <div className={styles.cartHeader}>Order List</div>
        <div className={styles.cartSubheader}>You have {cart.length} recipes selected.</div>
        {cart.length === 0 && <p>Your cart is empty.</p>}
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          {cart.map((item, idx) => (
            <div className={styles.cartCard} key={item.id + item.year + idx}>
              <img src={item.imageUrl} alt={item.name} className={styles.cartImage} />
              <div className={styles.cartDetails}>
                <div className={styles.cartTitle}>{item.name}</div>
                <div className={styles.cartYear}>
                  Class:&nbsp;
                  <select
                    value={item.year}
                    onChange={(e) => updateYear(item, e.target.value)}
                    className={styles.cartYearDropdown}
                  >
                    {YEARS.map((year) => (
                      <option key={year} value={year}>
                        {year}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.cartQtySection}>
                <button className={styles.cartQtyBtn} onClick={() => decreaseQty(item)}>
                  &#8722;
                </button>
                <span className={styles.cartQtyValue}>{item.qty || 1}</span>
                <button className={styles.cartQtyBtn} onClick={() => increaseQty(item)}>
                  &#43;
                </button>
              </div>
              <div className={styles.cartNotes}>
                Order Notes:
                <input
                  className={styles.cartNotesInput}
                  value={item.notes || ''}
                  onChange={(e) => updateNotes(item, e.target.value)}
                  placeholder="e.g. One gluten free portion"
                />
              </div>
              <div className={styles.cartDatePicker}>
                Delivery Date:
                <DatePicker
                  value={item.date ? new Date(item.date) : null}
                  onChange={(newValue) => {
                    if (isAllowedDate(newValue)) {
                      updateDate(item, newValue.toISOString().split('T')[0]);
                    }
                  }}
                  shouldDisableDate={(date) => !isAllowedDate(date)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      className: styles.cartDateInput,
                      variant: 'outlined',
                    },
                  }}
                  format="dd-MM-yyyy" // <-- Set to DD-MM-YYYY
                />
              </div>
              <button className={styles.cartRemoveBtn} onClick={() => removeFromCart(item.id, item.year)}>
                🗑️
              </button>
            </div>
          ))}
        </LocalizationProvider>
        {cart.length > 0 && <button onClick={clearCart}>Clear Cart</button>}
        <div className={styles.cartCheckoutRow}>
          <button className={styles.cartCheckoutBtn} onClick={handleConfirmOrder}>
            Confirm Order <span style={{ fontSize: '1.3em' }}>&rarr;</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default Cart;
