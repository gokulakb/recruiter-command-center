const db = require('../config/database');
const Recruiter = require('../models/Recruiter');
const Student = require('../models/Student');
const Job = require('../models/Job');
const Application = require('../models/Application');
const OnboardingBatch = require('../models/OnboardingBatch');
const DataQuality = require('../utils/dataQuality');
const { getMetricDictionary } = require('../utils/metricDictionary');

const getOverview = (req, res) => {
  const collegeId = req.collegeId;
  
  const queries = {
    totalRecruiters: 'SELECT COUNT(*) as count FROM recruiters WHERE college_id = ?',
    activeRecruiters: 'SELECT COUNT(*) as count FROM recruiters WHERE college_id = ? AND status = "Active"',
    totalStudents: 'SELECT COUNT(*) as count FROM students WHERE college_id = ?',
    onboardedStudents: 'SELECT COUNT(*) as count FROM students WHERE college_id = ? AND onboarding_status = "Completed"',
    totalJobs: 'SELECT COUNT(*) as count FROM jobs WHERE college_id = ?',
    openJobs: 'SELECT COUNT(*) as count FROM jobs WHERE college_id = ? AND status = "Open"',
    totalApplications: 'SELECT COUNT(*) as count FROM applications WHERE college_id = ?',
    totalHires: 'SELECT COUNT(*) as count FROM applications WHERE college_id = ? AND status = "Hired"'
  };
  
  const results = {};
  let completed = 0;
  const totalQueries = Object.keys(queries).length;
  
  Object.entries(queries).forEach(([key, query]) => {
    db.get(query, [collegeId], (err, row) => {
      completed++;
      results[key] = err ? 0 : (row ? row.count : 0);
      
      if (completed === totalQueries) {
        const conversionRate = results.totalApplications > 0 
          ? parseFloat(((results.totalHires / results.totalApplications) * 100).toFixed(1))
          : 0;
        
        // Get average time to hire
        db.get(
          `SELECT AVG(julianday(updated_at) - julianday(applied_at)) as avg_days 
           FROM applications 
           WHERE college_id = ? AND status = "Hired"`,
          [collegeId],
          (err, row) => {
            const avgTimeToHire = err ? 0 : (row && row.avg_days ? parseFloat(row.avg_days.toFixed(1)) : 0);
            
            res.json({
              success: true,
              data: {
                totalRecruiters: results.totalRecruiters,
                activeRecruiters: results.activeRecruiters,
                totalStudents: results.totalStudents,
                onboardedStudents: results.onboardedStudents,
                totalJobs: results.totalJobs,
                openJobs: results.openJobs,
                totalApplications: results.totalApplications,
                totalHires: results.totalHires,
                conversionRate: conversionRate,
                averageTimeToHire: avgTimeToHire
              }
            });
          }
        );
      }
    });
  });
};

const getFunnel = (req, res) => {
  const collegeId = req.collegeId;
  
  Application.getFunnelData(collegeId)
    .then(data => {
      const total = Object.values(data).reduce((sum, val) => sum + val, 0);
      
      // Generate insight
      let insight = '';
      const shortlisted = data.Shortlisted || 0;
      const interviewed = data.Interview || 0;
      const offered = data.Offered || 0;
      const hired = data.Hired || 0;
      
      if (total > 0) {
        const interviewToOffer = offered > 0 ? (offered / (interviewed || 1)) * 100 : 0;
        if (interviewToOffer < 30) {
          insight = 'Interview-to-offer conversion is below target (30%). Review candidate screening quality.';
        } else if (interviewToOffer > 70) {
          insight = 'Strong interview-to-offer conversion. Keep up the good work!';
        } else {
          insight = 'Funnel performance is moderate. Focus on improving candidate quality and interview process.';
        }
      } else {
        insight = 'No applications yet. Focus on generating more applications.';
      }
      
      res.json({
        success: true,
        data: data,
        insight: insight
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching funnel data',
        error: err.message
      });
    });
};

const getActivity = (req, res) => {
  const collegeId = req.collegeId;
  const days = parseInt(req.query.days) || 30;
  
  Application.getActivityTimeline(collegeId, days)
    .then(data => {
      res.json({
        success: true,
        data: data
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching activity data',
        error: err.message
      });
    });
};

const getJobs = (req, res) => {
  const collegeId = req.collegeId;
  
  Job.getPerformanceMetrics(collegeId)
    .then(data => {
      res.json({
        success: true,
        data: data
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching job performance',
        error: err.message
      });
    });
};

