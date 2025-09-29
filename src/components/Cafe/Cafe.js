import "./Cafe.css";
import cafeImage2 from './Drinks.jpeg';
import cafeImage3 from './pizza.jpg';


function Cafe() {
    return (
        <div className="cafeTab">
            <h3>Eat and drink at our delicious cafe</h3>
            <div className="main-image">
              <img src={"Images/BigImageCafe.jpg"} alt="A cafe" />
            </div>
            <div className="menu">
                <h2>Our Menu</h2>
                <div className="flexbox">
                    <div className="Foods">
                        <h3>Foods</h3>
                        <ul>
                            <li>Pizza</li>
                            <li>Pasta</li>
                            <li>Asian</li>
                        </ul>
                        <img src={cafeImage3} alt="Food" />
                    </div>
                    <div className="Drinks">
                        <h3>Drinks</h3>
                        <ul>
                            <li>Coke</li>
                            <li>Juice</li>
                            <li>Alcohol</li>
                        </ul>
                        <img src={"Images/DrinksGood.webp"} alt="Drinks" />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Cafe;