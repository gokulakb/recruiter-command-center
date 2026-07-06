const db = require('../config/database');

// Helper function to run queries sequentially
function runQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function getQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
}

function allQuery(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function seedDatabase() {
    console.log('🌱 Starting database seed...');

    try {
        // Clear existing data
        console.log('🗑️  Clearing existing data...');
        const tables = ['applications', 'jobs', 'students', 'recruiters', 'onboarding_batches', 'colleges'];
        for (const table of tables) {
            await runQuery(`DELETE FROM ${table}`);
            await runQuery(`DELETE FROM sqlite_sequence WHERE name = '${table}'`);
        }
        console.log('✅ Cleared existing data');

        // Insert colleges
        console.log('📚 Inserting colleges...');
        const colleges = [
            { name: 'Indian Institute of Technology Bombay', code: 'IITB' },
            { name: 'Indian Institute of Technology Delhi', code: 'IITD' },
            { name: 'Indian Institute of Technology Madras', code: 'IITM' }
        ];

        const collegeIds = {};
        for (const college of colleges) {
            const result = await runQuery(
                'INSERT INTO colleges (name, code) VALUES (?, ?)',
                [college.name, college.code]
            );
            collegeIds[college.code] = result.lastID;
            console.log(`✅ Inserted college: ${college.name} (ID: ${result.lastID})`);
        }

        // Insert recruiters
        console.log('👥 Inserting recruiters...');
        const recruitersData = [
            // IITB Recruiters
            { collegeId: collegeIds['IITB'], name: 'Priya Sharma', email: 'priya.sharma@iitb.ac.in', company: 'Google', status: 'Active' },
            { collegeId: collegeIds['IITB'], name: 'Rahul Verma', email: 'rahul.verma@iitb.ac.in', company: 'Microsoft', status: 'Active' },
            { collegeId: collegeIds['IITB'], name: 'Sneha Patel', email: 'sneha.patel@iitb.ac.in', company: 'Amazon', status: 'Active' },
            { collegeId: collegeIds['IITB'], name: 'Amit Kumar', email: 'amit.kumar@iitb.ac.in', company: 'Flipkart', status: 'Inactive' },
            // IITD Recruiters
            { collegeId: collegeIds['IITD'], name: 'Deepak Singh', email: 'deepak.singh@iitd.ac.in', company: 'Google', status: 'Active' },
            { collegeId: collegeIds['IITD'], name: 'Neha Gupta', email: 'neha.gupta@iitd.ac.in', company: 'Microsoft', status: 'Active' },
            { collegeId: collegeIds['IITD'], name: 'Vikram Reddy', email: 'vikram.reddy@iitd.ac.in', company: 'Amazon', status: 'Active' },
            { collegeId: collegeIds['IITD'], name: 'Ananya Krishnan', email: 'ananya.krishnan@iitd.ac.in', company: 'Meta', status: 'Inactive' },
            // IITM Recruiters
            { collegeId: collegeIds['IITM'], name: 'Arjun Nair', email: 'arjun.nair@iitm.ac.in', company: 'Google', status: 'Active' },
            { collegeId: collegeIds['IITM'], name: 'Kavya Rao', email: 'kavya.rao@iitm.ac.in', company: 'Microsoft', status: 'Active' },
            { collegeId: collegeIds['IITM'], name: 'Ravi Shankar', email: 'ravi.shankar@iitm.ac.in', company: 'Amazon', status: 'Active' },
            { collegeId: collegeIds['IITM'], name: 'Meera Menon', email: 'meera.menon@iitm.ac.in', company: 'Flipkart', status: 'Active' }
        ];

        const recruiterIds = [];
        for (const recruiter of recruitersData) {
            const daysAgo = Math.floor(Math.random() * 30);
            const result = await runQuery(
                'INSERT INTO recruiters (college_id, name, email, company, status, last_active_at) VALUES (?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"))',
                [recruiter.collegeId, recruiter.name, recruiter.email, recruiter.company, recruiter.status, daysAgo]
            );
            recruiterIds.push({ id: result.lastID, collegeId: recruiter.collegeId });
            console.log(`✅ Inserted recruiter: ${recruiter.name}`);
        }

        // Insert students
        console.log('🎓 Inserting students...');
        const firstNames = ['Aarav', 'Sanya', 'Arjun', 'Kavya', 'Vikram', 'Neha', 'Rahul', 'Priya', 'Deepak', 'Ananya',
            'Rohit', 'Sneha', 'Aditya', 'Ishita', 'Manish', 'Pooja', 'Nitin', 'Maya', 'Suresh', 'Divya',
            'Karan', 'Ritu', 'Vivek', 'Pallavi', 'Siddharth', 'Aisha', 'Ravi', 'Meera', 'Ajay', 'Sunita'];
        const lastNames = ['Patel', 'Gupta', 'Singh', 'Reddy', 'Joshi', 'Sharma', 'Kumar', 'Nair', 'Mishra', 'Iyer',
            'Mehta', 'Rao', 'Shah', 'Jain', 'Tiwari', 'Agarwal', 'Verma', 'Menon', 'Krishnan', 'Nair'];
        const departments = ['Computer Science', 'Electronics', 'Mechanical', 'Civil', 'Chemical'];
        const statuses = ['Completed', 'Completed', 'Completed', 'Pending', 'In Progress', 'Failed'];

        const studentIds = [];
        const collegeCodes = ['IITB', 'IITD', 'IITM'];
        
        for (const code of collegeCodes) {
            const collegeId = collegeIds[code];
            const numStudents = code === 'IITB' ? 30 : code === 'IITD' ? 25 : 20;
            
            for (let i = 0; i < numStudents; i++) {
                const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
                const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
                const name = `${firstName} ${lastName}`;
                const dept = departments[Math.floor(Math.random() * departments.length)];
                const year = 2024 + Math.floor(Math.random() * 3);
                const status = statuses[Math.floor(Math.random() * statuses.length)];
                const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@college.edu`;
                
                const result = await runQuery(
                    'INSERT INTO students (college_id, name, email, department, graduation_year, onboarding_status) VALUES (?, ?, ?, ?, ?, ?)',
                    [collegeId, name, email, dept, year, status]
                );
                studentIds.push({ id: result.lastID, collegeId: collegeId });
            }
        }
        console.log(`✅ Inserted ${studentIds.length} students`);

        // Insert onboarding batches
        console.log('📤 Inserting onboarding batches...');
        const batchNames = ['Bulk Upload - Jan 2026', 'Bulk Upload - Feb 2026', 'Bulk Upload - Mar 2026'];
        const batchStatuses = ['Completed', 'Completed', 'Completed', 'Processing', 'Failed'];
        
        for (let idx = 0; idx < collegeCodes.length; idx++) {
            const collegeId = collegeIds[collegeCodes[idx]];
            for (let i = 0; i < 3; i++) {
                const total = 15 + Math.floor(Math.random() * 25);
                const successRate = 0.65 + Math.random() * 0.35;
                const success = Math.floor(total * successRate);
                const remaining = total - success;
                const failed = Math.floor(remaining * (0.3 + Math.random() * 0.5));
                const duplicate = remaining - failed;
                const status = batchStatuses[Math.floor(Math.random() * batchStatuses.length)];
                const daysAgo = Math.floor(Math.random() * 90);
                
                await runQuery(
                    'INSERT INTO onboarding_batches (college_id, batch_name, total_records, successful_records, failed_records, duplicate_records, status, uploaded_at) VALUES (?, ?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"))',
                    [collegeId, `${batchNames[i]} - ${collegeCodes[idx]}`, total, success, failed, duplicate, status, daysAgo]
                );
            }
        }
        console.log('✅ Inserted 9 onboarding batches');

        // Insert jobs
        console.log('💼 Inserting jobs...');
        const jobTitles = [
            'Software Engineer', 'Data Scientist', 'Product Manager', 'DevOps Engineer',
            'Frontend Developer', 'Backend Developer', 'Full Stack Developer', 'ML Engineer',
            'Cloud Architect', 'Security Analyst', 'Business Analyst', 'HR Specialist'
        ];
        const jobStatuses = ['Open', 'Open', 'Open', 'Closed', 'On Hold'];
        
        const jobIds = [];
        for (const recruiter of recruiterIds) {
            const numJobs = 1 + Math.floor(Math.random() * 2);
            for (let i = 0; i < numJobs; i++) {
                const title = jobTitles[Math.floor(Math.random() * jobTitles.length)];
                const dept = departments[Math.floor(Math.random() * departments.length)];
                const openings = 1 + Math.floor(Math.random() * 5);
                const status = jobStatuses[Math.floor(Math.random() * jobStatuses.length)];
                const daysAgo = Math.floor(Math.random() * 60);
                
                const result = await runQuery(
                    'INSERT INTO jobs (recruiter_id, college_id, title, department, openings, status, created_at) VALUES (?, ?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"))',
                    [recruiter.id, recruiter.collegeId, title, dept, openings, status, daysAgo]
                );
                jobIds.push({ id: result.lastID, collegeId: recruiter.collegeId, recruiterId: recruiter.id });
            }
        }
        console.log(`✅ Inserted ${jobIds.length} jobs`);

        // Insert applications
        console.log('📝 Inserting applications...');
        const appStatuses = ['Applied', 'Applied', 'Applied', 'Shortlisted', 'Shortlisted', 'Interview', 'Interview', 'Offered', 'Hired', 'Rejected'];
        
        // Group students by college
        const studentsByCollege = {};
        for (const student of studentIds) {
            if (!studentsByCollege[student.collegeId]) {
                studentsByCollege[student.collegeId] = [];
            }
            studentsByCollege[student.collegeId].push(student.id);
        }

        let appCount = 0;
        for (const job of jobIds) {
            const collegeStudents = studentsByCollege[job.collegeId] || [];
            if (collegeStudents.length === 0) continue;
            
            // Shuffle students
            const shuffled = [...collegeStudents];
            for (let i = shuffled.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            
            const numApps = Math.min(3 + Math.floor(Math.random() * 8), shuffled.length);
            const selectedStudents = shuffled.slice(0, numApps);
            
            for (const studentId of selectedStudents) {
                const status = appStatuses[Math.floor(Math.random() * appStatuses.length)];
                const daysAgo = Math.floor(Math.random() * 30);
                const updatedDaysAgo = Math.floor(Math.random() * daysAgo);
                
                await runQuery(
                    'INSERT INTO applications (student_id, job_id, recruiter_id, college_id, status, applied_at, updated_at) VALUES (?, ?, ?, ?, ?, datetime("now", "-" || ? || " days"), datetime("now", "-" || ? || " days"))',
                    [studentId, job.id, job.recruiterId, job.collegeId, status, daysAgo, updatedDaysAgo]
                );
                appCount++;
            }
        }
        console.log(`✅ Inserted ${appCount} applications`);

        // Final summary
        console.log('\n🎉 Database seeding completed successfully!');
        console.log('📊 Summary:');
        console.log(`   - Colleges: ${Object.keys(collegeIds).length}`);
        console.log(`   - Recruiters: ${recruiterIds.length}`);
        console.log(`   - Students: ${studentIds.length}`);
        console.log(`   - Onboarding Batches: 9`);
        console.log(`   - Jobs: ${jobIds.length}`);
        console.log(`   - Applications: ${appCount}`);

        // Verify data
        console.log('\n🔍 Verifying data...');
        const collegeCount = await getQuery('SELECT COUNT(*) as count FROM colleges');
        const recruiterCount = await getQuery('SELECT COUNT(*) as count FROM recruiters');
        const studentCount = await getQuery('SELECT COUNT(*) as count FROM students');
        const jobCount = await getQuery('SELECT COUNT(*) as count FROM jobs');
        const appCountResult = await getQuery('SELECT COUNT(*) as count FROM applications');
        
        console.log(`   ✅ Colleges: ${collegeCount.count}`);
        console.log(`   ✅ Recruiters: ${recruiterCount.count}`);
        console.log(`   ✅ Students: ${studentCount.count}`);
        console.log(`   ✅ Jobs: ${jobCount.count}`);
        console.log(`   ✅ Applications: ${appCountResult.count}`);

        // Close the database connection
        db.close();
        console.log('\n✅ Database connection closed.');

    } catch (error) {
        console.error('❌ Error seeding database:', error.message);
        console.error(error.stack);
        db.close();
    }
}

// Run seed
seedDatabase();