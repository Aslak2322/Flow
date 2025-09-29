import "./Home.css";
import { useNavigate } from "react-router-dom";

function Home() {

    const navigate = useNavigate();

    return(
        <div className="Home">
            <h1>FlowHouse Copenhagen</h1>
            <div className="info">
              <h2>Denmarks's First Flowrider</h2>
              <button onClick={() => navigate("/about")}>Learn More</button>
            </div>
            <div className="booking">
                <h2>Try It</h2>
                <button onClick={() => navigate("/booking")}>Book a Session</button>
            </div>
            <div className="cafe">
                <h2>Looking for Something to Eat</h2>
                <button onClick={() => navigate("/cafe")}>See our Cafe</button>
            </div>
            <div className="contact">
                <h2>Want more Information?</h2>
                <button onClick={() => navigate("/contact")}>Contact Us</button>
            </div>
            <div className="shop">
                <h2>Looking for Gear?</h2>
                <button onClick={() => navigate("/shop")}>Shop</button>
            </div>
            <footer>FlowHouse Copenhagen 2025</footer>
        </div>
    )
}

export default Home;