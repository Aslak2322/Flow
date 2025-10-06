import "./Navbar.css";
import { Link } from "react-router-dom"; 

function Navbar({ cartCount, user, logout }) {
    return(
        <nav className="sidebar">
            <ul>
                <li>
                    <Link to="/cart">
                        <div className="cart-icon">
                            🛒
                            <span className="cart-count">{cartCount}</span>
                        </div>
                    </Link>
                </li>
                <li><Link to="/">Home</Link></li>
                <li><Link to="/about">About Us</Link></li>
                <li><Link to="/booking">Booking</Link></li>
                <li><Link to="/contact">Contact</Link></li>
                <li><Link to="/shop">Shop</Link></li>
                <li><Link to="/cafe">Cafe</Link></li>
                <li>
                    {user ? (
                    <div className="logged-in">
                        <span>Logged in as {user.email}</span>
                        <button onClick={logout}>Logout</button>
                    </div>
                    ) : (
                    <Link to="/login">Login</Link>
                    )}
                </li>
            </ul>
        </nav>
    )
}

export default Navbar;