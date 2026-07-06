const express = require('express');
const router = express.Router();
const { collegeIsolation } = require('../middleware/collegeIsolation');
const {
  getSummary,
  getBatches
} = require('../controllers/onboardingController');

router.use(collegeIsolation);

router.get('/summary', getSummary);
router.get('/batches', getBatches);

module.exports = router;