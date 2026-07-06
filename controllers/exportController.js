const db = require('../config/database');

const exportRecruiters = (req, res) => {
  const collegeId = req.collegeId;
  
  const query = `
    SELECT 
      r.name, r.email, r.company, r.status,
      COUNT(DISTINCT j.id) as jobs_posted,
      COUNT(DISTINCT a.id) as applications,
      COUNT(DISTINCT CASE WHEN a.status = 'Hired' THEN a.id END) as hires,
      r.last_active_at
    FROM recruiters r
    LEFT JOIN jobs j ON j.recruiter_id = r.id AND j.college_id = r.college_id
    LEFT JOIN applications a ON a.recruiter_id = r.id AND a.college_id = r.college_id
    WHERE r.college_id = ?
    GROUP BY r.id
  `;
  
  db.all(query, [collegeId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error exporting recruiter data'
      });
    }
    
    // Generate CSV
    let csv = 'Name,Email,Company,Status,Jobs Posted,Applications,Hires,Last Active\n';
    rows.forEach(row => {
      csv += `"${row.name}","${row.email}","${row.company}","${row.status}",${row.jobs_posted || 0},${row.applications || 0},${row.hires || 0},"${row.last_active_at || ''}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=recruiters_export.csv');
    res.send(csv);
  });
};

const exportOnboarding = (req, res) => {
  const collegeId = req.collegeId;
  
  const query = `
    SELECT 
      batch_name, total_records, successful_records, 
      failed_records, duplicate_records, status, uploaded_at
    FROM onboarding_batches
    WHERE college_id = ?
    ORDER BY uploaded_at DESC
  `;
  
  db.all(query, [collegeId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error exporting onboarding data'
      });
    }
    
    let csv = 'Batch Name,Total Records,Successful,Failed,Duplicates,Status,Upload Date\n';
    rows.forEach(row => {
      csv += `"${row.batch_name}",${row.total_records},${row.successful_records},${row.failed_records},${row.duplicate_records},"${row.status}","${row.uploaded_at}"\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=onboarding_export.csv');
    res.send(csv);
  });
};

const exportJobs = (req, res) => {
  const collegeId = req.collegeId;
  
  const query = `
    SELECT 
      j.title, j.department, j.openings, j.status,
      r.name as recruiter_name,
      r.company as company_name,
      COUNT(a.id) as applications,
      SUM(CASE WHEN a.status = 'Hired' THEN 1 ELSE 0 END) as hires
    FROM jobs j
    JOIN recruiters r ON r.id = j.recruiter_id AND r.college_id = j.college_id
    LEFT JOIN applications a ON a.job_id = j.id AND a.college_id = j.college_id
    WHERE j.college_id = ?
    GROUP BY j.id
  `;
  
  db.all(query, [collegeId], (err, rows) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Error exporting job data'
      });
    }
    
    let csv = 'Job Title,Department,Openings,Status,Recruiter,Company,Applications,Hires,Fill Rate\n';
    rows.forEach(row => {
      const fillRate = row.openings > 0 ? ((row.hires || 0) / row.openings * 100).toFixed(1) : '0.0';
      csv += `"${row.title}","${row.department}",${row.openings},"${row.status}","${row.recruiter_name}","${row.company_name}",${row.applications || 0},${row.hires || 0},${fillRate}%\n`;
    });
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=jobs_export.csv');
    res.send(csv);
  });
};

module.exports = {
  exportRecruiters,
  exportOnboarding,
  exportJobs
};