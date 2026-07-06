const express = require('express');
const router = express.Router();
const { collegeIsolation } = require('../middleware/collegeIsolation');
const {
  exportRecruiters,
  exportOnboarding,
  exportJobs
} = require('../controllers/exportController');

// Apply isolation middleware
router.use(collegeIsolation);

router.get('/recruiters', exportRecruiters);
router.get('/onboarding', exportOnboarding);
router.get('/jobs', exportJobs);

module.exports = router;