import { createContext, useContext, useReducer } from 'react'

const CartContext = createContext(null)

function cartReducer(state, action) {
  switch (action.type) {
    case 'ADD': {
      const existing = state.find(i => i._id === action.product._id)
      if (existing) {
        return state.map(i =>
          i._id === action.product._id ? { ...i, qty: i.qty + 1 } : i
        )
      }
      return [...state, { ...action.product, qty: 1 }]
    }
    case 'REMOVE':
      return state.filter(i => i._id !== action.id)
    case 'UPDATE_QTY':
      return state.map(i =>
        i._id === action.id ? { ...i, qty: action.qty } : i
      )
    case 'CLEAR':
      return []
    default:
      return state
  }
}

export function CartProvider({ children }) {
  const [items, dispatch] = useReducer(cartReducer, [])

  const itemCount = items.reduce((sum, i) => sum + i.qty, 0)
  const total = items.reduce((sum, i) => sum + i.price * i.qty, 0)

  function addToCart(product) {
    dispatch({ type: 'ADD', product })
  }

  function removeFromCart(id) {
    dispatch({ type: 'REMOVE', id })
  }

  function updateQty(id, qty) {
    if (qty < 1) return removeFromCart(id)
    dispatch({ type: 'UPDATE_QTY', id, qty })
  }

  function clearCart() {
    dispatch({ type: 'CLEAR' })
  }

  return (
    <CartContext.Provider value={{ items, itemCount, total, addToCart, removeFromCart, updateQty, clearCart }}>
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside CartProvider')
  return ctx
}
