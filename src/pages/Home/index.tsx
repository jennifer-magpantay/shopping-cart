import React, { useState, useEffect } from "react";
import { MdAddShoppingCart } from "react-icons/md";

import { ProductList } from "./styles";
import { api } from "../../services/api";
import { formatPrice } from "../../util/format";
import { useCart } from "../../hooks/useCart";

interface Product {
  id: number;
  title: string;
  price: number;
  image: string;
}

interface ProductFormatted extends Product {
  priceFormatted: string;
}

interface CartItemsAmount {
  [key: number]: number;
}

const Home = (): JSX.Element => {
  const [products, setProducts] = useState<ProductFormatted[]>([]);

  // call the hook
  const { addProduct, cart } = useCart();

  const cartItemsAmount = cart.reduce((sumAmount, product) => {
    //  1. get a copy of sumAmount as obj
    const sumProductsAmount = { ...sumAmount };
    // 2. gets the amount of the product by the key [product.id]
    sumProductsAmount[product.id] = product.amount;
    return sumProductsAmount;
  }, {} as CartItemsAmount);

  useEffect(() => {
    async function loadProducts() {
      // render the product data + prices
      const response = await api.get<Product[]>("/products");
      const data = response.data.map((product) => ({
        ...product,
        priceFormatted: formatPrice(product.price),
      }));
      setProducts(data);
    }

    loadProducts();
  }, []);

  function handleAddProduct(id: number) {
    // call the function from useCart hook to add a product to the shopping cart
    addProduct(id);
  }

  return (
    <ProductList>
      {/* set products map to render the list*/}
      {products.map((product) => (
        <li key={product.id}>
          <img src={product.image} alt={product.title} />
          <strong>{product.title}</strong>
          <span>{product.priceFormatted}</span>
          <button
            type="button"
            data-testid="add-product-button"
            onClick={() => handleAddProduct(product.id)}
          >
            <div data-testid="cart-product-quantity">
              <MdAddShoppingCart size={16} color="#FFF" />
              {cartItemsAmount[product.id] || 0}
            </div>

            <span>ADICIONAR AO CARRINHO</span>
          </button>
        </li>
      ))}
    </ProductList>
  );
};

export default Home;
