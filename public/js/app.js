// State
const state = {
    collegeId: new URLSearchParams(window.location.search).get('collegeId') || '1',
    currentSection: 'dashboard',
    recruiterData: [],
    jobData: [],
    funnelChart: null,
    activityChart: null
};

// DOM Ready
document.addEventListener('DOMContentLoaded', function() {
    // Set college info
    document.getElementById('collegeName').textContent = `College ${state.collegeId}`;
    
    // Load all dashboard data
    loadDashboard();
    
    // Setup event listeners
    setupEventListeners();
    
    // Refresh every 60 seconds
    setInterval(loadDashboard, 60000);
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', loadDashboard);
    
    // Menu toggle for mobile
    document.getElementById('menuToggle').addEventListener('click', function() {
        document.getElementById('sidebar').classList.toggle('open');
    });
    
    // Navigation - FIXED: Use proper section mapping
    document.querySelectorAll('.sidebar-nav a').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active state
            document.querySelectorAll('.sidebar-nav a').forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            const section = this.dataset.section;
            state.currentSection = section;
            document.getElementById('pageTitle').textContent = this.textContent.trim();
            
            // Map sections to actual element IDs in the page
            const sectionMap = {
                'dashboard': 'dashboardContent',
                'recruiters': 'recruiter-performance',
                'onboarding': 'onboarding-section',
                'jobs': 'job-performance',
                'quality': 'data-trust',
                'metrics': 'metric-dictionary'
            };
            
            // Find the target element
            const targetId = sectionMap[section];
            if (targetId) {
                const target = document.getElementById(targetId);
                if (target) {
                    // Scroll to the section with smooth behavior
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                } else {
                    // If section not found, scroll to top
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                }
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
            
            // Close mobile menu
            document.getElementById('sidebar').classList.remove('open');
        });
    });
    
    // Recruiter search and filter
    const searchInput = document.getElementById('recruiterSearch');
    const filterSelect = document.getElementById('recruiterFilter');
    
    if (searchInput) {
        searchInput.addEventListener('input', filterRecruiters);
    }
    if (filterSelect) {
        filterSelect.addEventListener('change', filterRecruiters);
    }
    
    // Table sorting
    document.querySelectorAll('#recruiterTable th[data-sort]').forEach(th => {
        th.addEventListener('click', function() {
            const sortKey = this.dataset.sort;
            sortRecruiters(sortKey);
        });
    });
    
    // Export buttons
    document.querySelectorAll('.btn-export').forEach(btn => {
        btn.addEventListener('click', function() {
            const type = this.dataset.export;
            exportData(type);
        });
    });
}

// Load Dashboard
function loadDashboard() {
    const collegeId = state.collegeId;
    
    // Update refresh time
    document.getElementById('lastRefresh').textContent = `Last refresh: ${new Date().toLocaleTimeString()}`;
    
    // Show loading state
    document.querySelectorAll('.kpi-card, .chart-card, .top-recruiter-card, .summary-item').forEach(el => {
        el.classList.add('loading');
    });
    
    // Load all data
    Promise.all([
        loadOverview(collegeId),
        loadFunnel(collegeId),
        loadActivity(collegeId),
        loadTopRecruiters(collegeId),
        loadOnboardingSummary(collegeId),
        loadOnboardingBatches(collegeId),
        loadRecruiters(collegeId),
        loadJobs(collegeId),
        loadInsights(collegeId),
        loadDataQuality(collegeId),
        loadMetricDictionary(collegeId)
    ]).then(() => {
        // Remove loading state
        document.querySelectorAll('.kpi-card, .chart-card, .top-recruiter-card, .summary-item').forEach(el => {
            el.classList.remove('loading');
        });
    }).catch(error => {
        console.error('Error loading dashboard:', error);
        showError('Failed to load dashboard data');
        document.querySelectorAll('.kpi-card, .chart-card, .top-recruiter-card, .summary-item').forEach(el => {
            el.classList.remove('loading');
        });
    });
}

