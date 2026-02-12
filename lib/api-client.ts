import axios, { AxiosInstance, AxiosError } from 'axios';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Enviar cookies com requisições
    });

    // Interceptor para erro de autenticação
    this.client.interceptors.response.use(
      response => response,
      error => {
        if (error.response?.status === 401) {
          // Redirecionar para login se token expirou
          if (typeof window !== 'undefined') {
            window.location.href = '/';
          }
        }
        return Promise.reject(error);
      }
    );
  }

  async login(email: string, password: string) {
    return this.client.post('/auth/login', { email, password });
  }

  async logout() {
    return this.client.post('/auth/logout');
  }

  async getMe() {
    return this.client.get('/auth/me');
  }

  // Métodos para eventos (preparados para futuro)
  async getEvents() {
    return this.client.get('/events');
  }

  async getEvent(id: string) {
    return this.client.get(`/events/${id}`);
  }

  async createEvent(data: any) {
    return this.client.post('/events', data);
  }

  async updateEvent(id: string, data: any) {
    return this.client.put(`/events/${id}`, data);
  }

  async deleteEvent(id: string) {
    return this.client.delete(`/events/${id}`);
  }

  // Métodos para check-in de convidados (preparados para futuro)
  async checkInGuest(eventId: string, guestId: string) {
    return this.client.post(`/events/${eventId}/check-in`, { guestId });
  }

  async getGuestList(eventId: string) {
    return this.client.get(`/events/${eventId}/guests`);
  }
}

export const apiClient = new ApiClient();
