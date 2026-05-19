import api from './api'

export const analyticsService = {
  async getMetrics() {
    const { data } = await api.get('/analytics')
    return data
  },
  async getInsights(metrics) {
    const { data } = await api.post('/ai/insights', metrics)
    return data
  },
}
