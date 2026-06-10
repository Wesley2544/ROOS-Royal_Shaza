import { useState, useCallback } from 'react'
import { MenuItem } from './useMenu'
// This hook manages the state of the shopping cart, including items, quantities, and special notes.
export interface CartItem {
  menuItem:  MenuItem
  quantity:  number
  itemNotes: string
}
// Provides functions to add/remove items, get quantities, clear the cart, and calculate totals.
export function useCart() {
  const [items, setItems] = useState<CartItem[]>([])
  const [specialNotes, setSpecialNotes] = useState('')
// Adds an item to the cart or increases quantity if it already exists.
  const addItem = useCallback((menuItem: MenuItem) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItem.id)
      if (existing) {
        return prev.map(i =>
          i.menuItem.id === menuItem.id
            ? { ...i, quantity: i.quantity + 1 }
            : i
        )
      }
      return [...prev, { menuItem, quantity: 1, itemNotes: '' }]
    })
  }, [])
// Removes an item from the cart or decreases quantity if more than one exists.
  const removeItem = useCallback((menuItemId: string) => {
    setItems(prev => {
      const existing = prev.find(i => i.menuItem.id === menuItemId)
      if (!existing) return prev
      if (existing.quantity === 1) {
        return prev.filter(i => i.menuItem.id !== menuItemId)
      }
      return prev.map(i =>
        i.menuItem.id === menuItemId
          ? { ...i, quantity: i.quantity - 1 }
          : i
      )
    })
  }, [])
// Retrieves the quantity of a specific menu item in the cart.
  const getQuantity = useCallback((menuItemId: string) => {
    return items.find(i => i.menuItem.id === menuItemId)?.quantity || 0
  }, [items])

  const clearCart = useCallback(() => {
    setItems([])
    setSpecialNotes('')
  }, [])

  const totalItems    = items.reduce((sum, i) => sum + i.quantity, 0)
  const totalAmount   = items.reduce((sum, i) => sum + i.menuItem.price * i.quantity, 0)

  return {
    items, specialNotes, setSpecialNotes,
    addItem, removeItem, getQuantity,
    clearCart, totalItems, totalAmount,
  }
}