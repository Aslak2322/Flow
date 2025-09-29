import './Cart.css';

function Cart({ cart, setCart, removeFromCart }) {
    const handleCheckout = async () => {
        if (cart.length === 0) return alert("Cart is empty");
      
        try {
          const response = await fetch("http://localhost:4000/checkout", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ cart, user_id: 1 }) // include user id
          });
          const result = await response.json();
          console.log(result);
          alert("Order submitted successfully!");
          setCart([]); // clear frontend cart
        } catch (err) {
          console.error(err);
          alert("Failed to checkout");
        }
      };

    return(
        <div>
            <h2>Your Cart</h2>
            <div className='cartItems'>
                {cart.length === 0 && <p>No items in cart</p>}
                <ul>
                    {cart.map(item => (
                        <li key={item.id} >
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
    )
};

export default Cart;

//Fix the bookign conditional.