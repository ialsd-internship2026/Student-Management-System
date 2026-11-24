import React from 'react';
import { X, Download, Printer, FileText, CheckCircle2 } from 'lucide-react';

export default function ReportModal({ isOpen, onClose, students, showToast }) {
  if (!isOpen) return null;

  const downloadCSV = () => {
    const headers = ['Student ID', 'Student Name', 'Section', 'Attendance (%)', 'Overall Score (%)', 'Growth (pts)', 'Status', 'Class Rank'];
    const rows = students.map(s => [
      s.id,
      `"${s.name}"`,
      s.section,
      s.attendance,
      s.score,
      s.growth,
      s.status,
      `"${s.rank}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `aster_institute_grade_10a_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('Class performance report downloaded as CSV');
    onClose();
  };

  const printReport = () => {
    window.print();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-dialog report-modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-wrap">
            <div className="modal-icon-badge">
              <FileText size={18} />
            </div>
            <div>
              <h2 className="modal-title">Export Class Report</h2>
              <p className="modal-subtitle">Grade 10-A · Fall Term 2026 Academic Assessment Report</p>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="report-preview-body">
          <div className="report-summary-box">
            <div className="summary-stat">
              <span className="stat-label">Total Cohort</span>
              <span className="stat-val">{students.length} students</span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Class Average</span>
              <span className="stat-val">
                {Math.round(students.reduce((a, b) => a + b.score, 0) / students.length)}%
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Average Attendance</span>
              <span className="stat-val">
                {Math.round(students.reduce((a, b) => a + b.attendance, 0) / students.length)}%
              </span>
            </div>
            <div className="summary-stat">
              <span className="stat-label">Lead Faculty</span>
              <span className="stat-val">Daniel Reed</span>
            </div>
          </div>

          <div className="report-table-scroll">
            <table className="report-preview-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>NAME</th>
                  <th>ATTEND.</th>
                  <th>SCORE</th>
                  <th>GROWTH</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {students.map(s => (
                  <tr key={s.id}>
                    <td>{s.id}</td>
                    <td style={{ fontWeight: 600 }}>{s.name}</td>
                    <td>{s.attendance}%</td>
                    <td>{s.score}%</td>
                    <td style={{ color: '#10b981', fontWeight: 600 }}>+{s.growth} pts</td>
                    <td>
                      <span className={`badge ${s.status === 'Needs support' ? 'badge-draft' : 'badge-active'}`}>
                        {s.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="modal-footer">
          <button type="button" className="btn btn-secondary" onClick={printReport}>
            <Printer size={16} />
            <span>Print Report</span>
          </button>
          <button type="button" className="btn btn-primary" onClick={downloadCSV}>
            <Download size={16} />
            <span>Download CSV Data</span>
          </button>
        </div>
      </div>
    </div>
  );
}