// Load Overview KPI
function loadOverview(collegeId) {
    return fetch(`/api/dashboard/overview?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderKPIs(data.data);
            } else {
                showError('Failed to load KPI data');
            }
        })
        .catch(error => {
            console.error('Error loading overview:', error);
            showError('Error loading KPI data');
        });
}

// Render KPIs
function renderKPIs(kpis) {
    const kpiConfigs = [
        { key: 'totalRecruiters', label: 'Total Recruiters', icon: '👥' },
        { key: 'activeRecruiters', label: 'Active Recruiters', icon: '✅' },
        { key: 'totalStudents', label: 'Total Students', icon: '🎓' },
        { key: 'onboardedStudents', label: 'Successfully Onboarded', icon: '📋' },
        { key: 'totalJobs', label: 'Total Jobs', icon: '💼' },
        { key: 'openJobs', label: 'Open Jobs', icon: '🔍' },
        { key: 'totalApplications', label: 'Total Applications', icon: '📝' },
        { key: 'totalHires', label: 'Total Hires', icon: '🎯' },
        { key: 'conversionRate', label: 'Conversion Rate', icon: '📈', suffix: '%' },
        { key: 'averageTimeToHire', label: 'Avg Time to Hire', icon: '⏱️', suffix: ' days' }
    ];
    
    const grid = document.getElementById('kpiGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    kpiConfigs.forEach(config => {
        const value = kpis[config.key] || 0;
        const card = document.createElement('div');
        card.className = 'kpi-card';
        card.innerHTML = `
            <div class="kpi-label">${config.icon} ${config.label}</div>
            <div class="kpi-value">${value}${config.suffix || ''}</div>
        `;
        grid.appendChild(card);
    });
}

// Load Funnel Data
function loadFunnel(collegeId) {
    return fetch(`/api/dashboard/funnel?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderFunnel(data.data);
                const insightEl = document.getElementById('funnelInsight');
                if (insightEl) {
                    insightEl.textContent = data.insight || 'No insight available';
                }
            }
        })
        .catch(error => {
            console.error('Error loading funnel:', error);
        });
}

