const OnboardingBatch = require('../models/OnboardingBatch');

const getSummary = (req, res) => {
  const collegeId = req.collegeId;
  
  OnboardingBatch.getSummary(collegeId)
    .then(summary => {
      res.json({
        success: true,
        data: summary || {
          total_batches: 0,
          total_records: 0,
          total_successful: 0,
          total_failed: 0,
          total_duplicates: 0,
          overall_success_rate: 0,
          latest_upload: null
        }
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching onboarding summary',
        error: err.message
      });
    });
};

const getBatches = (req, res) => {
  const collegeId = req.collegeId;
  
  OnboardingBatch.findByCollege(collegeId)
    .then(batches => {
      res.json({
        success: true,
        data: batches
      });
    })
    .catch(err => {
      res.status(500).json({
        success: false,
        message: 'Error fetching onboarding batches',
        error: err.message
      });
    });
};

module.exports = {
  getSummary,
  getBatches
};