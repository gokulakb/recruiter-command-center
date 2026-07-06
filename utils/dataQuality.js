const db = require('../config/database');

class DataQuality {
  static checkFreshness(collegeId) {
    return new Promise((resolve) => {
      const queries = [
        'SELECT MAX(created_at) as latest FROM recruiters WHERE college_id = ?',
        'SELECT MAX(created_at) as latest FROM students WHERE college_id = ?',
        'SELECT MAX(applied_at) as latest FROM applications WHERE college_id = ?'
      ];
      
      let latestDate = null;
      let checked = 0;
      
      queries.forEach((query, index) => {
        db.get(query, [collegeId], (err, row) => {
          checked++;
          if (!err && row && row.latest) {
            const date = new Date(row.latest);
            if (!latestDate || date > latestDate) {
              latestDate = date;
            }
          }
          
          if (checked === queries.length) {
            const now = new Date();
            const diffDays = latestDate ? Math.floor((now - latestDate) / (1000 * 60 * 60 * 24)) : 30;
            
            resolve({
              status: diffDays <= 7 ? 'PASSED' : diffDays <= 14 ? 'WARNING' : 'FAILED',
              latestDate: latestDate ? latestDate.toISOString() : null,
              daysSince: diffDays,
              message: diffDays <= 7 
                ? 'Data is fresh' 
                : diffDays <= 14 
                  ? 'Data is moderately stale' 
                  : 'Data is stale - please update'
            });
          }
        });
      });
    });
  }

  static checkNulls(collegeId) {
    return new Promise((resolve) => {
      const checks = [
        { table: 'recruiters', fields: ['email', 'name'] },
        { table: 'students', fields: ['email', 'name'] },
        { table: 'applications', fields: ['status'] }
      ];
      
      let totalNulls = 0;
      let totalRows = 0;
      let details = [];
      let completed = 0;
      
      checks.forEach((check) => {
        check.fields.forEach((field) => {
          const query = `SELECT COUNT(*) as total, SUM(CASE WHEN ${field} IS NULL OR ${field} = '' THEN 1 ELSE 0 END) as nulls FROM ${check.table} WHERE college_id = ?`;
          db.get(query, [collegeId], (err, row) => {
            completed++;
            if (!err && row) {
              totalNulls += row.nulls;
              totalRows += row.total;
              if (row.nulls > 0) {
                details.push(`${row.nulls} null ${field} in ${check.table}`);
              }
            }
            
            if (completed === checks.reduce((acc, c) => acc + c.fields.length, 0)) {
              const nullRate = totalRows > 0 ? (totalNulls / totalRows) * 100 : 0;
              resolve({
                status: nullRate === 0 ? 'PASSED' : nullRate < 10 ? 'WARNING' : 'FAILED',
                totalNulls: totalNulls,
                totalRows: totalRows,
                nullRate: parseFloat(nullRate.toFixed(2)),
                details: details,
                message: nullRate === 0 
                  ? 'No null values found' 
                  : nullRate < 10 
                    ? `${totalNulls} null values found (${nullRate.toFixed(1)}%)` 
                    : `High null rate: ${totalNulls} null values (${nullRate.toFixed(1)}%)`
              });
            }
          });
        });
      });
    });
  }

  static checkDuplicates(collegeId) {
    return new Promise((resolve) => {
      const checks = [
        { table: 'students', field: 'email' },
        { table: 'recruiters', field: 'email' }
      ];
      
      let totalDuplicates = 0;
      let details = [];
      let completed = 0;
      
      checks.forEach((check) => {
        const query = `
          SELECT ${check.field}, COUNT(*) as count 
          FROM ${check.table} 
          WHERE college_id = ? 
          GROUP BY ${check.field} 
          HAVING COUNT(*) > 1
        `;
        db.all(query, [collegeId], (err, rows) => {
          completed++;
          if (!err && rows) {
            const duplicateCount = rows.reduce((sum, row) => sum + row.count - 1, 0);
            totalDuplicates += duplicateCount;
            if (rows.length > 0) {
              details.push(`${duplicateCount} duplicate ${check.field} in ${check.table}`);
            }
          }
          
          if (completed === checks.length) {
            resolve({
              status: totalDuplicates === 0 ? 'PASSED' : totalDuplicates < 5 ? 'WARNING' : 'FAILED',
              totalDuplicates: totalDuplicates,
              details: details,
              message: totalDuplicates === 0 
                ? 'No duplicate records found' 
                : totalDuplicates < 5 
                  ? `${totalDuplicates} duplicate records found` 
                  : `High duplicate count: ${totalDuplicates} duplicates`
            });
          }
        });
      });
    });
  }

  static checkSpikes(collegeId) {
    return new Promise((resolve) => {
      const queries = [
        {
          name: 'applications',
          query: `
            SELECT COUNT(*) as count, DATE(MAX(applied_at)) as date
            FROM applications 
            WHERE college_id = ? AND applied_at >= datetime('now', '-7 days')
          `
        },
        {
          name: 'students',
          query: `
            SELECT COUNT(*) as count, DATE(MAX(created_at)) as date
            FROM students 
            WHERE college_id = ? AND created_at >= datetime('now', '-7 days')
          `
        }
      ];
      
      let totalRecent = 0;
      let details = [];
      let completed = 0;
      
      queries.forEach((q) => {
        db.get(q.query, [collegeId], (err, row) => {
          completed++;
          if (!err && row) {
            totalRecent += row.count || 0;
          }
          
          if (completed === queries.length) {
            const isSpike = totalRecent > 100;
            resolve({
              status: isSpike ? 'WARNING' : 'PASSED',
              recentCount: totalRecent,
              details: details,
              message: isSpike 
                ? `Suspicious spike detected: ${totalRecent} records in last 7 days` 
                : `Normal activity: ${totalRecent} records in last 7 days`
            });
          }
        });
      });
    });
  }

  static async checkAll(collegeId) {
    const results = await Promise.all([
      this.checkFreshness(collegeId),
      this.checkNulls(collegeId),
      this.checkDuplicates(collegeId),
      this.checkSpikes(collegeId)
    ]);
    
    const allPassed = results.every(r => r.status === 'PASSED');
    const hasWarning = results.some(r => r.status === 'WARNING');
    
    return {
      overall: allPassed ? 'PASSED' : hasWarning ? 'WARNING' : 'FAILED',
      freshness: results[0],
      nulls: results[1],
      duplicates: results[2],
      spikes: results[3]
    };
  }
}

module.exports = DataQuality;