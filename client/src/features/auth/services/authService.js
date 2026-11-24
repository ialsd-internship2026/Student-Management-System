import { authAPI } from '../../../services/api';

export const authService = {
  login: (email, password) => authAPI.login(email, password),
  register: (data) => authAPI.register(data),
  logout: () => authAPI.logout(),
  getCurrentUser: () => authAPI.me()
};

export default authService;
