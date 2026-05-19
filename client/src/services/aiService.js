import api from './api'

export const aiService = {
  async chat(message, history) {
    const { data } = await api.post('/ai/chat', { message, history })
    return data
  },
  async generateDescription(name, features) {
    const { data } = await api.post('/ai/generate-description', { name, features })
    return data
  },
  async invoiceOcr(formData) {
    const { data } = await api.post('/ai/invoice-ocr', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
  },
}