// Render Funnel Chart
function renderFunnel(data) {
    const ctx = document.getElementById('funnelChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    
    if (state.funnelChart) {
        state.funnelChart.destroy();
    }
    
    const labels = ['Applied', 'Shortlisted', 'Interview', 'Offered', 'Hired', 'Rejected'];
    const values = labels.map(label => data[label] || 0);
    const colors = ['#93c5fd', '#60a5fa', '#3b82f6', '#2563eb', '#22c55e', '#ef4444'];
    
    state.funnelChart = new Chart(context, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Applications',
                data: values,
                backgroundColor: colors,
                borderColor: colors.map(c => c),
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load Activity Data
function loadActivity(collegeId) {
    return fetch(`/api/dashboard/activity?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderActivity(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading activity:', error);
        });
}

// Render Activity Chart
function renderActivity(data) {
    const ctx = document.getElementById('activityChart');
    if (!ctx) return;
    
    const context = ctx.getContext('2d');
    
    if (state.activityChart) {
        state.activityChart.destroy();
    }
    
    if (!data || data.length === 0) {
        return;
    }
    
    const dates = data.map(d => d.date);
    const applications = data.map(d => d.applications || 0);
    const hires = data.map(d => d.hires || 0);
    
    state.activityChart = new Chart(context, {
        type: 'line',
        data: {
            labels: dates,
            datasets: [
                {
                    label: 'Applications',
                    data: applications,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    fill: true,
                    tension: 0.4
                },
                {
                    label: 'Hires',
                    data: hires,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true,
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        stepSize: 1
                    }
                }
            }
        }
    });
}

// Load Top Recruiters
function loadTopRecruiters(collegeId) {
    return fetch(`/api/recruiters/top?collegeId=${collegeId}&limit=5`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderTopRecruiters(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading top recruiters:', error);
        });
}

// Render Top Recruiters
function renderTopRecruiters(recruiters) {
    const container = document.getElementById('topRecruitersList');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!recruiters || recruiters.length === 0) {
        container.innerHTML = '<div class="empty-state">No recruiters found</div>';
        return;
    }
    
    recruiters.forEach((recruiter, index) => {
        const card = document.createElement('div');
        card.className = 'top-recruiter-card';
        card.innerHTML = `
            <div class="rank">#${index + 1}</div>
            <div class="name">${recruiter.name || 'Unknown'}</div>
            <div class="company">${recruiter.company || 'N/A'}</div>
            <div class="stats">
                <span>📋 ${recruiter.jobs_posted || 0}</span>
                <span>📝 ${recruiter.applications || 0}</span>
                <span>🎯 ${recruiter.hires || 0}</span>
                <span>📈 ${recruiter.conversion_rate || 0}%</span>
            </div>
        `;
        container.appendChild(card);
    });
}

// Load Onboarding Summary
function loadOnboardingSummary(collegeId) {
    return fetch(`/api/onboarding/summary?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderOnboardingSummary(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading onboarding summary:', error);
        });
}

// Render Onboarding Summary
function renderOnboardingSummary(summary) {
    const container = document.getElementById('onboardingSummary');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!summary) {
        summary = {};
    }
    
    const items = [
        { label: 'Total Batches', value: summary.total_batches || 0 },
        { label: 'Total Records', value: summary.total_records || 0 },
        { label: 'Successful', value: summary.total_successful || 0 },
        { label: 'Failed', value: summary.total_failed || 0 },
        { label: 'Duplicates', value: summary.total_duplicates || 0 },
        { label: 'Success Rate', value: `${summary.overall_success_rate || 0}%` }
    ];
    
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = 'summary-item';
        div.innerHTML = `
            <div class="label">${item.label}</div>
            <div class="value">${item.value}</div>
        `;
        container.appendChild(div);
    });
}

// Load Onboarding Batches
function loadOnboardingBatches(collegeId) {
    return fetch(`/api/onboarding/batches?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderOnboardingBatches(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading onboarding batches:', error);
        });
}

// Render Onboarding Batches
function renderOnboardingBatches(batches) {
    const tbody = document.getElementById('onboardingTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!batches || batches.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" class="empty-state">No batches found</td></tr>';
        return;
    }
    
    batches.forEach(batch => {
        const tr = document.createElement('tr');
        const statusClass = (batch.status || 'pending').toLowerCase();
        tr.innerHTML = `
            <td>${batch.batch_name || 'Unnamed'}</td>
            <td>${batch.total_records || 0}</td>
            <td>${batch.successful_records || 0}</td>
            <td>${batch.failed_records || 0}</td>
            <td>${batch.duplicate_records || 0}</td>
            <td>${batch.success_rate || 0}%</td>
            <td><span class="status-badge ${statusClass}">${batch.status || 'Pending'}</span></td>
            <td>${batch.uploaded_at ? new Date(batch.uploaded_at).toLocaleDateString() : 'N/A'}</td>
        `;
        tbody.appendChild(tr);
    });
}

// Load Recruiters
function loadRecruiters(collegeId) {
    return fetch(`/api/recruiters/performance?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.recruiterData = data.data || [];
                renderRecruiters(state.recruiterData);
            }
        })
        .catch(error => {
            console.error('Error loading recruiters:', error);
        });
}

