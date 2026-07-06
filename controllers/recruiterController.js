const Recruiter = require('../models/Recruiter');

const getRecruiters = (req, res) => {
  const collegeId = req.collegeId;
  const { search, status } = req.query;
  
  Recruiter.findAll(collegeId, { search, status })
    .then(recruiters => {
      res.json({
        success: true,
        data: recruiters
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching recruiters',
        error: err.message
      });
    });
};

const getPerformance = (req, res) => {
  const collegeId = req.collegeId;
  
  Recruiter.getPerformanceMetrics(collegeId)
    .then(recruiters => {
      res.json({
        success: true,
        data: recruiters
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching recruiter performance',
        error: err.message
      });
    });
};

const getTop = (req, res) => {
  const collegeId = req.collegeId;
  const limit = parseInt(req.query.limit) || 5;
  
  Recruiter.getTopRecruiters(collegeId, limit)
    .then(recruiters => {
      res.json({
        success: true,
        data: recruiters
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching top recruiters',
        error: err.message
      });
    });
};

module.exports = {
  getRecruiters,
  getPerformance,
  getTop
};