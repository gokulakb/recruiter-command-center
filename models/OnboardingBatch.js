const db = require('../config/database');

class OnboardingBatch {
  static findByCollege(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          *,
          ROUND(CAST(successful_records AS FLOAT) / NULLIF(total_records, 0) * 100, 1) as success_rate
        FROM onboarding_batches
        WHERE college_id = ?
        ORDER BY uploaded_at DESC
      `;

      db.all(query, [collegeId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  }

  static getSummary(collegeId) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT 
          COUNT(*) as total_batches,
          SUM(total_records) as total_records,
          SUM(successful_records) as total_successful,
          SUM(failed_records) as total_failed,
          SUM(duplicate_records) as total_duplicates,
          ROUND(CAST(SUM(successful_records) AS FLOAT) / NULLIF(SUM(total_records), 0) * 100, 1) as overall_success_rate,
          MAX(uploaded_at) as latest_upload
        FROM onboarding_batches
        WHERE college_id = ?
      `;

      db.get(query, [collegeId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });
  }
}

module.exports = OnboardingBatch;