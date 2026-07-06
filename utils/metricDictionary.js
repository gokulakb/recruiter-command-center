const metricDictionary = {
  totalRecruiters: {
    name: 'Total Recruiters',
    definition: 'Total number of recruiters associated with the college',
    source: 'recruiters table',
    calculation: 'SELECT COUNT(*) FROM recruiters WHERE college_id = ?',
    decision: 'Indicates the overall recruiter engagement and partnerships',
    category: 'Recruiter Metrics'
  },
  activeRecruiters: {
    name: 'Active Recruiters',
    definition: 'Recruiters whose status is Active',
    source: 'recruiters table',
    calculation: 'SELECT COUNT(*) FROM recruiters WHERE status = "Active" AND college_id = ?',
    decision: 'Shows whether recruiter participation is healthy and ongoing',
    category: 'Recruiter Metrics'
  },
  totalStudents: {
    name: 'Total Students',
    definition: 'Total number of students registered in the system',
    source: 'students table',
    calculation: 'SELECT COUNT(*) FROM students WHERE college_id = ?',
    decision: 'Track student participation and reach',
    category: 'Student Metrics'
  },
  onboardedStudents: {
    name: 'Successfully Onboarded Students',
    definition: 'Students whose onboarding status is Completed',
    source: 'students table',
    calculation: 'SELECT COUNT(*) FROM students WHERE onboarding_status = "Completed" AND college_id = ?',
    decision: 'Measure onboarding success and student readiness',
    category: 'Student Metrics'
  },
  totalJobs: {
    name: 'Total Jobs',
    definition: 'Total number of job postings created',
    source: 'jobs table',
    calculation: 'SELECT COUNT(*) FROM jobs WHERE college_id = ?',
    decision: 'Track job availability and recruiter activity',
    category: 'Job Metrics'
  },
  openJobs: {
    name: 'Open Jobs',
    definition: 'Job postings with status Open',
    source: 'jobs table',
    calculation: 'SELECT COUNT(*) FROM jobs WHERE status = "Open" AND college_id = ?',
    decision: 'Identify current hiring opportunities',
    category: 'Job Metrics'
  },
  totalApplications: {
    name: 'Total Applications',
    definition: 'Total number of job applications submitted',
    source: 'applications table',
    calculation: 'SELECT COUNT(*) FROM applications WHERE college_id = ?',
    decision: 'Track student engagement and application activity',
    category: 'Application Metrics'
  },
  totalHires: {
    name: 'Total Hires',
    definition: 'Number of applications with status Hired',
    source: 'applications table',
    calculation: 'SELECT COUNT(*) FROM applications WHERE status = "Hired" AND college_id = ?',
    decision: 'Ultimate measure of placement success',
    category: 'Application Metrics'
  },
  conversionRate: {
    name: 'Conversion Rate',
    definition: 'Percentage of applications that result in hires',
    source: 'applications table',
    calculation: '(Total Hires / Total Applications) * 100',
    decision: 'Overall hiring funnel efficiency',
    category: 'Application Metrics'
  },
  averageTimeToHire: {
    name: 'Average Time to Hire',
    definition: 'Average number of days from application to hire',
    source: 'applications table',
    calculation: 'AVG(julianday(updated_at) - julianday(applied_at)) WHERE status = "Hired"',
    decision: 'Hiring process efficiency and speed',
    category: 'Application Metrics'
  },
  onboardingSuccessRate: {
    name: 'Onboarding Success Rate',
    definition: 'Percentage of students successfully onboarded',
    source: 'students table',
    calculation: '(Onboarded Students / Total Students) * 100',
    decision: 'Effectiveness of bulk onboarding process',
    category: 'Student Metrics'
  }
};

const getMetricDictionary = (collegeId) => {
  return Object.values(metricDictionary);
};

module.exports = {
  metricDictionary,
  getMetricDictionary
};