// Render Recruiters
function renderRecruiters(recruiters) {
    const tbody = document.getElementById('recruiterTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!recruiters || recruiters.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No recruiters found</td></tr>';
        return;
    }
    
    recruiters.forEach(recruiter => {
        const tr = document.createElement('tr');
        const statusClass = (recruiter.status || 'inactive').toLowerCase();
        tr.innerHTML = `
            <td>${recruiter.name || 'Unknown'}</td>
            <td>${recruiter.company || 'N/A'}</td>
            <td>${recruiter.jobs_posted || 0}</td>
            <td>${recruiter.applications || 0}</td>
            <td>${recruiter.shortlisted || 0}</td>
            <td>${recruiter.interviews || 0}</td>
            <td>${recruiter.offers || 0}</td>
            <td>${recruiter.hires || 0}</td>
            <td>${recruiter.conversionRate || 0}%</td>
            <td><span class="status-badge ${statusClass}">${recruiter.status || 'Inactive'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Filter Recruiters
function filterRecruiters() {
    const searchInput = document.getElementById('recruiterSearch');
    const filterSelect = document.getElementById('recruiterFilter');
    
    if (!searchInput || !filterSelect) return;
    
    const searchTerm = searchInput.value.toLowerCase();
    const filterStatus = filterSelect.value;
    
    let filtered = state.recruiterData || [];
    
    if (filterStatus !== 'all') {
        filtered = filtered.filter(r => r.status === filterStatus);
    }
    
    if (searchTerm) {
        filtered = filtered.filter(r => 
            (r.name || '').toLowerCase().includes(searchTerm) ||
            (r.company || '').toLowerCase().includes(searchTerm) ||
            (r.email || '').toLowerCase().includes(searchTerm)
        );
    }
    
    renderRecruiters(filtered);
}

// Sort Recruiters
function sortRecruiters(key) {
    const sorted = [...(state.recruiterData || [])];
    sorted.sort((a, b) => {
        const aVal = a[key] || 0;
        const bVal = b[key] || 0;
        if (typeof aVal === 'string') {
            return aVal.localeCompare(bVal);
        }
        return bVal - aVal;
    });
    renderRecruiters(sorted);
}

// Load Jobs
function loadJobs(collegeId) {
    return fetch(`/api/dashboard/jobs?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                state.jobData = data.data || [];
                renderJobs(state.jobData);
            }
        })
        .catch(error => {
            console.error('Error loading jobs:', error);
        });
}

// Render Jobs
function renderJobs(jobs) {
    const tbody = document.getElementById('jobTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    if (!jobs || jobs.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" class="empty-state">No jobs found</td></tr>';
        return;
    }
    
    jobs.forEach(job => {
        const tr = document.createElement('tr');
        const statusClass = (job.status || 'closed').toLowerCase();
        tr.innerHTML = `
            <td>${job.title || 'Untitled'}</td>
            <td>${job.department || 'N/A'}</td>
            <td>${job.recruiter_name || 'Unknown'}</td>
            <td>${job.openings || 0}</td>
            <td>${job.total_applications || 0}</td>
            <td>${job.interviews || 0}</td>
            <td>${job.offers || 0}</td>
            <td>${job.hires || 0}</td>
            <td>${job.fill_rate || 0}%</td>
            <td><span class="status-badge ${statusClass}">${job.status || 'Closed'}</span></td>
        `;
        tbody.appendChild(tr);
    });
}

// Load Insights
function loadInsights(collegeId) {
    return fetch(`/api/dashboard/insights?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderInsights(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading insights:', error);
        });
}

// Render Insights
function renderInsights(insights) {
    const container = document.getElementById('insightsContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!insights || insights.length === 0) {
        container.innerHTML = '<div class="empty-state">No insights available</div>';
        return;
    }
    
    insights.forEach(insight => {
        const card = document.createElement('div');
        const severityClass = (insight.severity || 'low').toLowerCase();
        card.className = `insight-card ${severityClass}`;
        card.innerHTML = `
            <div class="severity">${insight.severity || 'Low'} Priority</div>
            <div class="problem">${insight.problem || 'No problem identified'}</div>
            <div class="evidence">${insight.evidence || 'No evidence provided'}</div>
            <div class="action">💡 ${insight.action || 'No action recommended'}</div>
            ${insight.details ? `<div style="font-size:0.8rem;color:var(--gray-500);margin-top:0.5rem">${Array.isArray(insight.details) ? insight.details.join(', ') : insight.details}</div>` : ''}
        `;
        container.appendChild(card);
    });
}

// Load Data Quality
function loadDataQuality(collegeId) {
    return fetch(`/api/dashboard/data-quality?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderDataQuality(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading data quality:', error);
        });
}

