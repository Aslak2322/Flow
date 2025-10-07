import "./Shop.css";
import { useState, useEffect } from "react";

function Shop({cart, addToCart}) {
    //hardcode products display them, make them orderable.
    /*
    Products:
    Name.
    Description.
    Picture.
    Have these in the database
    */

    const [products, setProducts] = useState([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        fetch(`${process.env.REACT_APP_BACKEND_URL}/products`)
          .then(res => res.json())
          .then(data => {
            setProducts(data)
            setIsLoading(false)
            console.log(data)
          })
          .catch(err => {
            console.error('Error fetching products', err);
            setIsLoading(false)
          })
    }, [])

    return(
        <div className="shop-container">
            <h2>
                Shop
            </h2>
            <div className="card-list">
                {products.map((product) => (
                    <div className="Product" key={product.id}>
                        <div className="card">
                            <h2>{product.name}</h2>
                            <img src={`/Images/${product.image_url}`} alt="test" />
                            <h3>{product.description}</h3>
                            <h3 className="price">${product.price}</h3>
                        </div>
                        <button onClick={() => {
                            addToCart({ ...product, type: 'Product' }); 
                            console.log("Cart after adding", cart);
                        }}>Add to Cart</button>
                    </div>
                ))}
            </div>
        </div>
    )
}

export default Shop;