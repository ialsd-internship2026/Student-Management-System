import { adminAPI, teacherAPI } from '../../../services/api';

export const overviewService = {
  getAdminOverview: (params) => adminAPI.getOverview(params),
  getTeacherOverview: (params) => teacherAPI.getOverview(params)
};

export default overviewService;
