const db = require('../config/database');

class Job {
  static findAll(collegeId, filters = {}) {
    return new Promise((resolve, reject) => {
      let query = `
        SELECT 
          j.*,
          r.name as recruiter_name,
          r.company as company_name
        FROM jobs j
        JOIN recruiters r ON r.id = j.recruiter_id AND r.college_id = j.college_id
        WHERE j.college_id = ?
      `;
      const params = [collegeId];

      if (filters.status) {
        query += ' AND j.status = ?';
        params.push(filters.status);
      }

      if (filters.department) {
        query += ' AND j.department = ?';
        params.push(filters.department);
      }

      if (filters.search) {
        query += ' AND (j.title LIKE ? OR j.department LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm);
      }

      query += ' ORDER BY j.created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getPerformanceMetrics(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          j.id,
          j.title,
          j.department,
          j.openings,
          j.status,
          r.name as recruiter_name,
          r.company as company_name,
          COUNT(DISTINCT a.id) as total_applications,
          COUNT(DISTINCT CASE WHEN a.status = 'Interview' THEN a.id END) as interviews,
          COUNT(DISTINCT CASE WHEN a.status = 'Offered' THEN a.id END) as offers,
          COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) as hires,
          ROUND(CAST(COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) AS FLOAT) / 
                NULLIF(j.openings, 0) * 100, 1) as fill_rate
        FROM jobs j
        JOIN recruiters r ON r.id = j.recruiter_id AND r.college_id = j.college_id
        LEFT JOIN applications a ON a.job_id = j.id AND a.college_id = j.college_id
        WHERE j.college_id = ?
        GROUP BY j.id
      `;

      db.all(query, [collegeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Job;