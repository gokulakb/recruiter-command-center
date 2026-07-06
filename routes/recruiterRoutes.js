const express = require('express');
const router = express.Router();
const { collegeIsolation } = require('../middleware/collegeIsolation');
const {
  getRecruiters,
  getPerformance,
  getTop
} = require('../controllers/recruiterController');

router.use(collegeIsolation);

router.get('/', getRecruiters);
router.get('/performance', getPerformance);
router.get('/top', getTop);

module.exports = router;