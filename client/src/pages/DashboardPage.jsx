import React from 'react';
import CoursesSectionsView from '../features/courses/components/CoursesSectionsView';
import StudentsResultsView from '../features/students/components/StudentsResultsView';
import OverviewView from '../features/overview/components/OverviewView';
import AttendanceView from '../features/attendance/components/AttendanceView';
import ScheduleView from '../features/schedule/components/ScheduleView';
import TeachersView from '../features/teachers/components/TeachersView';

export default function DashboardPage({
  activeNav,
  workspace,
  courses,
  setCourses,
  sections,
  setSections,
  students,
  setStudents,
  teachers,
  setTeachers,
  departments,
  announcements,
  upcomingNotice,
  timetables,
  setTimetables,
  activeCourseId,
  setActiveCourseId,
  activeStudentId,
  setSelectedStudentId,
  teacherUser,
  showToast,
  onNavigate,
  onOpenCreateCourse,
  onOpenAddSection,
  onOpenReportModal,
  onAddAnnouncement,
  onUpdateAnnouncement,
  onDeleteAnnouncement,
  onUpdateUpcomingNotice,
  onOpenEditTermWidget,
  onOpenCustomizer,
  onOpenEditProfile,
  onAddDepartment,
  onRenameDepartment,
  onDeleteDepartment
}) {
  if (activeNav === 'courses') {
    return (
      <CoursesSectionsView
        courses={courses}
        setCourses={setCourses}
        sections={sections}
        setSections={setSections}
        teachers={teachers}
        onOpenCreateCourse={onOpenCreateCourse}
        onOpenAddSection={onOpenAddSection}
        showToast={showToast}
        selectedCourseId={activeCourseId}
        setSelectedCourseId={setActiveCourseId}
      />
    );
  }

  if (activeNav === 'students') {
    return (
      <StudentsResultsView
        students={students}
        setStudents={setStudents}
        onOpenReportModal={onOpenReportModal}
        showToast={showToast}
        workspace={workspace}
        teacherUser={teacherUser}
        sections={sections}
        selectedStudentId={activeStudentId}
        setSelectedStudentId={setSelectedStudentId}
      />
    );
  }

  if (activeNav === 'overview' || activeNav === 'resources') {
    return (
      <OverviewView
        workspace={workspace}
        courses={courses}
        students={students}
        onNavigate={onNavigate}
        announcements={announcements}
        onAddAnnouncement={onAddAnnouncement}
        onUpdateAnnouncement={onUpdateAnnouncement}
        onDeleteAnnouncement={onDeleteAnnouncement}
        upcomingNotice={upcomingNotice}
        onUpdateUpcomingNotice={onUpdateUpcomingNotice}
        showToast={showToast}
        onOpenEditTermWidget={onOpenEditTermWidget}
        onOpenCustomizer={onOpenCustomizer}
        onOpenEditProfile={onOpenEditProfile}
      />
    );
  }

  if (activeNav === 'attendance') {
    return (
      <AttendanceView
        students={students}
        setStudents={setStudents}
        sections={sections}
        showToast={showToast}
      />
    );
  }

  if (activeNav === 'schedule') {
    return (
      <ScheduleView
        workspace={workspace}
        sections={sections}
        showToast={showToast}
        timetableBySection={timetables}
        setTimetableBySection={setTimetables}
      />
    );
  }

  if (activeNav === 'teachers') {
    return (
      <TeachersView
        courses={courses}
        setCourses={setCourses}
        teachers={teachers}
        setTeachers={setTeachers}
        departments={departments}
        onAddDepartment={onAddDepartment}
        onRenameDepartment={onRenameDepartment}
        onDeleteDepartment={onDeleteDepartment}
        showToast={showToast}
      />
    );
  }

  return null;
}
