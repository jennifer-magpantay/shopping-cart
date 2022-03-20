import {
  createContext,
  ReactNode,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    // get the item from localStorage
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    // is there is any item, return the item - parse the it first (??)
    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    // otherwise, return an empty array
    return [];
  });

  // REFACTORING: create a Ref to listen the changes on cart
  const cartValueRef = useRef<Product[]>();

  useEffect(() => {
    cartValueRef.current = cart;
  });

  // if the previous cart value is undefined, set its current value, otherwise, set cart value
  const previousCartValue = cartValueRef.current ?? cart;

  // now set useEffect to listen the changes and set it when necessary
  useEffect(() => {
    if (previousCartValue !== cart) {
      localStorage.setItem("@RocketShoes:cart", JSON.stringify(cart));
    }
  }, [cart, previousCartValue]);

  // add to the shopping cart
  const addProduct = async (productId: number) => {
    const productUrl = `/products/${productId}`;
    const productStockUrl = `/stock/${productId}`;

    try {
      // 1. get a copy of cart
      const shoppingCart = [...cart];

      // 2. verify if the product already exists on shopping cart
      const productExists = shoppingCart.find(
        (product) => product.id === productId
      );

      // 3. check product amount on stock
      // get the amount of the selected product on stock
      const stock = await api.get(productStockUrl);
      const stockAmount = stock.data.amount;

      // set a const with the amount of the select product - if existis, increase 01, if not return 1
      const currentProductAmount = productExists ? productExists.amount : 0;
      const amount = currentProductAmount + 1;

      // check stock availability
      // if it fails, then return the error and finish the function
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // 4. if not fails, then check if product exists to update its amount
      if (productExists) {
        productExists.amount = amount;
      }

      // 5. if not exists, add the new item to the array
      else {
        const product = await api.get(productUrl);
        const newProduct = {
          ...product.data,
          amount: 1,
        };
        shoppingCart.push(newProduct);
      }

      // finally, update the cart list and the localStorage with the data
      setCart(shoppingCart);
      // localStorage.setItem("@RocketShoes:cart", JSON.stringify(shoppingCart));
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      // 1. create a copy of cart
      const shoppingCart = [...cart];

      // 2. find the index of the selected product
      const productIndex = shoppingCart.findIndex(
        (product) => product.id === productId
      );

      // 3. if the product existis on the list
      if (productIndex >= 0) {
        // set splice() to delete the product, update the list with the remais products ad persist on the localStorage
        shoppingCart.splice(productIndex, 1);
        setCart(shoppingCart);
        // localStorage.setItem("@RocketShoes:cart", JSON.stringify(shoppingCart));
      } // 4. if not, throw the error
      else {
        throw Error();
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    const productStockUrl = `/stock/${productId}`;

    try {
      // 1. get a copy of cart
      const shoppingCart = [...cart];

      // 2. check product amount on stock
      const stock = await api.get(productStockUrl);
      const stockAmount = stock.data.amount;

      // 3. check amount and stock avaialbility
      // if the arg amount if <=0, return and finish the app
      if (amount <= 0) {
        return;
      }
      // also, if it is greaten then stck amount, return the error and finish the function
      if (amount > stockAmount) {
        toast.error("Quantidade solicitada fora de estoque");
        return;
      }

      // 4. If sotck is ok, then verify if the product already exists on shopping cart
      const productExists = shoppingCart.find(
        (product) => product.id === productId
      );

      // 5. if yes, then set the amount to be = arg amount, update cart list and persist on localStorage
      if (productExists) {
        productExists.amount = amount;
        setCart(shoppingCart);
        // localStorage.setItem("@RocketShoes:cart", JSON.stringify(shoppingCart));
      } else {
        throw Error();
      }
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);
  return context;
}
