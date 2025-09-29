import logo from './logo.svg';
import './App.css';
import Navbar from './components/Navbar/Navbar';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import Home from './components/Home/Home';
import About from './components/About/About';
import Booking from './components/Booking/Booking';
import Contact from './components/Contact/Contact';
import Shop from './components/Shop/Shop';
import Cafe from './components/Cafe/Cafe';
import { useState } from 'react';
import Cart from './components/Cart/Cart';


function App() {
  const [cart, setCart] = useState([])

  const addToCart = (item) => setCart([...cart, item]);
  const removeFromCart = (id) => setCart(cart.filter(i => i.id !== id));
  
  return (
    <div className="App">
      <Router>
        <Navbar cartCount={cart.length} />
        <Routes>
          <Route path="/" element={<Home />}/>
          <Route path="/about" element={<About />} />
          <Route path="/booking" element={<Booking cart={cart} addToCart={addToCart} />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shop" element={<Shop cart={cart} addToCart={addToCart} />} />
          <Route path="/cafe" element={<Cafe />} />
          <Route path="/cart" element={<Cart cart={cart} removeFromCart={removeFromCart} setCart={setCart} />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;