const getInsights = (req, res) => {
  const collegeId = req.collegeId;
  
  const insights = [];
  
  // Check inactive recruiters
  db.all(
    `SELECT name, company, julianday('now') - julianday(last_active_at) as days_inactive 
     FROM recruiters 
     WHERE college_id = ? AND status = 'Active' AND last_active_at IS NOT NULL
     AND julianday('now') - julianday(last_active_at) > 14`,
    [collegeId],
    (err, inactiveRecruiters) => {
      if (!err && inactiveRecruiters && inactiveRecruiters.length > 0) {
        insights.push({
          severity: 'High',
          problem: 'Inactive Recruiters',
          evidence: `${inactiveRecruiters.length} recruiters inactive for more than 14 days`,
          action: 'Follow up with inactive recruiters to re-engage them',
          details: inactiveRecruiters.map(r => `${r.name} (${r.company}) - ${Math.round(r.days_inactive)} days inactive`)
        });
      }
      
      // Check jobs with many applications but no hires
      db.all(
        `SELECT j.id, j.title, COUNT(a.id) as app_count, r.name as recruiter_name
         FROM jobs j
         JOIN recruiters r ON r.id = j.recruiter_id AND r.college_id = j.college_id
         LEFT JOIN applications a ON a.job_id = j.id AND a.college_id = j.college_id
         WHERE j.college_id = ? AND j.status = 'Open'
         GROUP BY j.id
         HAVING COUNT(a.id) > 10 AND SUM(CASE WHEN a.status = 'Hired' THEN 1 ELSE 0 END) = 0`,
        [collegeId],
        (err, jobsWithNoHires) => {
          if (!err && jobsWithNoHires && jobsWithNoHires.length > 0) {
            insights.push({
              severity: 'Medium',
              problem: 'Jobs with Many Applications but No Hires',
              evidence: `${jobsWithNoHires.length} jobs have 10+ applications but zero hires`,
              action: 'Review the hiring criteria and interview process for these roles',
              details: jobsWithNoHires.map(j => `${j.title} (${j.recruiter_name}) - ${j.app_count} applications`)
            });
          }
          
          // Check onboarding batches with high failure rates
          db.all(
            `SELECT batch_name, total_records, failed_records, 
             ROUND(CAST(failed_records AS FLOAT) / NULLIF(total_records, 0) * 100, 1) as fail_rate
             FROM onboarding_batches
             WHERE college_id = ? AND total_records > 0
             ORDER BY fail_rate DESC
             LIMIT 3`,
            [collegeId],
            (err, failedBatches) => {
              if (!err && failedBatches && failedBatches.length > 0) {
                const highFail = failedBatches.filter(b => b.fail_rate > 10);
                if (highFail.length > 0) {
                  insights.push({
                    severity: 'High',
                    problem: 'Onboarding Batch Failures',
                    evidence: `${highFail.length} batches have failure rates above 10%`,
                    action: 'Review the source data quality and CSV format for these batches',
                    details: highFail.map(b => `${b.batch_name} - ${b.fail_rate}% failure rate`)
                  });
                }
              }
              
              // Check recruiters with high applications but low conversion
              db.all(
                `SELECT r.name, r.company, COUNT(a.id) as apps, 
                 SUM(CASE WHEN a.status = 'Hired' THEN 1 ELSE 0 END) as hires,
                 ROUND(CAST(SUM(CASE WHEN a.status = 'Hired' THEN 1 ELSE 0 END) AS FLOAT) / 
                       NULLIF(COUNT(a.id), 0) * 100, 1) as conversion
                 FROM recruiters r
                 LEFT JOIN applications a ON a.recruiter_id = r.id AND a.college_id = r.college_id
                 WHERE r.college_id = ? AND r.status = 'Active'
                 GROUP BY r.id
                 HAVING COUNT(a.id) > 5 AND conversion < 20`,
                [collegeId],
                (err, lowConversionRecruiters) => {
                  if (!err && lowConversionRecruiters && lowConversionRecruiters.length > 0) {
                    insights.push({
                      severity: 'Medium',
                      problem: 'Low Conversion Recruiters',
                      evidence: `${lowConversionRecruiters.length} recruiters have <20% conversion rate with 5+ applications`,
                      action: 'Provide additional training or support to these recruiters',
                      details: lowConversionRecruiters.map(r => 
                        `${r.name} (${r.company}) - ${r.apps} apps, ${r.hires} hires, ${r.conversion}% conversion`
                      )
                    });
                  }
                  
                  // If no insights, add a default
                  if (insights.length === 0) {
                    insights.push({
                      severity: 'Low',
                      problem: 'No Critical Issues Detected',
                      evidence: 'All metrics are within normal ranges',
                      action: 'Continue monitoring and maintain current performance',
                      details: ['System is operating normally']
                    });
                  }
                  
                  res.json({
                    success: true,
                    data: insights
                  });
                }
              );
            }
          );
        }
      );
    }
  );
};

const getDataQuality = async (req, res) => {
  const collegeId = req.collegeId;
  
  try {
    const quality = await DataQuality.checkAll(collegeId);
    res.json({
      success: true,
      data: quality
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: 'Error checking data quality',
      error: err.message
    });
  }
};

// This is the only declaration of getMetricDictionary
const getMetricDictionaryHandler = (req, res) => {
  const metrics = getMetricDictionary(req.collegeId);
  res.json({
    success: true,
    data: metrics
  });
};

module.exports = {
  getOverview,
  getFunnel,
  getActivity,
  getJobs,
  getInsights,
  getDataQuality,
  getMetricDictionary: getMetricDictionaryHandler
};