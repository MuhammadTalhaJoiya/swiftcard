import api from './api'

export const orderService = {
  async getMyOrders() {
    const { data } = await api.get('/orders/myorders')
    return data
  },

  async getById(id) {
    const { data } = await api.get(`/orders/${id}`)
    return data
  },

  async create(orderData) {
    const { data } = await api.post('/orders', orderData)
    return data
  },

  async getAll() {
    const { data } = await api.get('/orders')
    return data
  },

  async updateStatus(id, status) {
    const { data } = await api.put(`/orders/${id}/status`, { status })
    return data
  },
}
