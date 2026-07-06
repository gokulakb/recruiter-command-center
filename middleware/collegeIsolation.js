const db = require('../config/database');

const getCollegeId = (req) => {
  // Check query parameter first
  if (req.query.collegeId) {
    return parseInt(req.query.collegeId);
  }
  
  // Check header
  if (req.headers['x-college-id']) {
    return parseInt(req.headers['x-college-id']);
  }
  
  return null;
};

const collegeIsolation = (req, res, next) => {
  const collegeId = getCollegeId(req);
  
  if (!collegeId) {
    return res.status(400).json({
      success: false,
      message: 'collegeId is required. Please provide it as query parameter or x-college-id header.'
    });
  }

  // Validate college exists
  db.get('SELECT id FROM colleges WHERE id = ?', [collegeId], (err, row) => {
    if (err) {
      return res.status(500).json({
        success: false,
        message: 'Database error checking college'
      });
    }
    
    if (!row) {
      return res.status(404).json({
        success: false,
        message: 'College not found'
      });
    }
    
    // Attach college ID to request for use in controllers
    req.collegeId = collegeId;
    next();
  });
};

// Middleware to verify a resource belongs to the current college
const verifyResourceOwnership = (table, idField) => {
  return (req, res, next) => {
    const resourceId = req.params.id || req.body.id;
    const collegeId = req.collegeId;
    
    if (!resourceId) {
      return res.status(400).json({
        success: false,
        message: 'Resource ID required'
      });
    }
    
    const query = `SELECT college_id FROM ${table} WHERE ${idField} = ?`;
    db.get(query, [resourceId], (err, row) => {
      if (err) {
        return res.status(500).json({
          success: false,
          message: 'Database error checking resource ownership'
        });
      }
      
      if (!row) {
        return res.status(404).json({
          success: false,
          message: 'Resource not found'
        });
      }
      
      if (row.college_id !== collegeId) {
        return res.status(403).json({
          success: false,
          message: 'Access denied: Cross-college data access is not permitted.'
        });
      }
      
      next();
    });
  };
};

const testIsolation = (req, res) => {
  const collegeId = req.collegeId;
  
  // Try to access another college's data
  const otherCollegeId = collegeId === 1 ? 2 : 1;
  
  const queries = [
    `SELECT * FROM recruiters WHERE college_id = ${otherCollegeId} LIMIT 1`,
    `SELECT * FROM students WHERE college_id = ${otherCollegeId} LIMIT 1`,
    `SELECT * FROM jobs WHERE college_id = ${otherCollegeId} LIMIT 1`,
    `SELECT * FROM applications WHERE college_id = ${otherCollegeId} LIMIT 1`
  ];
  
  let crossAccessFound = false;
  let errorCount = 0;
  let completed = 0;
  
  const checkQuery = (query) => {
    return new Promise((resolve) => {
      db.get(query, (err, row) => {
        completed++;
        if (err) {
          errorCount++;
          resolve(false);
        } else if (row) {
          // We found data from another college - this should NOT happen
          crossAccessFound = true;
          resolve(true);
        } else {
          // No data found - isolation is working
          resolve(false);
        }
      });
    });
  };
  
  Promise.all(queries.map(q => checkQuery(q)))
    .then(() => {
      // For the test to PASS, we should NOT be able to access other college's data
      // So crossAccessFound should be FALSE
      const passed = !crossAccessFound && errorCount === 0;
      
      res.json({
        success: true,
        isolationStatus: passed ? 'PASSED' : 'FAILED',
        crossCollegeAccess: crossAccessFound,
        message: passed 
          ? 'College data isolation verified successfully.' 
          : 'Isolation test failed. Cross-college data access detected.',
        details: {
          testedCollegeId: collegeId,
          otherCollegeId: otherCollegeId,
          testsRun: queries.length,
          crossAccessFound: crossAccessFound,
          errors: errorCount
        }
      });
    });
};

module.exports = {
  collegeIsolation,
  verifyResourceOwnership,
  testIsolation,
  getCollegeId
};