// Render Data Quality
function renderDataQuality(quality) {
    const container = document.getElementById('dataQualityContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!quality) {
        container.innerHTML = '<div class="empty-state">No quality data available</div>';
        return;
    }
    
    // Overall status
    const overallDiv = document.createElement('div');
    const overallClass = (quality.overall || 'warning').toLowerCase();
    overallDiv.className = `overall-quality ${overallClass}`;
    overallDiv.textContent = `OVERALL DATA QUALITY: ${quality.overall || 'CHECKING...'}`;
    container.appendChild(overallDiv);
    
    // Individual checks
    const grid = document.createElement('div');
    grid.className = 'quality-grid';
    
    const checks = [
        { key: 'freshness', label: 'Data Freshness' },
        { key: 'nulls', label: 'Null Check' },
        { key: 'duplicates', label: 'Duplicate Check' },
        { key: 'spikes', label: 'Suspicious Spikes' }
    ];
    
    checks.forEach(({key, label}) => {
        const item = quality[key] || { status: 'unknown', message: 'Not checked' };
        const div = document.createElement('div');
        div.className = 'quality-item';
        const statusClass = (item.status || 'unknown').toLowerCase();
        div.innerHTML = `
            <div>${label}</div>
            <div class="status ${statusClass}">${item.status || 'Unknown'}</div>
            <div style="font-size:0.8rem;color:var(--gray-500)">${item.message || 'No data'}</div>
        `;
        grid.appendChild(div);
    });
    
    container.appendChild(grid);
}

// Load Metric Dictionary
function loadMetricDictionary(collegeId) {
    return fetch(`/api/dashboard/metric-dictionary?collegeId=${collegeId}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                renderMetricDictionary(data.data);
            }
        })
        .catch(error => {
            console.error('Error loading metric dictionary:', error);
        });
}

// Render Metric Dictionary
function renderMetricDictionary(metrics) {
    const container = document.getElementById('metricDictionaryContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    if (!metrics || metrics.length === 0) {
        container.innerHTML = '<div class="empty-state">No metrics available</div>';
        return;
    }
    
    const grid = document.createElement('div');
    grid.className = 'metric-grid';
    
    metrics.slice(0, 10).forEach(metric => {
        const div = document.createElement('div');
        div.className = 'metric-item';
        div.innerHTML = `
            <div class="name">${metric.name || 'Unnamed'}</div>
            <div class="definition">${metric.definition || 'No definition'}</div>
            <div class="source">Source: ${metric.source || 'Unknown'}</div>
            <div class="source">Decision: ${metric.decision || 'Not specified'}</div>
        `;
        grid.appendChild(div);
    });
    
    container.appendChild(grid);
}

// Export Data
function exportData(type) {
    const collegeId = state.collegeId;
    const url = `/api/export/${type}?collegeId=${collegeId}`;
    window.open(url, '_blank');
}

// Show Error
function showError(message) {
    console.error(message);
    // Simple visual feedback
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error';
    errorDiv.textContent = `⚠️ ${message}`;
    errorDiv.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 1rem 2rem;
        background: #fef2f2;
        color: #991b1b;
        border-radius: 8px;
        border: 1px solid #fecaca;
        z-index: 1000;
        max-width: 400px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.12);
    `;
    document.body.appendChild(errorDiv);
    setTimeout(() => {
        errorDiv.remove();
    }, 5000);
}