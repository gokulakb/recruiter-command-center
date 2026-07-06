const express = require('express');
const router = express.Router();
const { collegeIsolation, testIsolation } = require('../middleware/collegeIsolation');
const {
  getOverview,
  getFunnel,
  getActivity,
  getJobs,
  getInsights,
  getDataQuality,
  getMetricDictionary
} = require('../controllers/dashboardController');

// Apply isolation middleware to all dashboard routes
router.use(collegeIsolation);

router.get('/overview', getOverview);
router.get('/funnel', getFunnel);
router.get('/activity', getActivity);
router.get('/jobs', getJobs);
router.get('/insights', getInsights);
router.get('/data-quality', getDataQuality);
router.get('/metric-dictionary', getMetricDictionary);
router.get('/isolation-test', (req, res) => {
  testIsolation(req, res);
});

module.exports = router;