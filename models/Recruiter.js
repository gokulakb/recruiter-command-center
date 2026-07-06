const db = require('../config/database');

class Recruiter {
  static findAll(collegeId, filters = {}) {
    return new Promise((resolve, reject) => {
      let query = 'SELECT * FROM recruiters WHERE college_id = ?';
      const params = [collegeId];

      if (filters.status) {
        query += ' AND status = ?';
        params.push(filters.status);
      }

      if (filters.search) {
        query += ' AND (name LIKE ? OR email LIKE ? OR company LIKE ?)';
        const searchTerm = `%${filters.search}%`;
        params.push(searchTerm, searchTerm, searchTerm);
      }

      query += ' ORDER BY created_at DESC';

      db.all(query, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static findById(id, collegeId) {
    return new Promise((resolve, reject) => {
      db.get(
        'SELECT * FROM recruiters WHERE id = ? AND college_id = ?',
        [id, collegeId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row);
        }
      );
    });
  }

  static getPerformanceMetrics(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.company,
          r.status,
          r.last_active_at,
          COUNT(DISTINCT j.id) as jobs_posted,
          COUNT(DISTINCT a.id) as applications,
          COUNT(DISTINCT CASE WHEN a.status = 'Shortlisted' THEN a.id END) as shortlisted,
          COUNT(DISTINCT CASE WHEN a.status = 'Interview' THEN a.id END) as interviews,
          COUNT(DISTINCT CASE WHEN a.status = 'Offered' THEN a.id END) as offers,
          COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) as hires
        FROM recruiters r
        LEFT JOIN jobs j ON j.recruiter_id = r.id AND j.college_id = r.college_id
        LEFT JOIN applications a ON a.recruiter_id = r.id AND a.college_id = r.college_id
        WHERE r.college_id = ?
        GROUP BY r.id
      `;

      db.all(query, [collegeId], (err, rows) => {
        if (err) reject(err);
        else {
          const results = rows.map(row => {
            const conversion = row.applications > 0 
              ? ((row.hires / row.applications) * 100).toFixed(1)
              : '0.0';
            return {
              ...row,
              conversionRate: parseFloat(conversion)
            };
          });
          resolve(results);
        }
      });
    });
  }

  static getTopRecruiters(collegeId, limit = 5) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          r.id,
          r.name,
          r.company,
          COUNT(DISTINCT j.id) as jobs_posted,
          COUNT(DISTINCT a.id) as applications,
          COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) as hires,
          ROUND(CAST(COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) AS FLOAT) / 
                NULLIF(COUNT(DISTINCT a.id), 0) * 100, 1) as conversion_rate
        FROM recruiters r
        LEFT JOIN jobs j ON j.recruiter_id = r.id AND j.college_id = r.college_id
        LEFT JOIN applications a ON a.recruiter_id = r.id AND a.college_id = r.college_id
        WHERE r.college_id = ? AND r.status = 'Active'
        GROUP BY r.id
        HAVING COUNT(DISTINCT a.id) > 0
        ORDER BY hires DESC, conversion_rate DESC
        LIMIT ?
      `;

      db.all(query, [collegeId, limit], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }
}

module.exports = Recruiter;