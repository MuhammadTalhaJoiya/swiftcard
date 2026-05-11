import api from './api'

export const cartService = {
  async get() {
    const { data } = await api.get('/cart')
    return data
  },

  async addItem(productId, qty = 1) {
    const { data } = await api.post('/cart', { productId, qty })
    return data
  },

  async updateItem(productId, qty) {
    const { data } = await api.put(`/cart/${productId}`, { qty })
    return data
  },

  async removeItem(productId) {
    const { data } = await api.delete(`/cart/${productId}`)
    return data
  },

  async clear() {
    const { data } = await api.delete('/cart')
    return data
  },
}
