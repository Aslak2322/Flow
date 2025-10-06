import './Cart.css';
import { useNavigate } from 'react-router-dom';

function Cart({ cart, setCart, removeFromCart, user }) {
  const navigate = useNavigate();

  const handleCheckout = async () => {
    if (cart.length === 0) return alert("Cart is empty");

    const token = localStorage.getItem('token');
    if (!token) {
      alert("Please log in first!");
      return navigate('/login'); // redirect to login if no token
    }

    try {
      const response = await fetch("http://localhost:4000/checkout", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json", 
          "Authorization": `Bearer ${token}` 
        },
        body: JSON.stringify({ cart, user_id: user?.id }) 
      });

      if (response.status === 401) {
        alert("Session expired or not logged in. Please log in.");
        return navigate('/login'); // redirect if backend says unauthorized
      }

      const result = await response.json();

      if (result.success) {
        alert("Order submitted successfully!");
        setCart([]); // clear frontend cart
      } else {
        alert(result.message || "Failed to checkout");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to checkout");
    }
  };

  return (
    <div>
      <h2>Your Cart</h2>
      <div className='cartItems'>
        {cart.length === 0 && <p>No items in cart</p>}
        <ul>
          {cart.map(item => (
            <li key={item.id}>
              {item.type === 'Product' && (
                <div className='ProductCard'>
                  <span><strong>{item.name}</strong> - ${item.price} x {item.quantity}</span>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              )}
              {item.type === 'Booking' && (
                <div className='ProductCard'>
                  <span><strong>Booking</strong>: {item.date} {item.starttime}-{item.endtime} - ${item.price}</span>
                  <button onClick={() => removeFromCart(item.id)}>Remove</button>
                </div>
              )}
            </li>
          ))}
        </ul>
        <button onClick={handleCheckout}>Checkout</button>
      </div>
    </div>
  );
};

export default Cart;


//Fix the bookign conditional.