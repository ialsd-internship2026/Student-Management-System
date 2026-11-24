import { teacherAPI } from '../../../services/api';

export const attendanceService = {
  getAttendance: (params) => teacherAPI.getAttendance(params),
  saveAttendance: (data) => teacherAPI.saveAttendance(data),
  submitAttendance: (id) => teacherAPI.submitAttendance(id)
};

export default attendanceService;
