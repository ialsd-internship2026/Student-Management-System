# Teacher + Student Sections — Student Management System (SMS)
### Build instructions for Antigravity

**Stack:** Backend + database only — Node.js, Express, MongoDB. No frontend/React in this build; these are
the API capabilities a future frontend (or another team) will consume.

**Assumption (flag if wrong):** Role-based from the start (`role: "teacher" | "admin" | "student"`), auth and
data model shared across roles, so admin can be added later without refactoring.

**Reference:** Two sets of screenshots were used to derive scope — an "Aster Institute" teacher portal mockup
(Overview, Attendance sheet, Students & results) and a matching student portal mockup (Overview, Attendance &
schedule, Learning & results). Both are UI mockups only — this file describes the data and API behavior those
screens would need, not any UI to build.

---

# Part A — Teacher

## 1. Scope — three functional areas the API must support

### 1.1 Overview / dashboard data
- Aggregated stats, scoped to a class + term: student count, class attendance %, class performance %, count of students needing support (below an attendance/score threshold — make threshold configurable, default 75%).
- Weekly class performance trend: class average per week vs previous term, filterable by subject.
- Today's teaching schedule for the logged-in teacher (time, subject, class, room).
- Latest exam results summary per class: assessment name, subject, average, pass rate, status (Published/Upcoming).
- At-risk student list with a reason (e.g. "score improved X pts, needs practice").
- Flag for whether today's attendance for a class is still draft/not submitted.

### 1.2 Attendance
- Attendance is scoped by class + session date + session (subject/time slot). A teacher may only read/write attendance for classes in their `assignedClassIds`.
- Per-session register: list of students with a status (Present/Absent/Late) each; bulk "mark all present" support.
- Session summary: counts per status + overall attendance % for that session.
- Session notes: free-text, visible to admins only, never exposed to the student-facing API.
- Two-stage lifecycle: **draft** (editable, not visible to students) → **submit** (locked, now visible to students).

### 1.3 Students & results
- Student listing per class: searchable by name/ID, sortable by attendance %, score %, growth — paginated.
- Per-student detail: attendance %, overall score %, growth (pts since a reference date), class rank — all computed server-side.
- Per-student score trend vs class average, by week.
- Per-student exam results: subject, assessment, score, grade — scoped to courses that student is actually enrolled in.
- Teacher feedback: create + fetch latest feedback entry for a student.
- Class export: CSV/PDF of the current class list and its summary stats.

---

## 2. Data models (MongoDB / Mongoose)

```
User          { name, email, passwordHash, role: teacher|admin|student, subject(s), assignedClassIds: [ObjectId] }
ClassGroup    { name (e.g. "Grade 10-A"), term, teacherIds: [ObjectId], studentIds: [ObjectId] }
Student       { name, studentCode, classId, enrolledSubjects: [String] }
AttendanceRecord {
  classId, sessionDate, sessionSubject, sessionTimeSlot,
  entries: [{ studentId, status: present|absent|late }],
  notes, status: draft|submitted, submittedBy, submittedAt
}
Assessment    { classId, subject, name, maxScore, status: upcoming|published, date }
Result        { assessmentId, studentId, score, grade }
Feedback      { studentId, authorId (teacher), text, createdAt }
```

Derived/computed, not stored as raw truth: attendance %, overall score %, growth, class rank — compute these
server-side from `AttendanceRecord` and `Result` rather than caching duplicated numbers, to avoid drift.

---

## 3. Backend (Node + Express + MongoDB)

Auth: JWT, `role` and `assignedClassIds` embedded in the token/claims. Middleware must reject any request for a
`classId` not in the teacher's `assignedClassIds` — this is the access boundary referenced in the mockup
("You can mark attendance only for Grade 10-A and Grade 10-B").

Suggested endpoints:
```
POST   /api/auth/login
GET    /api/teacher/overview?classId=&term=
GET    /api/teacher/classes                      # classes assigned to this teacher
GET    /api/teacher/attendance?classId=&date=&sessionId=
POST   /api/teacher/attendance                    # save draft
PUT    /api/teacher/attendance/:id/submit
GET    /api/teacher/students?classId=&search=&sort=
GET    /api/teacher/students/:id
GET    /api/teacher/students/:id/results
POST   /api/teacher/students/:id/feedback
GET    /api/teacher/classes/:id/export             # CSV/PDF
```
All routes above require `role=teacher` and assigned-class ownership checks.

---

## 4. Build order (suggested milestones)

1. Auth + role middleware + seed data (a few teachers, 1–2 classes, ~30 students, some attendance/results history).
2. Overview aggregation endpoint, tested against seed data.
3. Attendance: read + bulk mark + draft/submit flow + access-boundary checks.
4. Students & results: list + detail + feedback + export endpoints.
5. Polish: at-risk student detection logic, pagination, input validation, error handling.

