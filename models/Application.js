const db = require('../config/database');

class Application {
  static findByCollege(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          a.*,
          s.name as student_name,
          s.email as student_email,
          j.title as job_title,
          r.name as recruiter_name
        FROM applications a
        JOIN students s ON s.id = a.student_id AND s.college_id = a.college_id
        JOIN jobs j ON j.id = a.job_id AND j.college_id = a.college_id
        JOIN recruiters r ON r.id = a.recruiter_id AND r.college_id = a.college_id
        WHERE a.college_id = ?
        ORDER BY a.applied_at DESC
      `;

      db.all(query, [collegeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getFunnelData(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          status,
          COUNT(*) as count
        FROM applications
        WHERE college_id = ?
        GROUP BY status
      `;

      db.all(query, [collegeId], (err, rows) => {
        if (err) reject(err);
        else {
          const statusOrder = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
          const result = {};
          statusOrder.forEach(status => {
            const found = rows.find(r => r.status === status);
            result[status] = found ? found.count : 0;
          });
          resolve(result);
        }
      });
    });
  }

  static getActivityTimeline(collegeId, days = 30) {
    return new Promise((resolve, reject) => {
      const query = `
        WITH RECURSIVE dates(date) AS (
          SELECT date('now', '-' || ? || ' days')
          UNION ALL
          SELECT date(date, '+1 day')
          FROM dates
          WHERE date < date('now')
        )
        SELECT 
          d.date,
          COUNT(DISTINCT CASE WHEN a.status = 'Applied' THEN a.id END) as applications,
          COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) as hires
        FROM dates d
        LEFT JOIN applications a ON date(a.applied_at) = d.date AND a.college_id = ?
        GROUP BY d.date
        ORDER BY d.date
      `;

      db.all(query, [days, collegeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Application;