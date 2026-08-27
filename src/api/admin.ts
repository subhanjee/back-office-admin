import api from './api';

export const adminApi = {
  analytics: {
    overview: () => api.get('/admin/analytics/overview'),
    affiliate: () => api.get('/admin/analytics/affiliate/stats'),
    search: () => api.get('/admin/analytics/search/stats'),
    searchTrends: (days = 30) => api.get('/admin/analytics/search/trends', { params: { days } }),
    userActivity: () => api.get('/admin/analytics/users/activity'),
    funnel: (days = 30) => api.get('/admin/analytics/funnel', { params: { days } }),
    conversion: (days = 30) => api.get('/admin/analytics/conversion', { params: { days } }),
    otaPerformance: (days = 30) => api.get('/admin/analytics/ota-performance', { params: { days } }),
    popularDestinations: () => api.get('/admin/analytics/destinations/popular'),
    clarity: (numOfDays = 3) => api.get('/admin/analytics/clarity', { params: { numOfDays } }),
    // Range-aware historical analytics. All accept { startDate, endDate, ... }.
    report: {
      overview: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/overview', { params }),
      trends: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/trends', { params }),
      topCruises: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/top-cruises', { params }),
      topSearches: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/top-searches', { params }),
      devices: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/devices', { params }),
      funnel: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/funnel', { params }),
      eventsBreakdown: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/events-breakdown', { params }),
      events: (params?: Record<string, string | number>) => api.get('/admin/analytics/report/events', { params }),
    },
  },
  users: {
    list: (params: Record<string, string | number>) => api.get('/admin/users', { params }),
    detail: (userId: string) => api.get(`/admin/users/${userId}`),
    updateStatus: (userId: string, body: { action: string; reason?: string }) =>
      api.put(`/admin/users/${userId}/status`, body),
    updateQuota: (userId: string, body: { maxTrackedCruises: number; planExpiryDate?: string }) =>
      api.put(`/admin/users/${userId}/quota`, body),
    resetPassword: (userId: string) => api.post(`/admin/users/${userId}/reset-password`),
  },
  catalog: {
    stats: () => api.get('/admin/catalog/stats'),
    cruises: (params?: Record<string, string | number>) => api.get('/admin/catalog/cruises', { params }),
    cruise: (id: number) => api.get(`/admin/catalog/cruises/${id}`),
    updateCruise: (id: number, body: object) => api.patch(`/admin/catalog/cruises/${id}`, body),
    sailings: (params?: Record<string, string | number>) => api.get('/admin/catalog/sailings', { params }),
    ships: (params?: Record<string, string | number>) => api.get('/admin/catalog/ships', { params }),
    otas: () => api.get('/admin/catalog/otas'),
    ports: (params?: Record<string, string | number>) => api.get('/admin/catalog/ports', { params }),
    cruiseLines: () => api.get('/admin/catalog/cruise-lines'),
  },
  pricing: {
    cruises: (params?: Record<string, string | number>) => api.get('/admin/pricing/cruises', { params }),
    drops: (params?: Record<string, string | number>) => api.get('/admin/pricing/drops', { params }),
    cdiDistribution: (params?: Record<string, string | number>) => api.get('/admin/pricing/cdi-distribution', { params }),
    anomalies: (params?: Record<string, string | number>) => api.get('/admin/pricing/anomalies', { params }),
    seasonal: () => api.get('/admin/pricing/seasonal-trends'),
    bookingWindow: () => api.get('/admin/pricing/best-booking-window'),
    lowest: () => api.get('/admin/pricing/lowest-prices'),
    otaComparison: (cruiseId: number) => api.get(`/admin/pricing/ota-comparison/${cruiseId}`),
    cruiseSeries: (cruiseId: number) => api.get(`/admin/pricing/cruise/${cruiseId}/series`),
    detectAnomalies: () => api.post('/admin/pricing/anomalies/detect'),
  },
  etl: {
    status: () => api.get('/admin/etl/status'),
    runs: (params?: Record<string, string | number>) => api.get('/admin/etl/runs', { params }),
    queues: () => api.get('/admin/etl/queues/status'),
    failedJobs: (name: string, page = 1) =>
      api.get(`/admin/etl/queues/${name}/failed`, { params: { page } }),
    retryJob: (name: string, jobId: string) =>
      api.post(`/admin/etl/queues/${name}/failed/${jobId}/retry`),
    dataQuality: () => api.get('/admin/etl/data-quality/latest'),
    refreshDataQuality: () => api.post('/admin/etl/data-quality/refresh'),
  },
  intelligence: {
    cruisePopularity: () => api.get('/admin/intelligence/cruises/popularity'),
    sailingPopularity: () => api.get('/admin/intelligence/sailings/popularity'),
    routes: () => api.get('/admin/intelligence/routes/popularity'),
    cruiseLines: () => api.get('/admin/intelligence/cruise-lines/performance'),
    historical: () => api.get('/admin/intelligence/trends/historical'),
  },
  insights: {
    summary: () => api.get('/admin/insights/summary'),
  },
  notifications: {
    list: (params?: Record<string, string | boolean>) => api.get('/admin/notifications', { params }),
    markRead: (id: string) => api.patch(`/admin/notifications/${id}/read`),
    markAllRead: () => api.post('/admin/notifications/read-all'),
  },
  system: {
    health: () => api.get('/admin/system/health'),
  },
  audit: {
    logs: (params?: Record<string, string | number>) => api.get('/admin/audit/logs', { params }),
  },
};

export default adminApi;
