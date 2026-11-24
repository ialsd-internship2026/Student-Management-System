import { adminAPI } from '../../../services/api';

export const scheduleService = {
  getSchedule: (params) => adminAPI.getSchedule(params),
  createSession: (data) => adminAPI.createSession(data),
  updateSession: (id, data, applyTo) => adminAPI.updateSession(id, data, applyTo),
  deleteSession: (id, applyTo) => adminAPI.deleteSession(id, applyTo),
  scheduleAssessment: (data) => adminAPI.scheduleAssessment(data),
  exportSchedule: () => adminAPI.exportSchedule()
};

export default scheduleService;