## 5. Acceptance criteria
- A teacher can only ever read/write classes in their `assignedClassIds` — any other `classId` returns 403.
- Attendance in "draft" status is excluded from any student-facing query; only "submitted" attendance is included.
- All endpoints are backed by real MongoDB queries against the seeded data (no hardcoded response arrays).

---

# Part B — Student

## 6. Scope — three functional areas the API must support

### 6.1 Overview / dashboard data
- Greeting + current date; a "next milestone" banner (next exam subject + date, a short motivational note, a linked practice set).
- Streak counter: consecutive days of recorded learning activity (see `PracticeActivity` model below).
- 4 stat cards: attendance %, overall performance %, number of enrolled courses, next exam (date + subject).
- Weekly performance trend: student's overall score vs class average, by week, with an "on track" / status flag.
- Today's class sessions (time, subject, topic, room), plus a count of remaining sessions today.
- Per-course progress list (course name, % complete) and a "latest exam results" summary (subject, assessment, score, grade).

### 6.2 Attendance & schedule
- Attendance scoped to the logged-in student only — never another student's records.
- Stats: attendance rate, present count, late count, absent count, plus the eligibility threshold the institute enforces (e.g. must stay ≥85% to remain exam-eligible) and a derived in-good-standing flag.
- Weekly timetable: per day/time slot — subject, teacher, room, mode (in-person/online); supports paging by week (`weekStart` param).
- Recent attendance history: date, course, time, status — paginated, most recent first.
- Attendance-by-course breakdown: present+late / total sessions and % per enrolled course.
- A student must only ever see **submitted** attendance (never draft) and never session notes (teacher/admin-only field).

### 6.3 Learning & results
- Performance-over-time trend (same data source as 6.1's weekly trend, with a date range param) plus a percentile/rank badge (e.g. "top 20% of class").
- Performance by subject: latest graded-assessment average per enrolled subject, with a short auto-generated insight (strongest subject / subject needing most focus).
- Per-course detail: teacher name, description, lesson list each with a status (`completed` | `in_progress` | `up_next`) and overall course progress %.
- "Next best steps" recommendations: short, rule-based suggestions tied to the student's weakest subject and nearest upcoming assessment (not required to be ML-driven — simple rules on the data are fine).
- Exam results table: subject, assessment, date, score, grade, and the teacher's per-result feedback text. Midterm/placeholder rows only appear once a teacher has actually published that result.
- Report export: CSV/PDF of the student's own results.

## 7. Additional data models for the student module
Not shown in the screenshots but needed for a working module — flag any you'd rather simplify or drop:

```
Course         { code, name, term, teacherId, credits, description,
                 lessons: [{ title, order, status: not_started|in_progress|completed }] }
Enrollment     { studentId, courseId, progressPercent }   # or derive progress from lessons directly
Announcement   { classId or courseId, title, body, postedBy, createdAt }
Resource       { classId or courseId, title, fileUrl or link, uploadedBy, createdAt }
PracticeActivity { studentId, date, activityType, completed }   # basis for the streak counter
```
`ClassGroup`, `Student`, `AttendanceRecord`, `Assessment`, `Result`, and `Feedback` are shared with Part A — no
duplicate models needed for those.

## 8. Backend endpoints — student
```
GET    /api/student/overview
GET    /api/student/attendance?from=&to=
GET    /api/student/schedule?weekStart=
GET    /api/student/courses
GET    /api/student/courses/:id
GET    /api/student/results?from=&to=
GET    /api/student/announcements
GET    /api/student/resources?courseId=
GET    /api/student/report/export             # CSV/PDF
```
All routes require `role=student`, and every query is implicitly scoped to `studentId` from the JWT — there is
no `:studentId` path param a student can swap to view someone else's data. Reject any such attempt with 403.

## 9. Build order — student (after Part A's auth/seed milestone)
1. Extend seed data: enroll the seeded students in courses with lesson lists, some practice activity history, a couple of announcements/resources.
2. Overview aggregation endpoint (stats, streak, today's sessions, course progress, latest results).
3. Attendance & schedule: read-only endpoints + eligibility-flag logic + weekly timetable paging.
4. Learning & results: trend, performance-by-subject, per-course detail, recommendations, exam results, export.
5. Polish: pagination, validation, and a pass to confirm no endpoint ever leaks another student's or another class's data.

## 10. Acceptance criteria — student
- A student can only ever read their own records — enforced by deriving `studentId` from the JWT, never from client input.
- Only submitted attendance and published assessment results are ever returned to a student.
- Session notes (teacher/admin-only) never appear in any student-facing response.
- All endpoints are backed by real MongoDB queries against the seeded data (no hardcoded response arrays).
