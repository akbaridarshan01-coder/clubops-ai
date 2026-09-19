const API_BASE = '/api';

function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('clubops_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = { ...getAuthHeaders(), ...(options.headers || {}) };
  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.error || `HTTP error! Status: ${res.status}`);
  }

  return res.json();
}

export const api = {
  // Auth
  register: (data: any) => request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
  verifyOtp: (data: any) => request('/auth/verify-otp', { method: 'POST', body: JSON.stringify(data) }),
  sendLoginOtp: (identifier: string) => request('/auth/send-email-otp', { method: 'POST', body: JSON.stringify({ identifier }) }),
  login: (data: any) => request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
  getMe: () => request('/auth/me'),

  // Clubs
  createClub: (data: any) => request('/clubs', { method: 'POST', body: JSON.stringify(data) }),
  getMyClubs: () => request('/clubs/my'),
  getClub: (id: string) => request(`/clubs/${id}`),
  joinClub: (joinCode: string) => request('/clubs/join', { method: 'POST', body: JSON.stringify({ joinCode }) }),

  // Events
  createEvent: (data: any) => request('/events', { method: 'POST', body: JSON.stringify(data) }),
  getClubEvents: (clubId: string) => request(`/events?clubId=${clubId}`),
  getEvent: (id: string) => request(`/events/${id}`),
  updateEvent: (id: string, data: any) => request(`/events/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  getEventHealth: (id: string) => request(`/events/${id}/health`),

  // Tasks
  getTasks: (eventId: string, filters: any = {}) => {
    const params = new URLSearchParams({ eventId, ...filters });
    return request(`/tasks?${params}`);
  },
  createTask: (data: any) => request('/tasks', { method: 'POST', body: JSON.stringify(data) }),
  updateTask: (id: string, data: any) => request(`/tasks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteTask: (id: string) => request(`/tasks/${id}`, { method: 'DELETE' }),
  assignTask: (id: string, assigneeId: string | null) => request(`/tasks/${id}/assign`, { method: 'POST', body: JSON.stringify({ assigneeId }) }),
  addDependency: (id: string, dependsOnTaskId: string, type?: string) => request(`/tasks/${id}/dependency`, { method: 'POST', body: JSON.stringify({ dependsOnTaskId, type }) }),
  removeDependency: (id: string, dependsOnTaskId: string) => request(`/tasks/${id}/dependency/${dependsOnTaskId}`, { method: 'DELETE' }),

  // Volunteers
  getVolunteers: (clubId: string, teamId?: string) => {
    const q = teamId ? `?clubId=${clubId}&teamId=${teamId}` : `?clubId=${clubId}`;
    return request(`/volunteers${q}`);
  },
  createVolunteer: (data: any) => request('/volunteers', { method: 'POST', body: JSON.stringify(data) }),
  matchVolunteersForTask: (taskId: string) => request(`/volunteers/match/${taskId}`),

  // Meetings
  processMeeting: (data: any) => request('/meetings/process', { method: 'POST', body: JSON.stringify(data) }),
  getEventMeetings: (eventId: string) => request(`/meetings?eventId=${eventId}`),
  getMeeting: (id: string) => request(`/meetings/${id}`),
  convertMeetingItem: (actionItemId: string, eventId: string) => request('/meetings/convert-item', { method: 'POST', body: JSON.stringify({ actionItemId, eventId }) }),
  convertAllMeetingItems: (meetingId: string) => request(`/meetings/${meetingId}/convert-all`, { method: 'POST' }),

  // Risks
  getRisks: (eventId: string, severity?: string) => {
    const q = severity ? `?eventId=${eventId}&severity=${severity}` : `?eventId=${eventId}`;
    return request(`/risks${q}`);
  },
  createRisk: (data: any) => request('/risks', { method: 'POST', body: JSON.stringify(data) }),
  updateRiskStatus: (id: string, status: string, mitigationNotes?: string) => request(`/risks/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, mitigationNotes }) }),
  runRiskAnalysis: (eventId: string) => request('/risks/analyze', { method: 'POST', body: JSON.stringify({ eventId }) }),

  // AI
  copilotQuery: (eventId: string, query: string) => request('/ai/copilot', { method: 'POST', body: JSON.stringify({ eventId, query }) }),
  executeAiAction: (action: any) => request('/ai/action', { method: 'POST', body: JSON.stringify({ action }) }),
  runWhatIf: (data: any) => request('/ai/what-if', { method: 'POST', body: JSON.stringify(data) }),
  generateAnnouncement: (data: any) => request('/ai/announcement', { method: 'POST', body: JSON.stringify(data) }),
  queryBrain: (clubId: string, query: string) => request('/ai/brain', { method: 'POST', body: JSON.stringify({ clubId, query }) }),

  // Documents
  uploadDocument: (data: any) => request('/documents/upload', { method: 'POST', body: JSON.stringify(data) }),
  getDocuments: (clubId: string, category?: string) => {
    const q = category ? `?clubId=${clubId}&category=${category}` : `?clubId=${clubId}`;
    return request(`/documents${q}`);
  },
  deleteDocument: (id: string) => request(`/documents/${id}`, { method: 'DELETE' }),

  // Announcements
  getAnnouncements: (eventId: string) => request(`/announcements?eventId=${eventId}`),
  createAnnouncement: (data: any) => request('/announcements', { method: 'POST', body: JSON.stringify(data) }),

  // Notifications
  getNotifications: () => request('/notifications'),
  markNotificationRead: (id: string) => request(`/notifications/${id}/read`, { method: 'PATCH' }),
  markAllNotificationsRead: () => request('/notifications/mark-all-read', { method: 'POST' }),

  // Analytics
  getAnalytics: (eventId: string) => request(`/analytics/${eventId}`),
  getPostEventReport: (eventId: string) => request(`/analytics/${eventId}/report`),
};
