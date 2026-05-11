import api from './api'

export const productService = {
  // GET /api/products?name=&category=
  async getAll({ name, category } = {}) {
    const { data } = await api.get('/products', { params: { name, category } })
    return data
  },

  // GET /api/products/:id
  async getById(id) {
    const { data } = await api.get(`/products/${id}`)
    return data
  },

  // POST /api/products  (admin only)
  async create(product) {
    const { data } = await api.post('/products', product)
    return data
  },

  // PUT /api/products/:id  (admin only)
  async update(id, product) {
    const { data } = await api.put(`/products/${id}`, product)
    return data
  },

  // DELETE /api/products/:id  (admin only)
  async remove(id) {
    const { data } = await api.delete(`/products/${id}`)
    return data
  },
}
