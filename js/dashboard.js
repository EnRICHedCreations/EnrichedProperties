// Dashboard JavaScript for Enriched Properties LLC CRM

// Global variables
let currentTab = 'overview';
let leads = [];
let properties = [];
let contracts = [];
let buyers = [];
let assignmentFees = [];
let contractDeadlines = [];

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check authentication
    checkAuthentication();
    
    // Initialize dashboard
    initializeDashboard();
    
    // Load data
    loadData();
    
    // Setup event listeners
    setupEventListeners();
    
    // Show default tab
    showTab('overview');
});

// Check if user is authenticated
function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('enrichedPropsAuth') === 'true';
    const username = localStorage.getItem('enrichedPropsUser');
    
    if (!isAuthenticated) {
        window.location.href = 'index.html';
        return;
    }
    
    // Update user display
    const userDisplay = document.getElementById('userDisplay');
    if (userDisplay && username) {
        userDisplay.textContent = username;
    }
}

// Initialize dashboard
function initializeDashboard() {
    // Add keyboard shortcuts
    document.addEventListener('keydown', handleKeyboardShortcuts);
    
    // Auto-save data periodically
    setInterval(saveData, 30000); // Save every 30 seconds
    
    // Check for updates
    checkForUpdates();
}

// Handle keyboard shortcuts
function handleKeyboardShortcuts(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case '1':
                e.preventDefault();
                showTab('overview');
                break;
            case '2':
                e.preventDefault();
                showTab('leads');
                break;
            case '3':
                e.preventDefault();
                showTab('contracts');
                break;
            case '4':
                e.preventDefault();
                showTab('properties');
                break;
            case '5':
                e.preventDefault();
                showTab('analytics');
                break;
            case '6':
                e.preventDefault();
                showTab('dealanalysis');
                break;
            case '7':
                e.preventDefault();
                showTab('marketing');
                break;
            case '3':
                if (e.shiftKey) { // Shift+3 for buyers (since 3 is contracts)
                    e.preventDefault();
                    showTab('buyers');
                }
                break;
            case 'n':
                e.preventDefault();
                if (currentTab === 'leads') showAddLeadModal();
                else if (currentTab === 'properties') showAddPropertyModal();
                else if (currentTab === 'buyers') showAddBuyerModal();
                break;
        }
    }
    
    // ESC key to close modals
    if (e.key === 'Escape') {
        hideAllModals();
    }
}

// Load data from cloud storage
async function loadData() {
    try {
        // Load data from cloud storage
        leads = await CloudStorage.loadData('Leads', []);
        properties = await CloudStorage.loadData('Properties', []);
        contracts = await CloudStorage.loadData('Contracts', []);
        buyers = await CloudStorage.loadData('Buyers', []);
        
        // Set up real-time listeners for cross-device updates
        CloudStorage.onDataChange('Leads', (newLeads) => {
            leads = newLeads;
            updateDashboardStats();
            if (currentTab === 'leads') updateLeadsTable();
            if (currentTab === 'overview') updateRecentActivities();
        });
        
        CloudStorage.onDataChange('Properties', (newProperties) => {
            properties = newProperties;
            updateDashboardStats();
            if (currentTab === 'properties') updatePropertiesGrid();
        });
        
        CloudStorage.onDataChange('Contracts', (newContracts) => {
            contracts = newContracts;
            updateDashboardStats();
            if (currentTab === 'contracts') updateContractsTable();
            if (currentTab === 'overview') updateRecentActivities();
        });
        
        CloudStorage.onDataChange('Buyers', (newBuyers) => {
            buyers = newBuyers;
            updateDashboardStats();
            if (currentTab === 'buyers') updateBuyersTable();
        });
        
    } catch (error) {
        console.error('Error loading data from cloud:', error);
        // Fallback to localStorage
        leads = JSON.parse(localStorage.getItem('enrichedPropsLeads') || '[]');
        properties = JSON.parse(localStorage.getItem('enrichedPropsProperties') || '[]');
        contracts = JSON.parse(localStorage.getItem('enrichedPropsContracts') || '[]');
        buyers = JSON.parse(localStorage.getItem('enrichedPropsBuyers') || '[]');
    }
    
    updateDashboardStats();
}

// Save data to cloud storage
async function saveData() {
    try {
        // Save to cloud storage
        await Promise.all([
            CloudStorage.saveData('Leads', leads),
            CloudStorage.saveData('Properties', properties),
            CloudStorage.saveData('Contracts', contracts),
            CloudStorage.saveData('Buyers', buyers)
        ]);
        
        console.log('All data saved to cloud successfully');
    } catch (error) {
        console.error('Error saving data to cloud:', error);
        // Fallback to localStorage
        localStorage.setItem('enrichedPropsLeads', JSON.stringify(leads));
        localStorage.setItem('enrichedPropsProperties', JSON.stringify(properties));
        localStorage.setItem('enrichedPropsContracts', JSON.stringify(contracts));
        localStorage.setItem('enrichedPropsBuyers', JSON.stringify(buyers));
    }
}


// Setup event listeners
function setupEventListeners() {
    // Auto-save on form changes
    document.addEventListener('change', function(e) {
        if (e.target.matches('input, textarea, select')) {
            clearTimeout(window.autoSaveTimer);
            window.autoSaveTimer = setTimeout(saveData, 2000);
        }
    });
    
    // Handle form submissions
    document.addEventListener('submit', function(e) {
        e.preventDefault();
        
        if (e.target.closest('#addLeadModal')) {
            addLead(e);
        } else if (e.target.closest('#addPropertyModal')) {
            addProperty(e);
        } else if (e.target.closest('#addBuyerModal')) {
            addBuyer(e);
        } else if (e.target.closest('#contractGeneratorModal')) {
            createContract(e);
        }
    });
}

// Tab management function has been moved to the end of the file as showTabOriginal
// and wrapped in the window.showTab override function

// Update dashboard stats
function updateDashboardStats() {
    const activeLeadsCount = leads.filter(lead => ['new', 'contacted', 'qualified'].includes(lead.status)).length;
    const dealsClosedCount = leads.filter(lead => lead.status === 'closed').length;
    const pendingCount = leads.filter(lead => lead.status === 'under-contract').length;
    const totalVolume = contracts.reduce((sum, contract) => sum + (contract.purchasePrice || 0), 0);
    
    // Contract counts
    const draftContractsCount = contracts.filter(contract => contract.status === 'draft').length;
    const activeContractsCount = contracts.filter(contract => contract.status === 'active').length;
    const executedContractsCount = contracts.filter(contract => contract.status === 'executed').length;
    
    // Buyer counts
    const hedgeFundBuyersCount = buyers.filter(buyer => buyer.type === 'hedge-fund').length;
    const privateBuyersCount = buyers.filter(buyer => buyer.type === 'private-investor').length;
    const activeBuyersCount = buyers.filter(buyer => buyer.status === 'active').length;
    
    // Update main dashboard elements
    const activeLeadsEl = document.getElementById('activeLeads');
    const dealsClosedEl = document.getElementById('dealsClosedCount');
    const pendingEl = document.getElementById('pendingCount');
    const totalVolumeEl = document.getElementById('totalVolume');
    
    // Update contract stats
    const draftContractsEl = document.getElementById('draftContractsCount');
    const activeContractsEl = document.getElementById('activeContractsCount');
    const executedContractsEl = document.getElementById('executedContractsCount');
    
    // Update buyer stats
    const hedgeFundBuyersEl = document.getElementById('hedgeFundBuyersCount');
    const privateBuyersEl = document.getElementById('privateBuyersCount');
    const activeBuyersEl = document.getElementById('activeBuyersCount');
    
    if (activeLeadsEl) activeLeadsEl.textContent = activeLeadsCount;
    if (dealsClosedEl) dealsClosedEl.textContent = dealsClosedCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (totalVolumeEl) totalVolumeEl.textContent = formatCurrency(totalVolume);
    
    if (draftContractsEl) draftContractsEl.textContent = draftContractsCount;
    if (activeContractsEl) activeContractsEl.textContent = activeContractsCount;
    if (executedContractsEl) executedContractsEl.textContent = executedContractsCount;
    
    if (hedgeFundBuyersEl) hedgeFundBuyersEl.textContent = hedgeFundBuyersCount;
    if (privateBuyersEl) privateBuyersEl.textContent = privateBuyersCount;
    if (activeBuyersEl) activeBuyersEl.textContent = activeBuyersCount;
}

// Update overview tab
function updateOverview() {
    updateDashboardStats();
    updateRecentActivities();
    updateContractDeadlines();
}

// Removed scroll sync functionality - no longer needed without top scroll bar

// Update recent activities
function updateRecentActivities() {
    const activitiesContainer = document.getElementById('recentActivities');
    if (!activitiesContainer) return;
    
    // Generate recent activities from leads and contracts
    const activities = [];
    
    // Add recent lead activities
    leads.forEach(lead => {
        if (lead.lastContact) {
            const daysSince = Math.floor((Date.now() - new Date(lead.lastContact).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince <= 7) {
                activities.push({
                    type: 'contact',
                    icon: '📞',
                    message: `Lead contacted - ${lead.firstName} ${lead.lastName}`,
                    time: getTimeAgo(lead.lastContact),
                    date: new Date(lead.lastContact)
                });
            }
        }
    });
    
    // Add contract activities
    contracts.forEach(contract => {
        const daysSince = Math.floor((Date.now() - new Date(contract.dateCreated).getTime()) / (1000 * 60 * 60 * 24));
        if (daysSince <= 7) {
            activities.push({
                type: 'contract',
                icon: contract.status === 'executed' ? '✅' : '📋',
                message: `Contract ${contract.status} - ${contract.propertyAddress}`,
                time: getTimeAgo(contract.dateCreated),
                date: new Date(contract.dateCreated)
            });
        }
    });
    
    // Sort by date
    activities.sort((a, b) => b.date - a.date);
    
    // Generate HTML
    if (activities.length === 0) {
        activitiesContainer.innerHTML = `
            <div class="text-center py-8 text-gray-500">
                <div class="text-4xl mb-2">📝</div>
                <p class="text-sm">No recent activity</p>
                <p class="text-xs">Activities will appear here as you work with leads and contracts</p>
            </div>
        `;
    } else {
        activitiesContainer.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="flex items-center p-3 bg-gray-50 rounded-lg">
                <div class="text-lg mr-3">${activity.icon}</div>
                <div class="flex-1">
                    <p class="text-sm font-medium">${activity.message}</p>
                    <p class="text-xs text-gray-500">${activity.time}</p>
                </div>
            </div>
        `).join('');
    }
}

// Update leads table
function updateLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
    if (leads.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">👥</div>
                    <p class="text-sm">No leads yet</p>
                    <p class="text-xs">Add your first lead to get started</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = leads.map(lead => `
            <tr class="table-row">
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="flex items-center">
                        <div>
                            <div class="text-sm font-medium text-gray-900">${lead.firstName} ${lead.lastName}</div>
                            <div class="text-sm text-gray-500">${lead.phone}</div>
                        </div>
                    </div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${lead.propertyAddress}</div>
                    <div class="text-sm text-gray-500">${lead.source}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${lead.email || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${formatPhoneNumber(lead.phone)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${lead.status}">${lead.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    ${lead.estimatedValue ? formatCurrency(lead.estimatedValue) : 'TBD'}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editLead(${lead.id})" class="action-button text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button onclick="deleteLead(${lead.id})" class="action-button text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

// Update contracts table
function updateContractsTable() {
    const tbody = document.getElementById('contractsTableBody');
    if (!tbody) return;
    
    if (contracts.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">📄</div>
                    <p class="text-sm">No contracts yet</p>
                    <p class="text-xs">Contracts will appear here as you close deals</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = contracts.map(contract => {
            // Get contract type
            const contractType = contract.type || (contract.contractData?.assignable ? 'Assignment' : 'Purchase');
            
            // Get assignment fee
            const assignmentFee = contract.assignmentFee || contract.contractData?.assignmentFee || 'N/A';
            
            // Calculate deadline (days until closing)
            const deadline = contract.closingDate ? calculateDaysUntilDeadline(contract.closingDate) : 'N/A';
            
            // Get signature status
            const signatureStatus = getContractSignatureStatus(contract);
            
            return `
            <tr class="table-row">
                <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">${contract.propertyAddress}</div>
                    <div class="text-xs text-gray-500">${contractType}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">${contractType}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">${contract.sellerName}</div>
                    <div class="text-xs text-gray-500">${contract.buyerName || 'Not assigned'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatCurrency(contract.purchasePrice)}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${assignmentFee !== 'N/A' ? formatCurrency(assignmentFee) : 'N/A'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="status-badge status-${contract.status}">${contract.status}</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm ${deadline.includes('days') && parseInt(deadline) <= 7 ? 'text-red-600 font-semibold' : 'text-gray-900'}">
                        ${deadline}
                    </div>
                    ${contract.closingDate ? `<div class="text-xs text-gray-500">${formatDate(contract.closingDate)}</div>` : ''}
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSignatureStatusColor(signatureStatus)}">
                        ${signatureStatus}
                    </span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewContract(${contract.id})" class="action-button text-indigo-600 hover:text-indigo-900 mr-1" title="View Contract">View</button>
                    <button onclick="showDigitalSignatureModal(${contract.id})" class="action-button text-green-600 hover:text-green-900 mr-1" title="Manage Signatures">Sign</button>
                    <button onclick="editContract(${contract.id})" class="action-button text-gray-600 hover:text-gray-900 mr-1" title="Edit Contract">Edit</button>
                    <button onclick="deleteContract(${contract.id})" class="action-button text-red-600 hover:text-red-900" title="Delete Contract">Delete</button>
                </td>
            </tr>
            `;
        }).join('');
    }
}

// Update properties grid
function updatePropertiesGrid() {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;
    
    if (properties.length === 0) {
        grid.innerHTML = `
            <div class="col-span-full text-center py-12 text-gray-500">
                <div class="text-6xl mb-4">🏠</div>
                <p class="text-lg font-medium mb-2">No properties yet</p>
                <p class="text-sm">Add your first property to start building your portfolio</p>
                <button onclick="showAddPropertyModal()" class="mt-4 bg-secondary text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors">
                    Add Property
                </button>
            </div>
        `;
    } else {
        grid.innerHTML = properties.map(property => `
            <div class="property-card bg-white rounded-lg shadow p-6 card-hover">
                <div class="mb-4">
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">${property.address}</h3>
                    <div class="flex justify-between items-center">
                        <span class="text-2xl font-bold text-secondary">${formatCurrency(property.purchasePrice)}</span>
                        <span class="status-badge status-${property.status || 'active'}">${property.status || 'Active'}</span>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div>
                        <span class="font-medium">${property.bedrooms || 'N/A'}</span>
                        <div>Beds</div>
                    </div>
                    <div>
                        <span class="font-medium">${property.bathrooms || 'N/A'}</span>
                        <div>Baths</div>
                    </div>
                    <div>
                        <span class="font-medium">${property.sqft ? property.sqft.toLocaleString() : 'N/A'}</span>
                        <div>Sq Ft</div>
                    </div>
                </div>
                ${property.notes ? `<p class="text-sm text-gray-600 mb-4">${property.notes}</p>` : ''}
                <div class="flex justify-between items-center">
                    <span class="text-sm text-gray-500">Added ${getTimeAgo(property.dateAdded)}</span>
                    <div class="flex flex-wrap gap-1">
                        <button onclick="editProperty(${property.id})" class="action-button text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
                        <button onclick="findBuyersForProperty(${property.id})" class="action-button text-green-600 hover:text-green-900 text-xs">Find Buyers</button>
                        <button onclick="deleteProperty(${property.id})" class="action-button text-red-600 hover:text-red-900 text-xs">Delete</button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// Update analytics
function updateAnalytics() {
    // Analytics are already updated in the HTML template
    // This could be expanded to include dynamic charts
}

// Update buyers table
function updateBuyersTable() {
    // Update buyer performance scores before displaying
    updateBuyerPerformance();
    
    const tbody = document.getElementById('buyersTableBody');
    if (!tbody) return;
    
    if (buyers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">🏦</div>
                    <p class="text-sm">No buyers yet</p>
                    <p class="text-xs">Add your first buyer to start building your network</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = buyers.map(buyer => `
            <tr class="table-row">
                <td class="px-4 py-4">
                    <div class="text-sm font-medium text-gray-900">${buyer.name}</div>
                    <div class="text-sm text-gray-500">${buyer.company || ''}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="status-badge status-${buyer.type}">${formatBuyerType(buyer.type)}</span>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${buyer.city || buyer.address?.city || 'N/A'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${buyer.state || buyer.address?.state || 'N/A'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${buyer.email || 'N/A'}</div>
                    <div class="text-sm text-gray-500">${formatPhoneNumber(buyer.phone) || 'N/A'}</div>
                </td>
                <td class="px-4 py-4">
                    <div class="text-sm text-gray-900">${buyer.preferredAreas || 'Any'}</div>
                    <div class="text-sm text-gray-500">${buyer.propertyTypes || 'All types'}</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${buyer.minBudget ? formatCurrency(buyer.minBudget) : '$0'} - ${buyer.maxBudget ? formatCurrency(buyer.maxBudget) : '∞'}
                    </div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap">
                    <span class="status-badge status-${buyer.status}">${buyer.status}</span>
                    <div class="text-xs text-gray-500 mt-1">Score: ${buyer.performanceScore || 0}/100</div>
                </td>
                <td class="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div class="flex flex-wrap gap-1">
                        <button onclick="editBuyer(${buyer.id})" class="action-button text-indigo-600 hover:text-indigo-900 text-xs">Edit</button>
                        <button onclick="addBuyerReferral(${buyer.id})" class="action-button text-green-600 hover:text-green-900 text-xs">Add Referral</button>
                        <button onclick="deleteBuyer(${buyer.id})" class="action-button text-red-600 hover:text-red-900 text-xs">Delete</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }
}

// Modal functions
function showAddLeadModal() {
    const modal = document.getElementById('addLeadModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function hideAddLeadModal() {
    const modal = document.getElementById('addLeadModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
    }
}

function showAddPropertyModal() {
    const modal = document.getElementById('addPropertyModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function hideAddPropertyModal() {
    const modal = document.getElementById('addPropertyModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
    }
}

// Buyer modal functions
function showAddBuyerModal() {
    const modal = document.getElementById('addBuyerModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function hideAddBuyerModal() {
    const modal = document.getElementById('addBuyerModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
    }
}

function hideAllModals() {
    hideAddLeadModal();
    hideAddPropertyModal();
    hideAddBuyerModal();
    hideImportBuyersModal();
    hideContractGeneratorModal();
    hideContractPreviewModal();
}

// Contract Generator Modal Functions
function showContractGeneratorModal() {
    const modal = document.getElementById('contractGeneratorModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Set default closing date (30 days from now)
        const closingDate = new Date();
        closingDate.setDate(closingDate.getDate() + 30);
        const closingInput = document.getElementById('contractClosingDate');
        if (closingInput) {
            closingInput.value = closingDate.toISOString().split('T')[0];
        }
        
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

function hideContractGeneratorModal() {
    const modal = document.getElementById('contractGeneratorModal');
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form if it exists
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

function showContractPreviewModal() {
    const modal = document.getElementById('contractPreviewModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    }
}

function hideContractPreviewModal() {
    const modal = document.getElementById('contractPreviewModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
    }
}

// Add lead
function addLead(event) {
    event.preventDefault();
    
    const form = event.target;
    const leadData = {
        id: Date.now(),
        firstName: form.querySelector('#leadFirstName').value,
        lastName: form.querySelector('#leadLastName').value,
        phone: form.querySelector('#leadPhone').value,
        email: form.querySelector('#leadEmail').value,
        propertyAddress: form.querySelector('#leadProperty').value,
        estimatedValue: parseInt(form.querySelector('#leadValue').value) || 0,
        source: form.querySelector('#leadSource').value,
        notes: form.querySelector('#leadNotes').value,
        status: 'new',
        dateAdded: new Date().toISOString(),
        lastContact: null
    };
    
    leads.push(leadData);
    saveData();
    updateLeadsTable();
    updateDashboardStats();
    hideAddLeadModal();
    
    showSuccessMessage('Lead added successfully!');
}

// Add property
function addProperty(event) {
    event.preventDefault();
    
    const form = event.target;
    const propertyData = {
        id: Date.now(),
        address: form.querySelector('#propertyAddress').value,
        purchasePrice: parseInt(form.querySelector('#propertyPrice').value),
        bedrooms: parseInt(form.querySelector('#propertyBedrooms').value) || null,
        bathrooms: parseFloat(form.querySelector('#propertyBathrooms').value) || null,
        sqft: parseInt(form.querySelector('#propertySqft').value) || null,
        yearBuilt: parseInt(form.querySelector('#propertyYear').value) || null,
        notes: form.querySelector('#propertyNotes').value,
        status: 'active',
        dateAdded: new Date().toISOString()
    };
    
    properties.push(propertyData);
    saveData();
    updatePropertiesGrid();
    hideAddPropertyModal();
    
    showSuccessMessage('Property added successfully!');
}

// Add buyer
function addBuyer(event) {
    event.preventDefault();
    
    const form = event.target;
    const buyerData = {
        id: Date.now(),
        name: form.querySelector('#buyerName').value,
        company: form.querySelector('#buyerCompany').value,
        phone: form.querySelector('#buyerPhone').value,
        email: form.querySelector('#buyerEmail').value,
        type: form.querySelector('#buyerType').value,
        status: form.querySelector('#buyerStatus').value,
        minBudget: parseInt(form.querySelector('#buyerMinBudget').value) || null,
        maxBudget: parseInt(form.querySelector('#buyerMaxBudget').value) || null,
        preferredAreas: form.querySelector('#buyerAreas').value,
        propertyTypes: form.querySelector('#buyerPropertyTypes').value,
        notes: form.querySelector('#buyerNotes').value,
        dateAdded: new Date().toISOString(),
        lastContact: null
    };
    
    buyers.push(buyerData);
    saveData();
    updateBuyersTable();
    updateDashboardStats();
    hideAddBuyerModal();
    
    showSuccessMessage('Buyer added successfully!');
}

// CSV Import Functions
function showImportBuyersModal() {
    const modal = document.getElementById('importBuyersModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        
        // Reset modal state
        resetImportModal();
        
        setTimeout(() => {
            const fileInput = modal.querySelector('#csvFileInput');
            if (fileInput) fileInput.focus();
        }, 100);
    }
}

function hideImportBuyersModal() {
    const modal = document.getElementById('importBuyersModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        resetImportModal();
    }
}

function resetImportModal() {
    // Reset file input
    const fileInput = document.getElementById('csvFileInput');
    if (fileInput) fileInput.value = '';
    
    // Hide preview and options
    document.getElementById('csvPreview').classList.add('hidden');
    document.getElementById('importOptions').classList.add('hidden');
    document.getElementById('importStatus').classList.add('hidden');
    
    // Reset buttons
    document.getElementById('previewCSVBtn').classList.remove('hidden');
    document.getElementById('importCSVBtn').classList.add('hidden');
    
    // Clear preview table
    const table = document.getElementById('csvPreviewTable');
    if (table) {
        table.querySelector('thead').innerHTML = '';
        table.querySelector('tbody').innerHTML = '';
    }
}

let csvData = [];
let csvHeaders = [];

function previewCSV() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showErrorMessage('Please select a CSV file first.');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        showErrorMessage('Please select a valid CSV file.');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csvText = e.target.result;
            const lines = csvText.trim().split('\n');
            
            if (lines.length < 2) {
                showErrorMessage('CSV file must contain at least a header row and one data row.');
                return;
            }
            
            // Parse CSV headers
            csvHeaders = parseCSVLine(lines[0]);
            
            // Validate required headers (only essential fields)
            const requiredHeaders = ['Business_Name', 'Contact_Person', 'Phone_Primary', 'Email_Business'];
            const missingHeaders = requiredHeaders.filter(header => 
                !csvHeaders.some(csvHeader => csvHeader.toLowerCase() === header.toLowerCase())
            );
            
            // Define all supported headers for comprehensive mapping
            const supportedHeaders = [
                // Required fields
                'Business_Name', 'Contact_Person', 'Phone_Primary', 'Email_Business',
                // Optional contact fields
                'Phone_Secondary', 'Email_Personal',
                // Address fields
                'Address_Street', 'Address_City', 'Address_State', 'Address_Zip',
                // Investment details
                'Investment_Focus', 'Cash_Buyer_Status', 'Price_Range_Min', 'Price_Range_Max',
                'Assignment_Experience', 'Closing_Timeline_Days',
                // Property criteria
                'Preferred_Areas', 'Property_Types', 'Condition_Preferences',
                // Status and tracking
                'Activity_Level', 'Performance_Score', 'Deals_Completed',
                'Date_Verified', 'Last_Contact',
                // Sources and notes
                'Source_1', 'Source_2', 'Notes'
            ];
            
            // Log detected headers for debugging
            console.log('CSV Headers detected:', csvHeaders);
            console.log('Supported headers:', supportedHeaders);
            
            // Show header mapping guide
            displayHeaderMappingGuide();
            
            if (missingHeaders.length > 0) {
                showErrorMessage(`Missing required headers: ${missingHeaders.join(', ')}`);
                return;
            }
            
            // Parse CSV data
            csvData = [];
            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const rowData = parseCSVLine(lines[i]);
                    const rowObject = {};
                    csvHeaders.forEach((header, index) => {
                        rowObject[header] = rowData[index] || '';
                    });
                    csvData.push(rowObject);
                }
            }
            
            if (csvData.length === 0) {
                showErrorMessage('No valid data rows found in CSV file.');
                return;
            }
            
            // Show preview
            displayCSVPreview();
            showSuccessMessage(`CSV loaded successfully! Found ${csvData.length} buyers to import.`);
            
        } catch (error) {
            console.error('CSV parsing error:', error);
            showErrorMessage('Error parsing CSV file. Please check the file format.');
        }
    };
    
    reader.readAsText(file);
}

function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            if (inQuotes && line[i + 1] === '"') {
                current += '"';
                i++; // Skip next quote
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

function displayHeaderMappingGuide() {
    const headerGuide = document.getElementById('headerMappingGuide');
    if (!headerGuide) return;
    
    const requiredFields = [
        { header: 'Business_Name', description: 'Company or business entity name (required)', example: 'ABC Investment LLC' },
        { header: 'Contact_Person', description: 'Primary contact person name (required)', example: 'John Smith' },
        { header: 'Phone_Primary', description: 'Primary phone number (required)', example: '555-123-4567' },
        { header: 'Email_Business', description: 'Business email address (required)', example: 'john@abcinvest.com' }
    ];
    
    const optionalFields = [
        { header: 'Phone_Secondary', description: 'Secondary phone number', example: '555-987-6543' },
        { header: 'Email_Personal', description: 'Personal email address', example: 'john.smith@gmail.com' },
        { header: 'Address_Street', description: 'Street address', example: '123 Main St' },
        { header: 'Address_City', description: 'City', example: 'Houston' },
        { header: 'Address_State', description: 'State (2-letter code)', example: 'TX' },
        { header: 'Address_Zip', description: 'ZIP/Postal code', example: '77001' },
        { header: 'Investment_Focus', description: 'Investment strategy', example: 'Fix & Flip, Buy & Hold' },
        { header: 'Cash_Buyer_Status', description: 'Cash buyer verification', example: 'Confirmed, Unconfirmed' },
        { header: 'Price_Range_Min', description: 'Minimum budget', example: '100000' },
        { header: 'Price_Range_Max', description: 'Maximum budget', example: '500000' },
        { header: 'Assignment_Experience', description: 'Experience with assignments', example: 'Yes, No, Unknown' },
        { header: 'Closing_Timeline_Days', description: 'Days to close', example: '30' },
        { header: 'Preferred_Areas', description: 'Target areas', example: 'Houston Metro, Harris County' },
        { header: 'Property_Types', description: 'Property types', example: 'SFR, Multi-family' },
        { header: 'Condition_Preferences', description: 'Property condition preferences', example: 'Distressed, Light rehab' },
        { header: 'Activity_Level', description: 'Buyer activity level', example: 'Active, Warm, Cold' },
        { header: 'Performance_Score', description: 'Performance score (0-100)', example: '85' },
        { header: 'Deals_Completed', description: 'Number of deals closed', example: '5' },
        { header: 'Date_Verified', description: 'Date verified (YYYY-MM-DD)', example: '2024-01-15' },
        { header: 'Last_Contact', description: 'Last contact date (YYYY-MM-DD)', example: '2024-01-20' },
        { header: 'Source_1', description: 'Primary source', example: 'Company website' },
        { header: 'Source_2', description: 'Secondary source', example: 'Google listing' },
        { header: 'Notes', description: 'Additional notes', example: 'Prefers distressed properties' }
    ];
    
    let guideHTML = `
        <div class="mb-4 p-4 bg-blue-50 rounded-lg">
            <h4 class="font-medium text-blue-900 mb-2">CSV Header Mapping Guide</h4>
            <div class="text-sm text-blue-800">
                <div class="mb-3">
                    <strong>Legend:</strong>
                    <span class="text-green-600 ml-2">✓ Required</span>
                    <span class="text-blue-600 ml-2">● Supported</span>
                    <span class="text-gray-400 ml-2">○ Unmapped</span>
                </div>
                
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div>
                        <h5 class="font-medium text-green-800 mb-2">Required Fields</h5>
                        <div class="space-y-1">
                            ${requiredFields.map(field => `
                                <div class="text-xs">
                                    <code class="bg-green-100 px-1 rounded">${field.header}</code>
                                    <span class="text-gray-600">- ${field.description}</span>
                                </div>
                            `).join('')}
                        </div>
                    </div>
                    
                    <div>
                        <h5 class="font-medium text-blue-800 mb-2">Optional Fields (${optionalFields.length} available)</h5>
                        <div class="space-y-1 max-h-32 overflow-y-auto">
                            ${optionalFields.slice(0, 10).map(field => `
                                <div class="text-xs">
                                    <code class="bg-blue-100 px-1 rounded">${field.header}</code>
                                    <span class="text-gray-600">- ${field.description}</span>
                                </div>
                            `).join('')}
                            ${optionalFields.length > 10 ? `<div class="text-xs text-gray-500">... and ${optionalFields.length - 10} more</div>` : ''}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    headerGuide.innerHTML = guideHTML;
}

function displayCSVPreview() {
    const table = document.getElementById('csvPreviewTable');
    const thead = table.querySelector('thead');
    const tbody = table.querySelector('tbody');
    
    // Clear existing content
    thead.innerHTML = '';
    tbody.innerHTML = '';
    
    // Define required and supported headers for status indication
    const requiredHeaders = ['Business_Name', 'Contact_Person', 'Phone_Primary', 'Email_Business'];
    const supportedHeaders = [
        'Business_Name', 'Contact_Person', 'Phone_Primary', 'Email_Business',
        'Phone_Secondary', 'Email_Personal', 'Address_Street', 'Address_City', 
        'Address_State', 'Address_Zip', 'Investment_Focus', 'Cash_Buyer_Status', 
        'Price_Range_Min', 'Price_Range_Max', 'Assignment_Experience', 
        'Closing_Timeline_Days', 'Preferred_Areas', 'Property_Types', 
        'Condition_Preferences', 'Activity_Level', 'Performance_Score', 
        'Deals_Completed', 'Date_Verified', 'Last_Contact', 'Source_1', 'Source_2', 'Notes'
    ];
    
    // Create header row with status indicators
    const headerRow = document.createElement('tr');
    csvHeaders.forEach(header => {
        const th = document.createElement('th');
        const isRequired = requiredHeaders.some(req => req.toLowerCase() === header.toLowerCase());
        const isSupported = supportedHeaders.some(sup => sup.toLowerCase() === header.toLowerCase());
        
        let statusClass = 'text-gray-500';
        let statusIcon = '';
        
        if (isRequired) {
            statusClass = 'text-green-600';
            statusIcon = '✓ ';
        } else if (isSupported) {
            statusClass = 'text-blue-600';
            statusIcon = '● ';
        } else {
            statusClass = 'text-gray-400';
            statusIcon = '○ ';
        }
        
        th.className = `px-4 py-2 text-left text-xs font-medium ${statusClass} uppercase tracking-wider`;
        th.innerHTML = `${statusIcon}${header}`;
        th.title = isRequired ? 'Required field' : isSupported ? 'Supported field' : 'Field not mapped';
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    
    // Create data rows (first 5 only for preview)
    const previewData = csvData.slice(0, 5);
    previewData.forEach(row => {
        const tr = document.createElement('tr');
        csvHeaders.forEach(header => {
            const td = document.createElement('td');
            td.className = 'px-4 py-2 text-sm text-gray-900';
            td.textContent = row[header] || '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    
    // Show preview and options
    document.getElementById('csvPreview').classList.remove('hidden');
    document.getElementById('importOptions').classList.remove('hidden');
    
    // Switch buttons
    document.getElementById('previewCSVBtn').classList.add('hidden');
    document.getElementById('importCSVBtn').classList.remove('hidden');
}

function importBuyersFromCSV() {
    if (csvData.length === 0) {
        showErrorMessage('No data to import. Please preview the CSV first.');
        return;
    }
    
    const skipDuplicates = document.getElementById('skipDuplicates').checked;
    const setAsActive = document.getElementById('setAsActive').checked;
    
    // Show progress
    document.getElementById('importStatus').classList.remove('hidden');
    const progressBar = document.getElementById('importProgressBar');
    const progressText = document.getElementById('importProgress');
    
    let imported = 0;
    let skipped = 0;
    let errors = 0;
    
    csvData.forEach((row, index) => {
        try {
            // Map CSV fields to buyer object
            const buyerData = mapCSVToBuyer(row, setAsActive);
            
            // Check for duplicates if option is enabled
            if (skipDuplicates && buyerData.email) {
                const existingBuyer = buyers.find(b => 
                    b.email && b.email.toLowerCase() === buyerData.email.toLowerCase()
                );
                if (existingBuyer) {
                    skipped++;
                    updateProgress(index + 1, csvData.length, imported, skipped, errors);
                    return;
                }
            }
            
            // Add buyer to list
            buyers.push(buyerData);
            imported++;
            
        } catch (error) {
            console.error('Error importing buyer:', error, row);
            errors++;
        }
        
        updateProgress(index + 1, csvData.length, imported, skipped, errors);
    });
    
    // Save data and update UI
    saveData();
    updateBuyersTable();
    updateDashboardStats();
    
    // Show results
    setTimeout(() => {
        let message = `Import completed! Imported: ${imported}`;
        if (skipped > 0) message += `, Skipped: ${skipped}`;
        if (errors > 0) message += `, Errors: ${errors}`;
        
        if (imported > 0) {
            showSuccessMessage(message);
        } else {
            showErrorMessage(message);
        }
        
        if (imported > 0) {
            hideImportBuyersModal();
        }
    }, 500);
}

function updateProgress(current, total, imported, skipped, errors) {
    const progressBar = document.getElementById('importProgressBar');
    const progressText = document.getElementById('importProgress');
    
    const percentage = (current / total) * 100;
    progressBar.style.width = `${percentage}%`;
    progressText.textContent = `${current}/${total} (Imported: ${imported}, Skipped: ${skipped}, Errors: ${errors})`;
}

function mapCSVToBuyer(csvRow, setAsActive) {
    // Helper function to get CSV value by header name (case-insensitive)
    const getValue = (headerName) => {
        const header = csvHeaders.find(h => h.toLowerCase() === headerName.toLowerCase());
        return header ? (csvRow[header] || '').trim() : '';
    };
    
    // Map investment focus to buyer type
    const investmentFocus = getValue('Investment_Focus').toLowerCase();
    let buyerType = 'other';
    
    if (investmentFocus.includes('hedge fund') || investmentFocus.includes('fund')) {
        buyerType = 'hedge-fund';
    } else if (investmentFocus.includes('private') || investmentFocus.includes('investor')) {
        buyerType = 'private-investor';
    } else if (investmentFocus.includes('fix') || investmentFocus.includes('flip')) {
        buyerType = 'fix-flip';
    } else if (investmentFocus.includes('hold') || investmentFocus.includes('rental')) {
        buyerType = 'buy-hold';
    } else if (investmentFocus.includes('wholesale')) {
        buyerType = 'wholesaler';
    }
    
    // Parse budget ranges
    const minBudget = parseInt(getValue('Price_Range_Min')) || null;
    const maxBudget = parseInt(getValue('Price_Range_Max')) || null;
    
    return {
        id: Date.now() + Math.random(), // Ensure unique IDs
        name: getValue('Contact_Person') || getValue('Business_Name'),
        company: getValue('Business_Name'),
        phone: getValue('Phone_Primary') || getValue('Phone_Secondary'),
        email: getValue('Email_Business') || getValue('Email_Personal'),
        type: buyerType,
        status: getValue('Activity_Level')?.toLowerCase() || (setAsActive ? 'active' : 'warm'),
        minBudget: minBudget,
        maxBudget: maxBudget,
        preferredAreas: getValue('Preferred_Areas') || `${getValue('Address_City')}, ${getValue('Address_State')}`.replace(', ', ''),
        propertyTypes: getValue('Property_Types'),
        notes: getValue('Notes') || `Investment Focus: ${getValue('Investment_Focus')}`,
        dateAdded: new Date().toISOString(),
        lastContact: null,
        
        // Location fields for virtual wholesaling
        city: getValue('Address_City'),
        state: getValue('Address_State'),
        
        // All CSV fields for complete data mapping (matching edit modal structure)
        secondaryPhone: getValue('Phone_Secondary'),
        personalEmail: getValue('Email_Personal'),
        cashBuyerStatus: getValue('Cash_Buyer_Status') || 'Unconfirmed',
        assignmentExperience: getValue('Assignment_Experience') || 'Unknown',
        closingTimelineDays: parseInt(getValue('Closing_Timeline_Days')) || null,
        conditionPreferences: getValue('Condition_Preferences'),
        dateVerified: getValue('Date_Verified'),
        performanceScore: parseInt(getValue('Performance_Score')) || 0,
        dealsCompleted: parseInt(getValue('Deals_Completed')) || 0,
        lastContact: getValue('Last_Contact') ? new Date(getValue('Last_Contact')).toISOString() : null,
        source1: getValue('Source_1'),
        source2: getValue('Source_2'),
        
        address: {
            street: getValue('Address_Street'),
            city: getValue('Address_City'),
            state: getValue('Address_State'),
            zip: getValue('Address_Zip')
        }
    };
}

// CRUD operations
function editLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    const formContent = `
        <div class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">First Name *</label>
                    <input type="text" id="editLeadFirstName" value="${lead.firstName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Last Name *</label>
                    <input type="text" id="editLeadLastName" value="${lead.lastName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone *</label>
                    <input type="tel" id="editLeadPhone" value="${lead.phone || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email</label>
                    <input type="email" id="editLeadEmail" value="${lead.email || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Property Address *</label>
                <input type="text" id="editLeadPropertyAddress" value="${lead.propertyAddress || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="editLeadStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="new" ${lead.status === 'new' ? 'selected' : ''}>New</option>
                        <option value="contacted" ${lead.status === 'contacted' ? 'selected' : ''}>Contacted</option>
                        <option value="qualified" ${lead.status === 'qualified' ? 'selected' : ''}>Qualified</option>
                        <option value="under-contract" ${lead.status === 'under-contract' ? 'selected' : ''}>Under Contract</option>
                        <option value="closed" ${lead.status === 'closed' ? 'selected' : ''}>Closed</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Source</label>
                    <select id="editLeadSource" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="website" ${lead.source === 'website' ? 'selected' : ''}>Website</option>
                        <option value="referral" ${lead.source === 'referral' ? 'selected' : ''}>Referral</option>
                        <option value="social-media" ${lead.source === 'social-media' ? 'selected' : ''}>Social Media</option>
                        <option value="direct-mail" ${lead.source === 'direct-mail' ? 'selected' : ''}>Direct Mail</option>
                        <option value="cold-call" ${lead.source === 'cold-call' ? 'selected' : ''}>Cold Call</option>
                        <option value="other" ${lead.source === 'other' ? 'selected' : ''}>Other</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Estimated Value</label>
                <input type="number" id="editLeadEstimatedValue" value="${lead.estimatedValue || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="editLeadNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any additional notes about this lead...">${lead.notes || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Edit Lead', formContent, () => saveEditedLead(id));
}

function saveEditedLead(id) {
    const lead = leads.find(l => l.id === id);
    if (!lead) return;
    
    // Get form values
    const firstName = document.getElementById('editLeadFirstName').value.trim();
    const lastName = document.getElementById('editLeadLastName').value.trim();
    const phone = document.getElementById('editLeadPhone').value.trim();
    const email = document.getElementById('editLeadEmail').value.trim();
    const propertyAddress = document.getElementById('editLeadPropertyAddress').value.trim();
    const status = document.getElementById('editLeadStatus').value;
    const source = document.getElementById('editLeadSource').value;
    const estimatedValue = parseFloat(document.getElementById('editLeadEstimatedValue').value) || null;
    const notes = document.getElementById('editLeadNotes').value.trim();
    
    // Validate required fields
    if (!firstName || !lastName || !phone || !propertyAddress) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Update lead object
    lead.firstName = firstName;
    lead.lastName = lastName;
    lead.phone = phone;
    lead.email = email;
    lead.propertyAddress = propertyAddress;
    lead.status = status;
    lead.source = source;
    lead.estimatedValue = estimatedValue;
    lead.notes = notes;
    lead.lastContact = new Date().toISOString();
    
    // Save and update UI
    saveData();
    updateLeadsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Lead updated successfully!');
}

function deleteLead(id) {
    if (confirm('Are you sure you want to delete this lead?')) {
        leads = leads.filter(l => l.id !== id);
        saveData();
        updateLeadsTable();
        updateDashboardStats();
        showSuccessMessage('Lead deleted successfully!');
    }
}

function editProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;
    
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Property Address *</label>
                <input type="text" id="editPropertyAddress" value="${property.address || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Bedrooms</label>
                    <input type="number" id="editPropertyBedrooms" value="${property.bedrooms || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Bathrooms</label>
                    <input type="number" id="editPropertyBathrooms" value="${property.bathrooms || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" step="0.5">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Square Feet</label>
                    <input type="number" id="editPropertySqft" value="${property.sqft || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input type="number" id="editPropertyPurchasePrice" value="${property.purchasePrice || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="editPropertyStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="active" ${(property.status || 'active') === 'active' ? 'selected' : ''}>Active</option>
                        <option value="under-contract" ${property.status === 'under-contract' ? 'selected' : ''}>Under Contract</option>
                        <option value="sold" ${property.status === 'sold' ? 'selected' : ''}>Sold</option>
                        <option value="on-hold" ${property.status === 'on-hold' ? 'selected' : ''}>On Hold</option>
                    </select>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="editPropertyNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any additional notes about this property...">${property.notes || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Edit Property', formContent, () => saveEditedProperty(id));
}

function saveEditedProperty(id) {
    const property = properties.find(p => p.id === id);
    if (!property) return;
    
    // Get form values
    const address = document.getElementById('editPropertyAddress').value.trim();
    const bedrooms = parseInt(document.getElementById('editPropertyBedrooms').value) || null;
    const bathrooms = parseFloat(document.getElementById('editPropertyBathrooms').value) || null;
    const sqft = parseInt(document.getElementById('editPropertySqft').value) || null;
    const purchasePrice = parseFloat(document.getElementById('editPropertyPurchasePrice').value);
    const status = document.getElementById('editPropertyStatus').value;
    const notes = document.getElementById('editPropertyNotes').value.trim();
    
    // Validate required fields
    if (!address || !purchasePrice) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Update property object
    property.address = address;
    property.bedrooms = bedrooms;
    property.bathrooms = bathrooms;
    property.sqft = sqft;
    property.purchasePrice = purchasePrice;
    property.status = status;
    property.notes = notes;
    
    // Save and update UI
    saveData();
    updatePropertiesGrid();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Property updated successfully!');
}

function deleteProperty(id) {
    if (confirm('Are you sure you want to delete this property?')) {
        properties = properties.filter(p => p.id !== id);
        saveData();
        updatePropertiesGrid();
        showSuccessMessage('Property deleted successfully!');
    }
}

function viewContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;
    
    // Generate contract HTML based on type
    let contractHTML = '';
    const contractType = contract.type || 'Purchase';
    
    switch (contractType.toLowerCase()) {
        case 'assignment':
            contractHTML = generateAssignmentAgreementHTML(contract);
            break;
        case 'option':
        case 'option to purchase':
            contractHTML = generateOptionContractHTML(contract);
            break;
        case 'wholesale':
        case 'wholesale purchase agreement':
            contractHTML = generateWholesaleContractHTML(contract);
            break;
        default:
            contractHTML = generatePurchaseAgreementHTML(contract);
            break;
    }
    
    // Show contract document modal
    showContractDocumentModal(contract, contractHTML);
}

function editContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;
    
    const contractType = contract.type || 'Purchase';
    
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Property Address *</label>
                <input type="text" id="editContractPropertyAddress" value="${contract.propertyAddress || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Seller Name *</label>
                    <input type="text" id="editContractSellerName" value="${contract.sellerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Buyer Name</label>
                    <input type="text" id="editContractBuyerName" value="${contract.buyerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input type="number" id="editContractPurchasePrice" value="${contract.purchasePrice || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Assignment Fee</label>
                    <input type="number" id="editContractAssignmentFee" value="${contract.assignmentFee || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Contract Type</label>
                    <select id="editContractType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="Purchase" ${contractType === 'Purchase' ? 'selected' : ''}>Purchase</option>
                        <option value="Assignment" ${contractType === 'Assignment' ? 'selected' : ''}>Assignment</option>
                        <option value="Option" ${contractType === 'Option' ? 'selected' : ''}>Option</option>
                        <option value="Wholesale" ${contractType === 'Wholesale' ? 'selected' : ''}>Wholesale</option>
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Status</label>
                    <select id="editContractStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="draft" ${contract.status === 'draft' ? 'selected' : ''}>Draft</option>
                        <option value="active" ${contract.status === 'active' ? 'selected' : ''}>Active</option>
                        <option value="executed" ${contract.status === 'executed' ? 'selected' : ''}>Executed</option>
                        <option value="cancelled" ${contract.status === 'cancelled' ? 'selected' : ''}>Cancelled</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Closing Date</label>
                    <input type="date" id="editContractClosingDate" value="${contract.closingDate ? contract.closingDate.split('T')[0] : ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            ${contractType === 'Option' ? `
            <div>
                <label class="block text-sm font-medium text-gray-700">Option Expiration Date</label>
                <input type="date" id="editContractOptionExpiration" value="${contract.optionExpiration ? contract.optionExpiration.split('T')[0] : ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            ` : ''}
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="editContractNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any additional notes about this contract...">${contract.notes || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Edit Contract', formContent, () => saveEditedContract(id));
}

function saveEditedContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (!contract) return;
    
    // Get form values
    const propertyAddress = document.getElementById('editContractPropertyAddress').value.trim();
    const sellerName = document.getElementById('editContractSellerName').value.trim();
    const buyerName = document.getElementById('editContractBuyerName').value.trim();
    const purchasePrice = parseFloat(document.getElementById('editContractPurchasePrice').value);
    const assignmentFee = parseFloat(document.getElementById('editContractAssignmentFee').value) || null;
    const type = document.getElementById('editContractType').value;
    const status = document.getElementById('editContractStatus').value;
    const closingDate = document.getElementById('editContractClosingDate').value;
    const optionExpiration = document.getElementById('editContractOptionExpiration')?.value;
    const notes = document.getElementById('editContractNotes').value.trim();
    
    // Validate required fields
    if (!propertyAddress || !sellerName || !purchasePrice) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Update contract object
    contract.propertyAddress = propertyAddress;
    contract.sellerName = sellerName;
    contract.buyerName = buyerName;
    contract.purchasePrice = purchasePrice;
    contract.assignmentFee = assignmentFee;
    contract.type = type;
    contract.status = status;
    contract.closingDate = closingDate;
    if (optionExpiration) contract.optionExpiration = optionExpiration;
    contract.notes = notes;
    
    // Save and update UI
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Contract updated successfully!');
}

// Delete contract function
function deleteContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
        const confirmDelete = confirm(`Are you sure you want to delete this contract?\n\nProperty: ${contract.propertyAddress}\nSeller: ${contract.sellerName}\nAmount: ${formatCurrency(contract.purchasePrice)}\n\nThis action cannot be undone.`);
        
        if (confirmDelete) {
            // Remove contract from array
            contracts = contracts.filter(c => c.id !== id);
            
            // Save data and update display
            saveData();
            updateContractsTable();
            updateOverviewStats();
            
            showSuccessMessage('Contract deleted successfully!');
        }
    } else {
        showErrorMessage('Contract not found!');
    }
}

function generateContract() {
    showContractGeneratorModal();
}

// Templates modal functions
function showTemplatesModal() {
    document.getElementById('templatesModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideTemplatesModal() {
    document.getElementById('templatesModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

// Use template function
function useTemplate(templateType) {
    hideTemplatesModal();
    
    // Pre-fill contract generator with template data
    const templateData = getTemplateData(templateType);
    
    // Show appropriate modal based on template type
    if (templateType === 'assignment-agreement') {
        showAssignmentContractModal(templateData);
    } else if (templateType === 'option-contract') {
        showOptionContractModal(templateData);
    } else if (templateType === 'wholesale-contract') {
        showWholesaleContractModal(templateData);
    } else {
        // Default to purchase agreement modal
        showContractGeneratorModal();
        
        // Fill in the form fields with template data
        setTimeout(() => {
            if (templateData.sellerName) document.getElementById('sellerName').value = templateData.sellerName;
            if (templateData.buyerName) document.getElementById('buyerName').value = templateData.buyerName;
            if (templateData.propertyAddress) document.getElementById('propertyAddress').value = templateData.propertyAddress;
            if (templateData.purchasePrice) document.getElementById('purchasePrice').value = templateData.purchasePrice;
            if (templateData.contractType) document.getElementById('contractType').value = templateData.contractType;
            if (templateData.terms) document.getElementById('terms').value = templateData.terms;
            if (templateData.closingDate) document.getElementById('closingDate').value = templateData.closingDate;
        }, 100);
    }
    
    showSuccessMessage(`${getTemplateDisplayName(templateType)} template loaded successfully!`);
}

// Get template data based on type
function getTemplateData(templateType) {
    const templates = {
        'purchase-agreement': {
            contractType: 'Purchase Agreement',
            terms: 'TERMS AND CONDITIONS:\n\n1. PURCHASE PRICE: The total purchase price shall be paid as follows:\n   - Earnest money deposit upon execution\n   - Balance at closing through certified funds\n\n2. CLOSING: Closing shall occur within 30 days of contract execution\n\n3. TITLE: Seller shall provide clear and marketable title\n\n4. CONDITION: Property sold in AS-IS condition\n\n5. INSPECTIONS: Buyer shall have 10 days for inspections\n\n6. FINANCING: This contract is contingent upon buyer obtaining financing within 21 days',
            sellerName: '[SELLER NAME]',
            buyerName: '[BUYER NAME]',
            propertyAddress: '[PROPERTY ADDRESS]',
            purchasePrice: '',
            closingDate: ''
        },
        'assignment-agreement': {
            contractType: 'Assignment Agreement',
            terms: 'ASSIGNMENT TERMS:\n\n1. ASSIGNMENT FEE: Assignor shall receive an assignment fee of $[AMOUNT] at closing\n\n2. ORIGINAL CONTRACT: This assignment is subject to all terms of the original purchase contract dated [DATE]\n\n3. ASSIGNEE OBLIGATIONS: Assignee assumes all rights and obligations of the original contract\n\n4. CLOSING: Assignee shall close on the original closing date or as mutually agreed\n\n5. DEFAULT: If assignee defaults, original contract remains in effect with assignor\n\n6. NOTICE: All parties to original contract have been notified of this assignment',
            sellerName: '[ORIGINAL SELLER]',
            buyerName: '[ASSIGNEE/END BUYER]',
            propertyAddress: '[PROPERTY ADDRESS]',
            purchasePrice: '',
            closingDate: ''
        },
        'option-contract': {
            contractType: 'Option Contract',
            terms: 'OPTION TERMS:\n\n1. OPTION FEE: Buyer pays $[AMOUNT] for exclusive option to purchase\n\n2. OPTION PERIOD: Option expires [NUMBER] days from contract date\n\n3. EXERCISE: Option may be exercised by written notice to seller\n\n4. PURCHASE PRICE: Fixed at $[AMOUNT] during option period\n\n5. EXTENSION: Option may be extended for additional $[AMOUNT] fee\n\n6. NON-REFUNDABLE: Option fee is non-refundable but credited toward purchase price\n\n7. MAINTENANCE: Seller maintains property during option period',
            sellerName: '[SELLER NAME]',
            buyerName: '[OPTION HOLDER]',
            propertyAddress: '[PROPERTY ADDRESS]',
            purchasePrice: '',
            closingDate: ''
        },
        'wholesale-contract': {
            contractType: 'Wholesale Purchase Agreement',
            terms: 'WHOLESALE TERMS:\n\n1. ASSIGNMENT RIGHTS: Buyer may assign this contract with written notice\n\n2. AS-IS CONDITION: Property purchased in current condition without warranties\n\n3. QUICK CLOSING: Closing within 14-21 days or as agreed\n\n4. CASH PURCHASE: No financing contingencies\n\n5. INSPECTION PERIOD: 7 days for due diligence and inspections\n\n6. EARNEST MONEY: Minimal deposit, balance at closing\n\n7. MARKETING: Buyer may market property during contract period',
            sellerName: '[MOTIVATED SELLER]',
            buyerName: '[WHOLESALER/COMPANY]',
            propertyAddress: '[DISTRESSED PROPERTY ADDRESS]',
            purchasePrice: '',
            closingDate: ''
        }
    };
    
    return templates[templateType] || {};
}

// Get template display name
function getTemplateDisplayName(templateType) {
    const names = {
        'purchase-agreement': 'Purchase Agreement',
        'assignment-agreement': 'Assignment Agreement',
        'option-contract': 'Option Contract',
        'wholesale-contract': 'Wholesale Contract'
    };
    
    return names[templateType] || 'Template';
}

// Specialized contract modal functions
function showAssignmentContractModal(templateData) {
    // Create assignment contract form
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Original Contract Property Address *</label>
                <input type="text" id="assignmentPropertyAddress" value="${templateData.propertyAddress || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="123 Main St, City, State ZIP" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Original Seller Name *</label>
                    <input type="text" id="assignmentSellerName" value="${templateData.sellerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Assignee (End Buyer) *</label>
                    <select id="assignmentBuyerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                        <option value="">Select End Buyer</option>
                        ${buyers.map(buyer => `<option value="${buyer.name}">${buyer.name} - ${buyer.company}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Original Contract Price *</label>
                    <input type="number" id="assignmentOriginalPrice" value="${templateData.purchasePrice || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Assignment Fee *</label>
                    <input type="number" id="assignmentFee" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Original Contract Date</label>
                <input type="date" id="assignmentOriginalDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Assignment Date *</label>
                <input type="date" id="assignmentDate" value="${new Date().toISOString().split('T')[0]}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Special Terms</label>
                <textarea id="assignmentSpecialTerms" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any special conditions or terms for the assignment">${templateData.terms || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Assignment Agreement', formContent, () => generateAssignmentContract());
}

function showOptionContractModal(templateData) {
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Property Address *</label>
                <input type="text" id="optionPropertyAddress" value="${templateData.propertyAddress || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="123 Main St, City, State ZIP" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Seller Name *</label>
                    <input type="text" id="optionSellerName" value="${templateData.sellerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Option Holder *</label>
                    <input type="text" id="optionBuyerName" value="${templateData.buyerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>
            <div class="grid grid-cols-3 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Option Fee *</label>
                    <input type="number" id="optionFee" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input type="number" id="optionPurchasePrice" value="${templateData.purchasePrice || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Option Period (Days) *</label>
                    <input type="number" id="optionPeriodDays" value="30" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="1" required>
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Option Expiration Date *</label>
                <input type="date" id="optionExpirationDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Special Terms</label>
                <textarea id="optionSpecialTerms" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any special conditions or terms">${templateData.terms || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Option Contract', formContent, () => generateOptionContract());
}

function showWholesaleContractModal(templateData) {
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Property Address *</label>
                <input type="text" id="wholesalePropertyAddress" value="${templateData.propertyAddress || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="123 Main St, City, State ZIP" required>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Motivated Seller Name *</label>
                    <input type="text" id="wholesaleSellerName" value="${templateData.sellerName || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Wholesaler/Company *</label>
                    <input type="text" id="wholesaleBuyerName" value="Enriched Properties LLC" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                    <input type="number" id="wholesalePurchasePrice" value="${templateData.purchasePrice || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Earnest Money Deposit</label>
                    <input type="number" id="wholesaleEMD" value="1000" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Inspection Period (Days)</label>
                    <input type="number" id="wholesaleInspectionDays" value="7" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Closing Date *</label>
                    <input type="date" id="wholesaleClosingDate" value="${templateData.closingDate || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <label class="flex items-center">
                    <input type="checkbox" id="wholesaleAssignable" checked class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <span class="ml-2 text-sm text-gray-700">Assignable Contract</span>
                </label>
                <label class="flex items-center">
                    <input type="checkbox" id="wholesaleAsIs" checked class="rounded border-gray-300 text-indigo-600 shadow-sm focus:border-indigo-300 focus:ring focus:ring-indigo-200 focus:ring-opacity-50">
                    <span class="ml-2 text-sm text-gray-700">As-Is Condition</span>
                </label>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Special Conditions</label>
                <textarea id="wholesaleSpecialConditions" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any special conditions or terms">${templateData.terms || ''}</textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Wholesale Purchase Agreement', formContent, () => generateWholesaleContract());
}

function showCustomModal(title, content, onSubmit) {
    // Check if modal exists
    let modal = document.getElementById('contractGeneratorModal');
    if (!modal) {
        console.error('Modal not found');
        return;
    }
    
    const modalTitle = modal.querySelector('h3');
    const formContainer = modal.querySelector('form');
    
    if (!modalTitle || !formContainer) {
        console.error('Modal elements not found');
        return;
    }
    
    // Update modal title
    modalTitle.textContent = title;
    
    // Always replace the entire form content
    formContainer.innerHTML = content + `
        <div class="flex justify-end space-x-4 mt-6">
            <button type="button" onclick="hideContractGeneratorModal()" class="px-4 py-2 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300">Cancel</button>
            <button type="submit" class="px-4 py-2 bg-accent text-white rounded-lg hover:bg-blue-600">Save Changes</button>
        </div>
    `;
    
    // Update form submit handler
    formContainer.onsubmit = function(e) {
        e.preventDefault();
        onSubmit();
    };
    
    // Show modal
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
}

// Contract generation functions for specialized templates
function generateAssignmentContract() {
    const contractData = {
        propertyAddress: document.getElementById('assignmentPropertyAddress').value,
        sellerName: document.getElementById('assignmentSellerName').value,
        buyerName: document.getElementById('assignmentBuyerName').value,
        originalPrice: parseFloat(document.getElementById('assignmentOriginalPrice').value),
        assignmentFee: parseFloat(document.getElementById('assignmentFee').value),
        originalDate: document.getElementById('assignmentOriginalDate').value,
        assignmentDate: document.getElementById('assignmentDate').value,
        specialTerms: document.getElementById('assignmentSpecialTerms').value
    };
    
    // Validate required fields
    if (!contractData.propertyAddress || !contractData.sellerName || !contractData.buyerName || 
        !contractData.originalPrice || !contractData.assignmentFee || !contractData.assignmentDate) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Create contract object
    const contract = {
        id: Date.now(),
        type: 'Assignment',
        propertyAddress: contractData.propertyAddress,
        sellerName: contractData.sellerName,
        buyerName: contractData.buyerName,
        purchasePrice: contractData.originalPrice,
        assignmentFee: contractData.assignmentFee,
        status: 'draft',
        closingDate: contractData.assignmentDate,
        dateCreated: new Date().toISOString(),
        contractData: contractData
    };
    
    // Add to contracts array
    contracts.push(contract);
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Assignment contract generated successfully!');
}

function generateOptionContract() {
    const contractData = {
        propertyAddress: document.getElementById('optionPropertyAddress').value,
        sellerName: document.getElementById('optionSellerName').value,
        buyerName: document.getElementById('optionBuyerName').value,
        optionFee: parseFloat(document.getElementById('optionFee').value),
        purchasePrice: parseFloat(document.getElementById('optionPurchasePrice').value),
        optionPeriodDays: parseInt(document.getElementById('optionPeriodDays').value),
        expirationDate: document.getElementById('optionExpirationDate').value,
        specialTerms: document.getElementById('optionSpecialTerms').value
    };
    
    // Validate required fields
    if (!contractData.propertyAddress || !contractData.sellerName || !contractData.buyerName || 
        !contractData.optionFee || !contractData.purchasePrice || !contractData.expirationDate) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Create contract object
    const contract = {
        id: Date.now(),
        type: 'Option',
        propertyAddress: contractData.propertyAddress,
        sellerName: contractData.sellerName,
        buyerName: contractData.buyerName,
        purchasePrice: contractData.purchasePrice,
        optionFee: contractData.optionFee,
        status: 'draft',
        closingDate: contractData.expirationDate,
        optionExpiration: contractData.expirationDate,
        dateCreated: new Date().toISOString(),
        contractData: contractData
    };
    
    // Add to contracts array
    contracts.push(contract);
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Option contract generated successfully!');
}

function generateWholesaleContract() {
    const contractData = {
        propertyAddress: document.getElementById('wholesalePropertyAddress').value,
        sellerName: document.getElementById('wholesaleSellerName').value,
        buyerName: document.getElementById('wholesaleBuyerName').value,
        purchasePrice: parseFloat(document.getElementById('wholesalePurchasePrice').value),
        emdAmount: parseFloat(document.getElementById('wholesaleEMD').value) || 1000,
        inspectionDays: parseInt(document.getElementById('wholesaleInspectionDays').value) || 7,
        closingDate: document.getElementById('wholesaleClosingDate').value,
        assignable: document.getElementById('wholesaleAssignable').checked,
        asIs: document.getElementById('wholesaleAsIs').checked,
        specialConditions: document.getElementById('wholesaleSpecialConditions').value
    };
    
    // Validate required fields
    if (!contractData.propertyAddress || !contractData.sellerName || !contractData.buyerName || 
        !contractData.purchasePrice || !contractData.closingDate) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Create contract object
    const contract = {
        id: Date.now(),
        type: 'Wholesale',
        propertyAddress: contractData.propertyAddress,
        sellerName: contractData.sellerName,
        buyerName: contractData.buyerName,
        purchasePrice: contractData.purchasePrice,
        status: 'draft',
        closingDate: contractData.closingDate,
        dateCreated: new Date().toISOString(),
        contractData: contractData
    };
    
    // Add to contracts array
    contracts.push(contract);
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Wholesale contract generated successfully!');
}

// Buyer CRUD operations
function editBuyer(id) {
    const buyer = buyers.find(b => b.id === id);
    if (!buyer) return;
    
    const formContent = `
        <div class="space-y-4">
            <!-- Basic Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Basic Information</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Business Name *</label>
                        <input type="text" id="editBuyerCompany" value="${buyer.company || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Contact Person *</label>
                        <input type="text" id="editBuyerName" value="${buyer.name || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
            </div>

            <!-- Contact Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Contact Information</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Primary Phone *</label>
                        <input type="tel" id="editBuyerPhone" value="${buyer.phone || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Secondary Phone</label>
                        <input type="tel" id="editBuyerSecondaryPhone" value="${buyer.secondaryPhone || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Business Email *</label>
                        <input type="email" id="editBuyerEmail" value="${buyer.email || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Personal Email</label>
                        <input type="email" id="editBuyerPersonalEmail" value="${buyer.personalEmail || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
            </div>

            <!-- Address Information -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Address Information</h4>
                <div class="grid grid-cols-1 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Street Address</label>
                        <input type="text" id="editBuyerStreet" value="${buyer.address?.street || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">City</label>
                        <input type="text" id="editBuyerCity" value="${buyer.city || buyer.address?.city || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Houston">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State</label>
                        <input type="text" id="editBuyerState" value="${buyer.state || buyer.address?.state || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., TX" maxlength="2">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">ZIP Code</label>
                        <input type="text" id="editBuyerZip" value="${buyer.address?.zip || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="77001">
                    </div>
                </div>
            </div>

            <!-- Investment Details -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Investment Details</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Investment Focus</label>
                        <select id="editBuyerType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="fix-flip" ${buyer.type === 'fix-flip' ? 'selected' : ''}>Fix & Flip</option>
                            <option value="buy-hold" ${buyer.type === 'buy-hold' ? 'selected' : ''}>Buy & Hold</option>
                            <option value="wholesale" ${buyer.type === 'wholesale' ? 'selected' : ''}>Wholesale</option>
                            <option value="private-investor" ${buyer.type === 'private-investor' ? 'selected' : ''}>Private Investor</option>
                            <option value="hedge-fund" ${buyer.type === 'hedge-fund' ? 'selected' : ''}>Hedge Fund</option>
                            <option value="cash-buyer" ${buyer.type === 'cash-buyer' ? 'selected' : ''}>Cash Buyer</option>
                            <option value="other" ${buyer.type === 'other' ? 'selected' : ''}>Other</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Cash Buyer Status</label>
                        <select id="editBuyerCashStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="Confirmed" ${buyer.cashBuyerStatus === 'Confirmed' ? 'selected' : ''}>Confirmed</option>
                            <option value="Unconfirmed" ${buyer.cashBuyerStatus === 'Unconfirmed' ? 'selected' : ''}>Unconfirmed</option>
                            <option value="Network" ${buyer.cashBuyerStatus === 'Network' ? 'selected' : ''}>Network</option>
                            <option value="N/A" ${buyer.cashBuyerStatus === 'N/A' ? 'selected' : ''}>N/A</option>
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Min Budget</label>
                        <input type="number" id="editBuyerMinBudget" value="${buyer.minBudget || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Max Budget</label>
                        <input type="number" id="editBuyerMaxBudget" value="${buyer.maxBudget || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0">
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Assignment Experience</label>
                        <select id="editBuyerAssignmentExp" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="Yes" ${buyer.assignmentExperience === 'Yes' ? 'selected' : ''}>Yes</option>
                            <option value="Unknown" ${buyer.assignmentExperience === 'Unknown' ? 'selected' : ''}>Unknown</option>
                            <option value="No" ${buyer.assignmentExperience === 'No' ? 'selected' : ''}>No</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Closing Timeline (Days)</label>
                        <input type="number" id="editBuyerClosingDays" value="${buyer.closingTimelineDays || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="1" max="90">
                    </div>
                </div>
            </div>

            <!-- Property Criteria -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Property Criteria</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Preferred Areas</label>
                        <input type="text" id="editBuyerPreferredAreas" value="${buyer.preferredAreas || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Houston Metro, Harris County">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Property Types</label>
                        <input type="text" id="editBuyerPropertyTypes" value="${buyer.propertyTypes || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., SFR, Multi-family">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Condition Preferences</label>
                    <input type="text" id="editBuyerConditionPref" value="${buyer.conditionPreferences || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Distressed, Light rehab, Move-in ready">
                </div>
            </div>

            <!-- Status & Tracking -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Status & Tracking</h4>
                <div class="grid grid-cols-3 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Activity Level</label>
                        <select id="editBuyerStatus" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                            <option value="active" ${buyer.status === 'active' ? 'selected' : ''}>Active</option>
                            <option value="warm" ${buyer.status === 'warm' ? 'selected' : ''}>Warm</option>
                            <option value="cold" ${buyer.status === 'cold' ? 'selected' : ''}>Cold</option>
                            <option value="inactive" ${buyer.status === 'inactive' ? 'selected' : ''}>Inactive</option>
                        </select>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Performance Score (0-100)</label>
                        <input type="number" id="editBuyerPerformanceScore" value="${buyer.performanceScore || 0}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" max="100">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Deals Closed</label>
                        <input type="number" id="editBuyerDealsCompleted" value="${buyer.dealsCompleted || 0}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" min="0" readonly>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Date Verified</label>
                        <input type="date" id="editBuyerDateVerified" value="${buyer.dateVerified || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Last Contact</label>
                        <input type="date" id="editBuyerLastContact" value="${buyer.lastContact ? new Date(buyer.lastContact).toISOString().split('T')[0] : ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                </div>
            </div>

            <!-- Sources & Notes -->
            <div class="bg-gray-50 p-4 rounded-lg">
                <h4 class="font-medium text-gray-900 mb-3">Sources & Notes</h4>
                <div class="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Source 1</label>
                        <input type="text" id="editBuyerSource1" value="${buyer.source1 || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Company website">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Source 2</label>
                        <input type="text" id="editBuyerSource2" value="${buyer.source2 || ''}" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="e.g., Google listing">
                    </div>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Notes</label>
                    <textarea id="editBuyerNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any additional notes about this buyer...">${buyer.notes || ''}</textarea>
                </div>
            </div>
        </div>
    `;
    
    showCustomModal('Edit Buyer', formContent, () => saveEditedBuyer(id));
}

function saveEditedBuyer(id) {
    const buyer = buyers.find(b => b.id === id);
    if (!buyer) return;
    
    // Get form values
    const name = document.getElementById('editBuyerName').value.trim();
    const company = document.getElementById('editBuyerCompany').value.trim();
    const email = document.getElementById('editBuyerEmail').value.trim();
    const phone = document.getElementById('editBuyerPhone').value.trim();
    const secondaryPhone = document.getElementById('editBuyerSecondaryPhone').value.trim();
    const personalEmail = document.getElementById('editBuyerPersonalEmail').value.trim();
    const street = document.getElementById('editBuyerStreet').value.trim();
    const city = document.getElementById('editBuyerCity').value.trim();
    const state = document.getElementById('editBuyerState').value.trim();
    const zip = document.getElementById('editBuyerZip').value.trim();
    const type = document.getElementById('editBuyerType').value;
    const cashBuyerStatus = document.getElementById('editBuyerCashStatus').value;
    const assignmentExperience = document.getElementById('editBuyerAssignmentExp').value;
    const closingTimelineDays = parseInt(document.getElementById('editBuyerClosingDays').value) || null;
    const status = document.getElementById('editBuyerStatus').value;
    const minBudget = parseFloat(document.getElementById('editBuyerMinBudget').value) || null;
    const maxBudget = parseFloat(document.getElementById('editBuyerMaxBudget').value) || null;
    const preferredAreas = document.getElementById('editBuyerPreferredAreas').value.trim();
    const propertyTypes = document.getElementById('editBuyerPropertyTypes').value.trim();
    const conditionPreferences = document.getElementById('editBuyerConditionPref').value.trim();
    const performanceScore = parseInt(document.getElementById('editBuyerPerformanceScore').value) || 0;
    const dealsCompleted = parseInt(document.getElementById('editBuyerDealsCompleted').value) || 0;
    const dateVerified = document.getElementById('editBuyerDateVerified').value;
    const lastContact = document.getElementById('editBuyerLastContact').value;
    const source1 = document.getElementById('editBuyerSource1').value.trim();
    const source2 = document.getElementById('editBuyerSource2').value.trim();
    const notes = document.getElementById('editBuyerNotes').value.trim();
    
    // Validate required fields
    if (!name || !email || !phone) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Update buyer object
    buyer.name = name;
    buyer.company = company;
    buyer.email = email;
    buyer.phone = phone;
    buyer.secondaryPhone = secondaryPhone;
    buyer.personalEmail = personalEmail;
    buyer.city = city;
    buyer.state = state;
    buyer.type = type;
    buyer.status = status;
    buyer.minBudget = minBudget;
    buyer.maxBudget = maxBudget;
    buyer.preferredAreas = preferredAreas;
    buyer.propertyTypes = propertyTypes;
    buyer.conditionPreferences = conditionPreferences;
    buyer.performanceScore = performanceScore;
    buyer.dealsCompleted = dealsCompleted;
    buyer.notes = notes;
    
    // CSV-specific fields
    buyer.cashBuyerStatus = cashBuyerStatus;
    buyer.assignmentExperience = assignmentExperience;
    buyer.closingTimelineDays = closingTimelineDays;
    buyer.dateVerified = dateVerified;
    buyer.lastContact = lastContact ? new Date(lastContact).toISOString() : buyer.lastContact;
    buyer.source1 = source1;
    buyer.source2 = source2;
    
    // Update address object
    if (!buyer.address) buyer.address = {};
    buyer.address.street = street;
    buyer.address.city = city;
    buyer.address.state = state;
    buyer.address.zip = zip;
    buyer.lastContact = new Date().toISOString();
    
    // Save and update UI
    saveData();
    updateBuyersTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Buyer updated successfully!');
}

// Enhanced Buyer Management Features (3.1-3.4)

// 3.1 Buyer Criteria Matching - Auto-match properties to buyer preferences
function findMatchingBuyers(property) {
    const matches = [];
    
    buyers.forEach(buyer => {
        if (buyer.status !== 'active') return; // Only check active buyers
        
        let score = 0;
        let maxScore = 0;
        
        // Check price range
        maxScore += 40;
        if (buyer.minBudget && buyer.maxBudget) {
            if (property.purchasePrice >= buyer.minBudget && property.purchasePrice <= buyer.maxBudget) {
                score += 40;
            }
        } else if (buyer.maxBudget && property.purchasePrice <= buyer.maxBudget) {
            score += 40;
        } else if (buyer.minBudget && property.purchasePrice >= buyer.minBudget) {
            score += 40;
        }
        
        // Check property type match
        maxScore += 20;
        if (buyer.propertyTypes) {
            const buyerTypes = buyer.propertyTypes.toLowerCase().split(',').map(t => t.trim());
            const propertyType = (property.type || 'sfr').toLowerCase();
            if (buyerTypes.some(type => type.includes(propertyType) || propertyType.includes(type))) {
                score += 20;
            }
        } else {
            score += 10; // Partial score if no preference specified
        }
        
        // Check area preference
        maxScore += 25;
        if (buyer.preferredAreas && property.address) {
            const buyerAreas = buyer.preferredAreas.toLowerCase().split(',').map(a => a.trim());
            const propertyAddress = property.address.toLowerCase();
            if (buyerAreas.some(area => propertyAddress.includes(area))) {
                score += 25;
            }
        } else {
            score += 5; // Small score if no area preference
        }
        
        // Buyer performance bonus
        maxScore += 15;
        if (buyer.performanceScore) {
            score += Math.round((buyer.performanceScore / 100) * 15);
        }
        
        const matchPercentage = Math.round((score / maxScore) * 100);
        
        if (matchPercentage >= 30) { // Only include decent matches
            matches.push({
                buyer: buyer,
                score: matchPercentage,
                reasons: []
            });
        }
    });
    
    return matches.sort((a, b) => b.score - a.score);
}

function showPropertyMatches(property) {
    const matches = findMatchingBuyers(property);
    
    if (matches.length === 0) {
        showErrorMessage('No matching buyers found for this property.');
        return;
    }
    
    const matchContent = `
        <div class="space-y-4">
            <div class="text-center mb-4">
                <h4 class="font-semibold">Property: ${property.address}</h4>
                <p class="text-sm text-gray-600">Price: ${formatCurrency(property.purchasePrice)}</p>
            </div>
            ${matches.map(match => `
                <div class="border border-gray-200 rounded-lg p-4">
                    <div class="flex justify-between items-start mb-2">
                        <div>
                            <h5 class="font-medium">${match.buyer.name}</h5>
                            <p class="text-sm text-gray-600">${match.buyer.company || match.buyer.email}</p>
                        </div>
                        <div class="text-right">
                            <div class="text-sm font-semibold text-green-600">${match.score}% Match</div>
                            <div class="text-xs text-gray-500">Performance: ${match.buyer.performanceScore || 0}/100</div>
                        </div>
                    </div>
                    <div class="text-xs text-gray-600 mb-2">
                        <span>Budget: ${match.buyer.minBudget ? formatCurrency(match.buyer.minBudget) : '$0'} - ${match.buyer.maxBudget ? formatCurrency(match.buyer.maxBudget) : '∞'}</span>
                        ${match.buyer.preferredAreas ? `<br>Areas: ${match.buyer.preferredAreas}` : ''}
                        ${match.buyer.propertyTypes ? `<br>Types: ${match.buyer.propertyTypes}` : ''}
                    </div>
                    <div class="flex space-x-2">
                        <button onclick="contactBuyer(${match.buyer.id}, '${property.address}')" class="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600">Contact</button>
                        <button onclick="sendPropertyDetails(${match.buyer.id}, ${property.id})" class="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600">Send Details</button>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
    
    showCustomModal('Matching Buyers', matchContent, () => hideContractGeneratorModal());
}

// 3.2 Buyer Performance Metrics - Track which buyers close deals
function updateBuyerPerformance() {
    buyers.forEach(buyer => {
        // Count completed deals
        const dealsCompleted = contracts.filter(contract => 
            contract.buyerName === buyer.name && 
            contract.status === 'executed'
        ).length;
        
        buyer.dealsCompleted = dealsCompleted;
        
        // Calculate performance score based on multiple factors
        let score = 0;
        
        // Deals completed (40 points max)
        score += Math.min(dealsCompleted * 10, 40);
        
        // Response time (20 points - placeholder, would need communication tracking)
        score += buyer.status === 'active' ? 20 : 0;
        
        // Budget reliability (20 points - placeholder)
        score += buyer.maxBudget && buyer.minBudget ? 20 : 10;
        
        // Recent activity (20 points)
        if (buyer.lastContact) {
            const daysSince = Math.floor((Date.now() - new Date(buyer.lastContact).getTime()) / (1000 * 60 * 60 * 24));
            if (daysSince <= 30) score += 20;
            else if (daysSince <= 90) score += 10;
        }
        
        buyer.performanceScore = Math.min(score, 100);
    });
}

function getBuyerPerformanceReport() {
    updateBuyerPerformance();
    
    const topPerformers = buyers
        .filter(buyer => buyer.performanceScore > 0)
        .sort((a, b) => b.performanceScore - a.performanceScore)
        .slice(0, 10);
    
    const reportContent = `
        <div class="space-y-4">
            <h4 class="font-semibold text-center mb-4">Top Buyer Performance</h4>
            ${topPerformers.length === 0 ? 
                '<p class="text-center text-gray-500">No buyer performance data yet.</p>' :
                topPerformers.map((buyer, index) => `
                    <div class="flex items-center justify-between p-3 ${index < 3 ? 'bg-yellow-50' : 'bg-gray-50'} rounded-lg">
                        <div class="flex items-center">
                            <div class="text-lg mr-3">${index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}</div>
                            <div>
                                <div class="font-medium">${buyer.name}</div>
                                <div class="text-xs text-gray-600">${buyer.company || buyer.email}</div>
                            </div>
                        </div>
                        <div class="text-right">
                            <div class="font-semibold text-green-600">${buyer.performanceScore}/100</div>
                            <div class="text-xs text-gray-500">${buyer.dealsCompleted || 0} deals closed</div>
                        </div>
                    </div>
                `).join('')
            }
        </div>
    `;
    
    showCustomModal('Buyer Performance Report', reportContent, () => hideContractGeneratorModal());
}

// 3.3 Buyer Communication Tools - Bulk email/SMS to targeted buyer segments
function showBuyerCommunicationModal() {
    const formContent = `
        <div class="space-y-4">
            <div>
                <label class="block text-sm font-medium text-gray-700">Target Audience</label>
                <select id="communicationTarget" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="all">All Active Buyers</option>
                    <option value="hedge-fund">Hedge Funds Only</option>
                    <option value="private-investor">Private Investors Only</option>
                    <option value="top-performers">Top Performers (Score 80+)</option>
                    <option value="recent-inactive">Recently Inactive (30+ days)</option>
                    <option value="high-budget">High Budget ($500K+)</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Communication Type</label>
                <select id="communicationType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="email">Email</option>
                    <option value="sms">SMS (Text Message)</option>
                    <option value="both">Both Email & SMS</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Subject/Title</label>
                <input type="text" id="communicationSubject" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="New Property Alert - Great Investment Opportunity">
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Message Template</label>
                <select id="messageTemplate" onchange="loadMessageTemplate()" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="">Choose a template...</option>
                    <option value="new-property">New Property Alert</option>
                    <option value="price-drop">Price Reduction Notice</option>
                    <option value="market-update">Market Update</option>
                    <option value="follow-up">Follow-up Check-in</option>
                    <option value="custom">Custom Message</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Message Content</label>
                <textarea id="communicationMessage" rows="6" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Enter your message here..."></textarea>
            </div>
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div class="text-sm">
                    <strong>Available Variables:</strong><br>
                    {buyerName}, {company}, {propertyAddress}, {price}, {dealCount}
                </div>
            </div>
        </div>
    `;
    
    showCustomModal('Bulk Buyer Communication', formContent, () => sendBulkCommunication());
}

function loadMessageTemplate() {
    const template = document.getElementById('messageTemplate').value;
    const messageField = document.getElementById('communicationMessage');
    const subjectField = document.getElementById('communicationSubject');
    
    const templates = {
        'new-property': {
            subject: 'New Property Alert - {propertyAddress}',
            message: 'Hi {buyerName},\n\nI wanted to reach out about a new property that matches your investment criteria:\n\nAddress: {propertyAddress}\nPrice: {price}\n\nThis property offers excellent potential for your portfolio. Would you like me to send over the full details and analysis?\n\nBest regards,\nEnriched Properties LLC'
        },
        'price-drop': {
            subject: 'Price Reduction Alert - {propertyAddress}',
            message: 'Hi {buyerName},\n\nGreat news! The price has been reduced on a property you might be interested in:\n\nAddress: {propertyAddress}\nNew Price: {price}\n\nThis creates an even better investment opportunity. Let me know if you\'d like to discuss!\n\nBest regards,\nEnriched Properties LLC'
        },
        'market-update': {
            subject: 'Market Update & New Opportunities',
            message: 'Hi {buyerName},\n\nHope you\'re doing well! I wanted to give you a quick market update and let you know about some new opportunities coming up.\n\nWe\'ve been seeing great deals in your preferred areas and price range. With {dealCount} successful transactions this year, we\'re seeing strong momentum.\n\nWould you be interested in a quick call to discuss current opportunities?\n\nBest regards,\nEnriched Properties LLC'
        },
        'follow-up': {
            subject: 'Following Up - Investment Opportunities',
            message: 'Hi {buyerName},\n\nIt\'s been a while since we last connected, and I wanted to follow up on your investment goals.\n\nWe\'ve had several properties that might interest you, and I\'d love to make sure you\'re getting first look at deals that match your criteria.\n\nAre you still actively looking for properties in the {preferredAreas} area?\n\nBest regards,\nEnriched Properties LLC'
        }
    };
    
    if (templates[template]) {
        subjectField.value = templates[template].subject;
        messageField.value = templates[template].message;
    }
}

function sendBulkCommunication() {
    const target = document.getElementById('communicationTarget').value;
    const type = document.getElementById('communicationType').value;
    const subject = document.getElementById('communicationSubject').value;
    const message = document.getElementById('communicationMessage').value;
    
    if (!subject || !message) {
        showErrorMessage('Please enter both subject and message');
        return;
    }
    
    // Filter buyers based on target audience
    let targetBuyers = [];
    
    switch(target) {
        case 'all':
            targetBuyers = buyers.filter(buyer => buyer.status === 'active');
            break;
        case 'hedge-fund':
            targetBuyers = buyers.filter(buyer => buyer.type === 'hedge-fund' && buyer.status === 'active');
            break;
        case 'private-investor':
            targetBuyers = buyers.filter(buyer => buyer.type === 'private-investor' && buyer.status === 'active');
            break;
        case 'top-performers':
            targetBuyers = buyers.filter(buyer => buyer.performanceScore >= 80 && buyer.status === 'active');
            break;
        case 'recent-inactive':
            targetBuyers = buyers.filter(buyer => {
                if (!buyer.lastContact) return true;
                const daysSince = Math.floor((Date.now() - new Date(buyer.lastContact).getTime()) / (1000 * 60 * 60 * 24));
                return daysSince >= 30;
            });
            break;
        case 'high-budget':
            targetBuyers = buyers.filter(buyer => buyer.maxBudget && buyer.maxBudget >= 500000);
            break;
    }
    
    if (targetBuyers.length === 0) {
        showErrorMessage('No buyers match the selected criteria');
        return;
    }
    
    // Simulate sending messages (in real implementation, would integrate with email/SMS services)
    targetBuyers.forEach(buyer => {
        const personalizedSubject = subject
            .replace('{buyerName}', buyer.name)
            .replace('{company}', buyer.company || '')
            .replace('{dealCount}', buyer.dealsCompleted || 0);
            
        const personalizedMessage = message
            .replace('{buyerName}', buyer.name)
            .replace('{company}', buyer.company || '')
            .replace('{dealCount}', buyer.dealsCompleted || 0)
            .replace('{preferredAreas}', buyer.preferredAreas || 'your preferred areas');
    });
    
    hideContractGeneratorModal();
    showSuccessMessage(`Communication sent to ${targetBuyers.length} buyers via ${type}`);
}

// 3.4 Buyer Network Expansion - Referral tracking and networking tools
function addBuyerReferral(buyerId) {
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) return;
    
    const formContent = `
        <div class="space-y-4">
            <div class="text-center mb-4">
                <h4 class="font-semibold">Add Referral for ${buyer.name}</h4>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Referral Name *</label>
                    <input type="text" id="referralName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Company</label>
                    <input type="text" id="referralCompany" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Email *</label>
                    <input type="email" id="referralEmail" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Phone</label>
                    <input type="tel" id="referralPhone" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                </div>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Relationship</label>
                <select id="referralRelationship" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    <option value="colleague">Colleague</option>
                    <option value="partner">Business Partner</option>
                    <option value="client">Previous Client</option>
                    <option value="friend">Friend</option>
                    <option value="other">Other</option>
                </select>
            </div>
            <div>
                <label class="block text-sm font-medium text-gray-700">Notes</label>
                <textarea id="referralNotes" rows="3" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="Any additional information about this referral..."></textarea>
            </div>
        </div>
    `;
    
    showCustomModal('Add Buyer Referral', formContent, () => saveBuyerReferral(buyerId));
}

function saveBuyerReferral(referrerBuyerId) {
    const name = document.getElementById('referralName').value.trim();
    const company = document.getElementById('referralCompany').value.trim();
    const email = document.getElementById('referralEmail').value.trim();
    const phone = document.getElementById('referralPhone').value.trim();
    const relationship = document.getElementById('referralRelationship').value;
    const notes = document.getElementById('referralNotes').value.trim();
    
    if (!name || !email) {
        showErrorMessage('Name and email are required');
        return;
    }
    
    // Create new buyer from referral
    const newBuyer = {
        id: Date.now(),
        name: name,
        company: company,
        email: email,
        phone: phone,
        type: 'private-investor', // Default type
        status: 'warm', // Referrals start as warm leads
        referredBy: referrerBuyerId,
        relationship: relationship,
        notes: notes,
        dateAdded: new Date().toISOString(),
        performanceScore: 25 // Referrals start with bonus score
    };
    
    buyers.push(newBuyer);
    
    // Update referrer's referral count
    const referrer = buyers.find(b => b.id === referrerBuyerId);
    if (referrer) {
        referrer.referralsGiven = (referrer.referralsGiven || 0) + 1;
        referrer.performanceScore = Math.min((referrer.performanceScore || 0) + 5, 100); // Bonus for referrals
    }
    
    saveData();
    updateBuyersTable();
    hideContractGeneratorModal();
    
    showSuccessMessage(`Referral added successfully! ${name} has been added as a warm lead.`);
}

// Helper functions for buyer communication
function contactBuyer(buyerId, propertyAddress) {
    const buyer = buyers.find(b => b.id === buyerId);
    if (!buyer) return;
    
    // Update last contact
    buyer.lastContact = new Date().toISOString();
    saveData();
    
    // In real implementation, this would integrate with email/phone systems
    alert(`Contacting ${buyer.name} about ${propertyAddress}\n\nPhone: ${buyer.phone}\nEmail: ${buyer.email}`);
}

function sendPropertyDetails(buyerId, propertyId) {
    const buyer = buyers.find(b => b.id === buyerId);
    const property = properties.find(p => p.id === propertyId);
    
    if (!buyer || !property) return;
    
    // Update last contact
    buyer.lastContact = new Date().toISOString();
    saveData();
    
    showSuccessMessage(`Property details sent to ${buyer.name} at ${buyer.email}`);
}

function findBuyersForProperty(propertyId) {
    const property = properties.find(p => p.id === propertyId);
    if (!property) {
        showErrorMessage('Property not found');
        return;
    }
    showPropertyMatches(property);
}

// Contract Generation System - Professional Legal Templates
function generateContract() {
    const formContent = `
        <div class="space-y-4">
            <h4 class="font-semibold text-center mb-4">Create New Contract</h4>
            <div class="grid grid-cols-2 gap-4">
                <div>
                    <label class="block text-sm font-medium text-gray-700">Contract Type *</label>
                    <select id="newContractType" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" onchange="updateContractForm()">
                        <option value="">Select Contract Type</option>
                        <option value="purchase">Purchase Agreement</option>
                        <option value="assignment">Assignment Agreement</option>
                        <option value="option">Option Contract</option>
                        <option value="wholesale">Wholesale Purchase Agreement</option>
                    </select>
                </div>
                <div>
                    <label class="block text-sm font-medium text-gray-700">Property *</label>
                    <select id="newContractProperty" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                        <option value="">Select Property</option>
                        ${properties.map(prop => `<option value="${prop.id}">${prop.address} - ${formatCurrency(prop.purchasePrice)}</option>`).join('')}
                        <option value="new">+ Add New Property</option>
                    </select>
                </div>
            </div>
            <div id="contractFormFields">
                <p class="text-center text-gray-500">Select a contract type to continue</p>
            </div>
        </div>
    `;
    
    showCustomModal('Generate Contract', formContent, () => createContractFromForm());
}

function updateContractForm() {
    const contractType = document.getElementById('newContractType').value;
    const fieldsContainer = document.getElementById('contractFormFields');
    
    if (!contractType) {
        fieldsContainer.innerHTML = '<p class="text-center text-gray-500">Select a contract type to continue</p>';
        return;
    }
    
    let formFields = '';
    
    switch(contractType) {
        case 'purchase':
            formFields = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Seller Name *</label>
                        <input type="text" id="contractSellerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Buyer Name *</label>
                        <input type="text" id="contractBuyerName" value="Enriched Properties LLC" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State *</label>
                        <input type="text" id="contractState" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="State" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">County *</label>
                        <input type="text" id="contractCounty" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="County" required>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                        <input type="number" id="contractPurchasePrice" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Earnest Money</label>
                        <input type="number" id="contractEMD" value="1000" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Closing Date *</label>
                        <input type="date" id="contractClosingDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
            `;
            break;
        case 'assignment':
            formFields = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Original Seller *</label>
                        <input type="text" id="contractSellerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">End Buyer *</label>
                        <select id="contractBuyerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                            <option value="">Select End Buyer</option>
                            ${buyers.map(buyer => `<option value="${buyer.name}">${buyer.name} - ${buyer.company || buyer.email}</option>`).join('')}
                        </select>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State *</label>
                        <input type="text" id="contractState" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="State" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">County *</label>
                        <input type="text" id="contractCounty" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="County" required>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Original Contract Price *</label>
                        <input type="number" id="contractPurchasePrice" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Assignment Fee *</label>
                        <input type="number" id="contractAssignmentFee" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Assignment Date *</label>
                        <input type="date" id="contractClosingDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
            `;
            break;
        case 'option':
            formFields = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Property Owner *</label>
                        <input type="text" id="contractSellerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Option Holder *</label>
                        <input type="text" id="contractBuyerName" value="Enriched Properties LLC" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State *</label>
                        <input type="text" id="contractState" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="State" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">County *</label>
                        <input type="text" id="contractCounty" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="County" required>
                    </div>
                </div>
                <div class="grid grid-cols-4 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Option Fee *</label>
                        <input type="number" id="contractOptionFee" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                        <input type="number" id="contractPurchasePrice" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Option Period (Days) *</label>
                        <input type="number" id="contractOptionDays" value="30" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Expiration Date *</label>
                        <input type="date" id="contractClosingDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
            `;
            break;
        case 'wholesale':
            formFields = `
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Motivated Seller *</label>
                        <input type="text" id="contractSellerName" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Wholesaler *</label>
                        <input type="text" id="contractBuyerName" value="Enriched Properties LLC" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">State *</label>
                        <input type="text" id="contractState" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="State" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">County *</label>
                        <input type="text" id="contractCounty" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" placeholder="County" required>
                    </div>
                </div>
                <div class="grid grid-cols-3 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Purchase Price *</label>
                        <input type="number" id="contractPurchasePrice" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Earnest Money *</label>
                        <input type="number" id="contractEMD" value="1000" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Closing Date *</label>
                        <input type="date" id="contractClosingDate" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" required>
                    </div>
                </div>
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium text-gray-700">Inspection Period (Days)</label>
                        <input type="number" id="contractInspectionDays" value="7" class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500">
                    </div>
                    <div class="flex items-center space-x-4 pt-7">
                        <label class="flex items-center">
                            <input type="checkbox" id="contractAssignable" checked class="rounded border-gray-300 text-indigo-600">
                            <span class="ml-2 text-sm">Assignable</span>
                        </label>
                        <label class="flex items-center">
                            <input type="checkbox" id="contractAsIs" checked class="rounded border-gray-300 text-indigo-600">
                            <span class="ml-2 text-sm">As-Is</span>
                        </label>
                    </div>
                </div>
            `;
            break;
    }
    
    fieldsContainer.innerHTML = formFields;
}

function createContractFromForm() {
    const contractType = document.getElementById('newContractType').value;
    const propertyId = document.getElementById('newContractProperty').value;
    const sellerName = document.getElementById('contractSellerName')?.value;
    const buyerName = document.getElementById('contractBuyerName')?.value;
    const purchasePrice = parseFloat(document.getElementById('contractPurchasePrice')?.value);
    const closingDate = document.getElementById('contractClosingDate')?.value;
    const state = document.getElementById('contractState')?.value;
    const county = document.getElementById('contractCounty')?.value;
    
    if (!contractType || !sellerName || !buyerName || !purchasePrice || !closingDate || !state || !county) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    let property = null;
    if (propertyId && propertyId !== 'new') {
        property = properties.find(p => p.id === parseInt(propertyId));
    }
    
    const propertyAddress = property?.address || 'Property Address to be Updated';
    
    // Create contract object
    const contract = {
        id: Date.now(),
        type: contractType.charAt(0).toUpperCase() + contractType.slice(1),
        propertyAddress: propertyAddress,
        propertyId: propertyId !== 'new' ? parseInt(propertyId) : null,
        sellerName: sellerName,
        buyerName: buyerName,
        purchasePrice: purchasePrice,
        closingDate: closingDate,
        state: state,
        county: county,
        status: 'draft',
        dateCreated: new Date().toISOString(),
        contractData: {}
    };
    
    // Add type-specific data
    switch(contractType) {
        case 'assignment':
            contract.assignmentFee = parseFloat(document.getElementById('contractAssignmentFee')?.value) || 0;
            break;
        case 'option':
            contract.optionFee = parseFloat(document.getElementById('contractOptionFee')?.value) || 0;
            contract.optionDays = parseInt(document.getElementById('contractOptionDays')?.value) || 30;
            contract.optionExpiration = closingDate;
            break;
        case 'wholesale':
            contract.emdAmount = parseFloat(document.getElementById('contractEMD')?.value) || 1000;
            contract.inspectionDays = parseInt(document.getElementById('contractInspectionDays')?.value) || 7;
            contract.assignable = document.getElementById('contractAssignable')?.checked || false;
            contract.asIs = document.getElementById('contractAsIs')?.checked || false;
            break;
        case 'purchase':
            contract.emdAmount = parseFloat(document.getElementById('contractEMD')?.value) || 1000;
            break;
    }
    
    // Add to contracts array
    contracts.push(contract);
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage(`${contract.type} contract created successfully!`);
    
    // Ask if user wants to generate the document
    if (confirm('Would you like to generate the contract document now?')) {
        generateContractDocument(contract.id);
    }
}

function showTemplatesModal() {
    const formContent = `
        <div class="space-y-6">
            <h4 class="font-semibold text-center mb-4">Contract Templates</h4>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="useTemplate('purchase-agreement')">
                    <h5 class="font-semibold text-lg mb-2">📄 Purchase Agreement</h5>
                    <p class="text-sm text-gray-600 mb-3">Standard real estate purchase contract for direct acquisitions.</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• Purchase price and terms</li>
                        <li>• Earnest money deposit</li>
                        <li>• Inspection periods</li>
                        <li>• Closing conditions</li>
                    </ul>
                </div>
                
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="useTemplate('assignment-agreement')">
                    <h5 class="font-semibold text-lg mb-2">🔄 Assignment Agreement</h5>
                    <p class="text-sm text-gray-600 mb-3">Transfer purchase contract rights to end buyer with assignment fee.</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• Original contract reference</li>
                        <li>• Assignment fee structure</li>
                        <li>• End buyer obligations</li>
                        <li>• Assignment terms</li>
                    </ul>
                </div>
                
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="useTemplate('option-contract')">
                    <h5 class="font-semibold text-lg mb-2">⏰ Option Contract</h5>
                    <p class="text-sm text-gray-600 mb-3">Secure exclusive right to purchase within specified timeframe.</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• Option fee payment</li>
                        <li>• Exercise period</li>
                        <li>• Purchase terms</li>
                        <li>• Renewal options</li>
                    </ul>
                </div>
                
                <div class="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer" onclick="useTemplate('wholesale-contract')">
                    <h5 class="font-semibold text-lg mb-2">🏠 Wholesale Purchase Agreement</h5>
                    <p class="text-sm text-gray-600 mb-3">Wholesaler-friendly contract with assignable rights.</p>
                    <ul class="text-xs text-gray-500 space-y-1">
                        <li>• Assignable contract</li>
                        <li>• As-is condition</li>
                        <li>• Short closing period</li>
                        <li>• Minimal earnest money</li>
                    </ul>
                </div>
            </div>
        </div>
    `;
    
    showCustomModal('Contract Templates', formContent, () => hideContractGeneratorModal());
}

// Professional Legal Contract Document Generation
function generateContractDocument(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) {
        showErrorMessage('Contract not found');
        return;
    }
    
    let contractHTML = '';
    
    switch(contract.type.toLowerCase()) {
        case 'purchase':
            contractHTML = generatePurchaseAgreementHTML(contract);
            break;
        case 'assignment':
            contractHTML = generateAssignmentAgreementHTML(contract);
            break;
        case 'option':
            contractHTML = generateOptionContractHTML(contract);
            break;
        case 'wholesale':
            contractHTML = generateWholesaleContractHTML(contract);
            break;
        default:
            contractHTML = generatePurchaseAgreementHTML(contract);
    }
    
    // Show contract document in modal for review/download
    showContractDocumentModal(contract, contractHTML);
}

function generatePurchaseAgreementHTML(contract) {
    const currentDate = new Date().toLocaleDateString();
    const closingDate = new Date(contract.closingDate).toLocaleDateString();
    
    return `
        <div class="contract-document" style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 1in; background: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">REAL ESTATE PURCHASE AGREEMENT</h1>
                <p style="font-size: 12px;">State of ${contract.state || '[STATE]'} - County of ${contract.county || '[COUNTY]'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Contract Number:</strong> ${contract.id}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PARTIES</h3>
                <p><strong>SELLER:</strong> ${contract.sellerName}</p>
                <p><strong>BUYER:</strong> ${contract.buyerName} <strong>and/or assigns</strong></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PROPERTY</h3>
                <p><strong>Property Address:</strong> ${contract.propertyAddress}</p>
                <p>The real property described above, including all improvements, fixtures, and appurtenances thereto (the "Property").</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PURCHASE PRICE AND TERMS</h3>
                <p><strong>Total Purchase Price:</strong> ${formatCurrency(contract.purchasePrice)}</p>
                <p><strong>Earnest Money Deposit:</strong> ${formatCurrency(contract.emdAmount || 1000)}</p>
                <p><strong>Closing Date:</strong> ${closingDate}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">TERMS AND CONDITIONS</h3>
                <ol style="margin-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Earnest Money:</strong> Buyer shall deposit the earnest money with the escrow agent within 3 business days after execution of this Agreement.</li>
                    <li style="margin-bottom: 10px;"><strong>Title:</strong> Seller agrees to convey marketable title to the Property by general warranty deed, free and clear of all encumbrances except those specifically accepted by Buyer.</li>
                    <li style="margin-bottom: 10px;"><strong>Inspection Period:</strong> Buyer shall have 10 days from acceptance to inspect the Property and approve or disapprove its condition.</li>
                    <li style="margin-bottom: 10px;"><strong>Financing:</strong> This contract is contingent upon Buyer obtaining financing within 30 days of acceptance.</li>
                    <li style="margin-bottom: 10px;"><strong>Closing Costs:</strong> Each party shall pay their own closing costs unless otherwise specified.</li>
                    <li style="margin-bottom: 10px;"><strong>Assignment:</strong> Buyer has the right to assign this contract to another party. Upon assignment, the assignee shall assume all rights and obligations of Buyer under this Agreement.</li>
                    <li style="margin-bottom: 10px;"><strong>Default:</strong> If either party defaults, the non-defaulting party may pursue all available legal remedies.</li>
                    <li style="margin-bottom: 10px;"><strong>Entire Agreement:</strong> This Agreement constitutes the entire agreement between the parties and supersedes all prior negotiations.</li>
                </ol>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 60px;">
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>SELLER SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.sellerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>BUYER SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.buyerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                <p>Generated by Enriched Properties LLC CRM System</p>
            </div>
        </div>
    `;
}

function generateAssignmentAgreementHTML(contract) {
    const currentDate = new Date().toLocaleDateString();
    const assignmentDate = new Date(contract.closingDate).toLocaleDateString();
    
    return `
        <div class="contract-document" style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 1in; background: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">ASSIGNMENT AGREEMENT</h1>
                <p style="font-size: 12px;">State of ${contract.state || '[STATE]'} - County of ${contract.county || '[COUNTY]'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Assignment Number:</strong> ${contract.id}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PARTIES</h3>
                <p><strong>ASSIGNOR:</strong> ${contract.buyerName} (Original Buyer)</p>
                <p><strong>ASSIGNEE:</strong> ${contract.sellerName} (End Buyer)</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">ORIGINAL CONTRACT</h3>
                <p><strong>Property Address:</strong> ${contract.propertyAddress}</p>
                <p><strong>Original Contract Price:</strong> ${formatCurrency(contract.purchasePrice)}</p>
                <p><strong>Assignment Date:</strong> ${assignmentDate}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">ASSIGNMENT TERMS</h3>
                <p><strong>Assignment Fee:</strong> ${formatCurrency(contract.assignmentFee || 0)}</p>
                <p>Assignor hereby assigns all rights, title, and interest in the original purchase agreement to Assignee in consideration for the assignment fee stated above.</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">TERMS AND CONDITIONS</h3>
                <ol style="margin-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Assignment Fee:</strong> Assignee agrees to pay the assignment fee to Assignor at closing.</li>
                    <li style="margin-bottom: 10px;"><strong>Original Contract:</strong> Assignee accepts all terms and conditions of the original purchase agreement.</li>
                    <li style="margin-bottom: 10px;"><strong>Closing:</strong> Assignee is responsible for completing the closing as outlined in the original contract.</li>
                    <li style="margin-bottom: 10px;"><strong>Default:</strong> Assignee assumes all obligations and liabilities under the original contract.</li>
                    <li style="margin-bottom: 10px;"><strong>Notification:</strong> Seller has been notified of this assignment and consents to the transfer.</li>
                </ol>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 60px;">
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>ASSIGNOR SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.buyerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>ASSIGNEE SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.sellerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                <p>Generated by Enriched Properties LLC CRM System</p>
            </div>
        </div>
    `;
}

function generateOptionContractHTML(contract) {
    const currentDate = new Date().toLocaleDateString();
    const expirationDate = new Date(contract.closingDate).toLocaleDateString();
    
    return `
        <div class="contract-document" style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 1in; background: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">OPTION TO PURCHASE REAL ESTATE</h1>
                <p style="font-size: 12px;">State of ${contract.state || '[STATE]'} - County of ${contract.county || '[COUNTY]'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Option Number:</strong> ${contract.id}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PARTIES</h3>
                <p><strong>OPTIONOR (Property Owner):</strong> ${contract.sellerName}</p>
                <p><strong>OPTIONEE (Option Holder):</strong> ${contract.buyerName}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PROPERTY</h3>
                <p><strong>Property Address:</strong> ${contract.propertyAddress}</p>
                <p>The real property described above, including all improvements, fixtures, and appurtenances thereto (the "Property").</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">OPTION TERMS</h3>
                <p><strong>Option Fee:</strong> ${formatCurrency(contract.optionFee || 0)}</p>
                <p><strong>Purchase Price:</strong> ${formatCurrency(contract.purchasePrice)}</p>
                <p><strong>Option Period:</strong> ${contract.optionDays || 30} days</p>
                <p><strong>Expiration Date:</strong> ${expirationDate}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">TERMS AND CONDITIONS</h3>
                <ol style="margin-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>Option Consideration:</strong> In consideration for this option, Optionee pays Optionor the option fee, which is non-refundable.</li>
                    <li style="margin-bottom: 10px;"><strong>Exclusive Right:</strong> This option grants Optionee the exclusive right to purchase the Property during the option period.</li>
                    <li style="margin-bottom: 10px;"><strong>Exercise of Option:</strong> Optionee may exercise this option by providing written notice to Optionor before expiration.</li>
                    <li style="margin-bottom: 10px;"><strong>Purchase Terms:</strong> Upon exercise, the parties agree to execute a purchase agreement with standard real estate terms.</li>
                    <li style="margin-bottom: 10px;"><strong>Option Fee Credit:</strong> The option fee shall be credited toward the purchase price upon exercise.</li>
                    <li style="margin-bottom: 10px;"><strong>Property Condition:</strong> Optionee accepts the Property in its current "AS-IS" condition.</li>
                    <li style="margin-bottom: 10px;"><strong>Binding Agreement:</strong> This option, when exercised, creates a binding purchase agreement.</li>
                </ol>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 60px;">
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>OPTIONOR SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.sellerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>OPTIONEE SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.buyerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                <p>Generated by Enriched Properties LLC CRM System</p>
            </div>
        </div>
    `;
}

function generateWholesaleContractHTML(contract) {
    const currentDate = new Date().toLocaleDateString();
    const closingDate = new Date(contract.closingDate).toLocaleDateString();
    
    return `
        <div class="contract-document" style="font-family: 'Times New Roman', Times, serif; line-height: 1.6; max-width: 8.5in; margin: 0 auto; padding: 1in; background: white;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="font-size: 18px; font-weight: bold; margin-bottom: 10px;">WHOLESALE PURCHASE AGREEMENT</h1>
                <p style="font-size: 12px;">State of ${contract.state || '[STATE]'} - County of ${contract.county || '[COUNTY]'}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <p><strong>Date:</strong> ${currentDate}</p>
                <p><strong>Contract Number:</strong> ${contract.id}</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PARTIES</h3>
                <p><strong>SELLER:</strong> ${contract.sellerName}</p>
                <p><strong>BUYER/WHOLESALER:</strong> ${contract.buyerName} <strong>and/or assigns</strong></p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PROPERTY</h3>
                <p><strong>Property Address:</strong> ${contract.propertyAddress}</p>
                <p>The real property described above, including all improvements, fixtures, and appurtenances thereto (the "Property").</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">PURCHASE PRICE AND TERMS</h3>
                <p><strong>Total Purchase Price:</strong> ${formatCurrency(contract.purchasePrice)}</p>
                <p><strong>Earnest Money Deposit:</strong> ${formatCurrency(contract.emdAmount || 1000)}</p>
                <p><strong>Closing Date:</strong> ${closingDate}</p>
                <p><strong>Inspection Period:</strong> ${contract.inspectionDays || 7} days</p>
            </div>
            
            <div style="margin-bottom: 20px;">
                <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">WHOLESALE TERMS AND CONDITIONS</h3>
                <ol style="margin-left: 20px;">
                    <li style="margin-bottom: 10px;"><strong>AS-IS Condition:</strong> ${contract.asIs ? 'Property is sold in AS-IS condition with no repairs by Seller.' : 'Standard property condition applies.'}</li>
                    <li style="margin-bottom: 10px;"><strong>Assignment Rights:</strong> ${contract.assignable ? 'This contract may be assigned by Buyer to any third party without Seller consent.' : 'This contract is not assignable.'}</li>
                    <li style="margin-bottom: 10px;"><strong>Earnest Money:</strong> Minimal earnest money deposit reflects wholesale nature of transaction.</li>
                    <li style="margin-bottom: 10px;"><strong>Quick Closing:</strong> Short closing period allows for rapid transaction completion.</li>
                    <li style="margin-bottom: 10px;"><strong>Inspection Period:</strong> Buyer has ${contract.inspectionDays || 7} days to inspect and approve Property condition.</li>
                    <li style="margin-bottom: 10px;"><strong>Financing:</strong> This contract is contingent upon Buyer obtaining financing or assigns contract to qualified buyer.</li>
                    <li style="margin-bottom: 10px;"><strong>Title:</strong> Seller agrees to convey marketable title by general warranty deed.</li>
                    <li style="margin-bottom: 10px;"><strong>Default Remedies:</strong> Upon default, earnest money shall be retained as agreed liquidated damages.</li>
                </ol>
            </div>
            
            <div style="margin-top: 40px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 60px;">
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>SELLER SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.sellerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                    <div style="width: 45%;">
                        <div style="border-bottom: 1px solid black; margin-bottom: 5px; height: 1px;"></div>
                        <p style="font-size: 12px; text-align: center;"><strong>BUYER SIGNATURE</strong></p>
                        <p style="font-size: 12px; text-align: center;">${contract.buyerName}</p>
                        <p style="font-size: 12px; text-align: center;">Date: ________________</p>
                    </div>
                </div>
            </div>
            
            <div style="margin-top: 30px; font-size: 10px; text-align: center; border-top: 1px solid #ccc; padding-top: 10px;">
                <p>Generated by Enriched Properties LLC CRM System</p>
            </div>
        </div>
    `;
}

function showContractDocumentModal(contract, contractHTML) {
    const modalContent = `
        <div class="space-y-4">
            <div class="flex justify-between items-center mb-4">
                <h4 class="font-semibold">${contract.type} Contract - ${contract.propertyAddress}</h4>
                <div class="flex space-x-2">
                    <button onclick="printContract('${contract.id}')" class="px-3 py-2 bg-blue-500 text-white text-sm rounded hover:bg-blue-600">Print</button>
                    <button onclick="downloadContractPDF('${contract.id}')" class="px-3 py-2 bg-green-500 text-white text-sm rounded hover:bg-green-600">Download PDF</button>
                </div>
            </div>
            <div id="contractDocument" style="border: 1px solid #ddd; max-height: 500px; overflow-y: auto; background: white;">
                ${contractHTML}
            </div>
        </div>
    `;
    
    showCustomModal('Contract Document', modalContent, () => hideContractGeneratorModal());
}

// Helper function to convert numbers to words (simplified version)
function numberToWords(num) {
    if (num < 1000) return num.toString();
    if (num < 1000000) return Math.floor(num / 1000) + 'K';
    return Math.floor(num / 1000000) + 'M';
}

// Print contract function
function printContract(contractId) {
    const contractContent = document.getElementById('contractDocument').innerHTML;
    const printWindow = window.open('', '', 'height=600,width=800');
    printWindow.document.write('<html><head><title>Contract</title></head><body>');
    printWindow.document.write(contractContent);
    printWindow.document.write('</body></html>');
    printWindow.document.close();
    printWindow.print();
}

// Download PDF function (simplified - in production would use jsPDF or similar)
function downloadContractPDF(contractId) {
    const contract = contracts.find(c => c.id == contractId);
    if (!contract) return;
    
    // For now, create a downloadable HTML file
    const contractContent = document.getElementById('contractDocument').innerHTML;
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${contract.type} Contract - ${contract.propertyAddress}</title>
            <style>
                body { font-family: 'Times New Roman', Times, serif; margin: 0; padding: 20px; }
                @media print { body { margin: 0; } }
            </style>
        </head>
        <body>
            ${contractContent}
        </body>
        </html>
    `;
    
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${contract.type}_Contract_${contract.id}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Contract document downloaded! You can print to PDF from your browser.');
}

function deleteBuyer(id) {
    if (confirm('Are you sure you want to delete this buyer?')) {
        buyers = buyers.filter(b => b.id !== id);
        saveData();
        updateBuyersTable();
        updateDashboardStats();
        showSuccessMessage('Buyer deleted successfully!');
    }
}

// Utility functions
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return formatDate(dateString);
}

function formatBuyerType(type) {
    const typeMap = {
        'hedge-fund': 'Hedge Fund',
        'private-investor': 'Private Investor',
        'fix-flip': 'Fix & Flip',
        'buy-hold': 'Buy & Hold',
        'wholesaler': 'Wholesaler',
        'other': 'Other'
    };
    return typeMap[type] || type;
}

function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    const existingMessages = document.querySelectorAll('.alert-message');
    existingMessages.forEach(msg => msg.remove());
    
    const messageEl = document.createElement('div');
    messageEl.className = `alert-message fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
        type === 'success' ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'
    }`;
    messageEl.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-lg leading-none">&times;</button>
        </div>
    `;
    
    document.body.appendChild(messageEl);
    
    setTimeout(() => {
        if (messageEl && messageEl.parentElement) {
            messageEl.remove();
        }
    }, 5000);
    
    messageEl.style.transform = 'translateX(100%)';
    messageEl.style.transition = 'transform 0.3s ease-out';
    
    setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
    }, 10);
}

function checkForUpdates() {
    // Placeholder for checking for updates
}

// Clear all sample data - call this once to ensure clean start
function clearAllSampleData() {
    localStorage.removeItem('enrichedPropsLeads');
    localStorage.removeItem('enrichedPropsProperties');
    localStorage.removeItem('enrichedPropsContracts');
    localStorage.removeItem('enrichedPropsBuyers');
    
    leads = [];
    properties = [];
    contracts = [];
    buyers = [];
    
    updateDashboardStats();
    updateLeadsTable();
    updateContractsTable();
    updatePropertiesGrid();
    updateBuyersTable();
    
    showSuccessMessage('All sample data cleared! Dashboard is now completely empty.');
}

// Contract Generation Functions
let currentContractData = null;

function previewContract() {
    const contractData = getContractFormData();
    if (!contractData) return;
    
    currentContractData = contractData;
    const contractHtml = generateContractHTML(contractData);
    
    document.getElementById('contractPreviewContent').innerHTML = contractHtml;
    showContractPreviewModal();
}

function createContract(event) {
    event.preventDefault();
    
    const contractData = getContractFormData();
    if (!contractData) return;
    
    currentContractData = contractData;
    
    // Create contract record
    const contract = {
        id: Date.now(),
        propertyAddress: contractData.propertyAddress,
        sellerName: contractData.sellerName,
        purchasePrice: parseInt(contractData.purchasePrice),
        status: 'draft',
        closingDate: contractData.closingDate,
        dateCreated: new Date().toISOString(),
        contractData: contractData
    };
    
    contracts.push(contract);
    saveData();
    updateContractsTable();
    updateDashboardStats();
    hideContractGeneratorModal();
    
    showSuccessMessage('Contract generated successfully! View in Contracts tab.');
}

function finalizeContract() {
    if (currentContractData) {
        const contract = {
            id: Date.now(),
            propertyAddress: currentContractData.propertyAddress,
            sellerName: currentContractData.sellerName,
            purchasePrice: parseInt(currentContractData.purchasePrice),
            status: 'active',
            closingDate: currentContractData.closingDate,
            dateCreated: new Date().toISOString(),
            contractData: currentContractData
        };
        
        contracts.push(contract);
        saveData();
        updateContractsTable();
        updateDashboardStats();
        hideContractPreviewModal();
        hideContractGeneratorModal();
        
        showSuccessMessage('Contract saved to your contracts list!');
    }
}

function getContractFormData() {
    const form = document.querySelector('#contractGeneratorModal form');
    if (!form) return null;
    
    const formData = {
        propertyAddress: document.getElementById('contractPropertyAddress').value,
        purchasePrice: document.getElementById('contractPurchasePrice').value,
        emdAmount: document.getElementById('contractEMD').value || '5000',
        inspectionDays: document.getElementById('contractInspectionDays').value || '7',
        closingDate: document.getElementById('contractClosingDate').value,
        sellerName: document.getElementById('contractSellerName').value,
        sellerPhone: document.getElementById('contractSellerPhone').value,
        sellerEmail: document.getElementById('contractSellerEmail').value,
        titleCompany: document.getElementById('contractTitleCompany').value,
        assignable: document.getElementById('contractAssignable').checked,
        asIs: document.getElementById('contractAsIs').checked,
        cashOnly: document.getElementById('contractCashOnly').checked,
        sellerFinancing: document.getElementById('contractSellerFinancing').checked,
        specialConditions: document.getElementById('contractSpecialConditions').value
    };
    
    // Validation
    if (!formData.propertyAddress || !formData.purchasePrice || !formData.closingDate || !formData.sellerName) {
        alert('Please fill in all required fields');
        return null;
    }
    
    return formData;
}

function generateContractHTML(data) {
    const today = new Date().toLocaleDateString();
    const closingDate = new Date(data.closingDate).toLocaleDateString();
    
    return `
        <div class="contract-document">
            <div class="text-center mb-8">
                <h1 class="text-xl font-bold mb-2">REAL ESTATE PURCHASE AGREEMENT</h1>
                <p class="text-sm">State: Texas (Modify as needed for your jurisdiction)</p>
            </div>
            
            <div class="mb-6">
                <p><strong>Date:</strong> ${today}</p>
            </div>
            
            <div class="mb-6">
                <p><strong>PARTIES:</strong></p>
                <p><strong>Seller:</strong> ${data.sellerName}</p>
                <p><strong>Buyer:</strong> Enriched Properties LLC, a Texas Limited Liability Company${data.assignable ? ' and/or assigns' : ''}</p>
            </div>
            
            <div class="mb-6">
                <p><strong>PROPERTY:</strong></p>
                <p>The real property located at: <strong>${data.propertyAddress}</strong></p>
                <p>Together with all improvements, fixtures, and appurtenances thereto (the "Property").</p>
            </div>
            
            <div class="mb-6">
                <p><strong>PURCHASE PRICE:</strong></p>
                <p>The total purchase price for the Property shall be <strong>${formatCurrency(parseInt(data.purchasePrice))}</strong> ("Purchase Price").</p>
            </div>
            
            <div class="mb-6">
                <p><strong>EARNEST MONEY:</strong></p>
                <p>Upon execution of this Agreement, Buyer shall deposit <strong>${formatCurrency(parseInt(data.emdAmount))}</strong> as earnest money with ${data.titleCompany || 'the designated title company'} to be held in escrow until closing.</p>
            </div>
            
            <div class="mb-6">
                <p><strong>CLOSING:</strong></p>
                <p>Closing shall occur on or before <strong>${closingDate}</strong>. Time is of the essence.</p>
                <p>Closing shall take place at ${data.titleCompany || 'the designated title company'} or such other location as mutually agreed upon by the parties.</p>
            </div>
            
            <div class="mb-6">
                <p><strong>INSPECTION PERIOD:</strong></p>
                <p>Buyer shall have <strong>${data.inspectionDays} days</strong> from the date of this Agreement to inspect the Property and approve or disapprove of its condition in Buyer's sole discretion.</p>
            </div>
            
            ${data.asIs ? `
            <div class="mb-6">
                <p><strong>AS-IS CONDITION:</strong></p>
                <p>Seller is selling and Buyer is purchasing the Property in its present "AS-IS" condition. Seller makes no warranties or representations regarding the condition of the Property.</p>
            </div>
            ` : ''}
            
            ${data.assignable ? `
            <div class="mb-6">
                <p><strong>ASSIGNMENT:</strong></p>
                <p>Buyer may assign this Agreement to any person or entity without the consent of Seller. Upon assignment, the assignee shall assume all obligations of Buyer hereunder.</p>
            </div>
            ` : ''}
            
            ${data.cashOnly ? `
            <div class="mb-6">
                <p><strong>CASH TRANSACTION:</strong></p>
                <p>This is a cash transaction. Buyer shall provide proof of funds within 2 business days of execution.</p>
            </div>
            ` : ''}
            
            ${data.specialConditions ? `
            <div class="mb-6">
                <p><strong>SPECIAL CONDITIONS:</strong></p>
                <p>${data.specialConditions}</p>
            </div>
            ` : ''}
            
            <div class="mb-6">
                <p><strong>DEFAULT:</strong></p>
                <p>If Buyer defaults, Seller may retain the earnest money as liquidated damages. If Seller defaults, Buyer may seek specific performance or damages.</p>
            </div>
            
            <div class="mb-6">
                <p><strong>CLOSING COSTS:</strong></p>
                <p>Each party shall pay their own attorney fees. Buyer and Seller shall split title insurance premiums and closing costs equally unless otherwise specified.</p>
            </div>
            
            <div class="mb-8">
                <p><strong>GOVERNING LAW:</strong></p>
                <p>This Agreement shall be governed by the laws of the State of Texas.</p>
            </div>
            
            <div class="signature-section grid grid-cols-2 gap-8 mt-12">
                <div>
                    <p class="mb-8"><strong>SELLER:</strong></p>
                    <div class="border-b border-black mb-2" style="height: 20px;"></div>
                    <p>${data.sellerName}</p>
                    <p>Date: _______________</p>
                    ${data.sellerPhone ? `<p>Phone: ${data.sellerPhone}</p>` : ''}
                    ${data.sellerEmail ? `<p>Email: ${data.sellerEmail}</p>` : ''}
                </div>
                
                <div>
                    <p class="mb-8"><strong>BUYER:</strong></p>
                    <div class="border-b border-black mb-2" style="height: 20px;"></div>
                    <p>Enriched Properties LLC</p>
                    <p>By: ________________________</p>
                    <p>Manager</p>
                    <p>Date: _______________</p>
                </div>
            </div>
            
            <div class="mt-8 text-xs text-gray-600">
                <p><strong>DISCLAIMER:</strong> This contract template is for informational purposes. Consult with a qualified attorney before using in actual transactions. Laws vary by state and jurisdiction.</p>
            </div>
        </div>
    `;
}

function downloadContract() {
    if (!currentContractData) return;
    
    const contractContent = document.getElementById('contractPreviewContent').innerHTML;
    
    // Create a temporary div with the contract content
    const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Purchase Agreement - ${currentContractData.propertyAddress}</title>
            <style>
                body { font-family: 'Times New Roman', serif; font-size: 14px; line-height: 1.6; margin: 40px; }
                .contract-document { max-width: none; }
                .text-center { text-align: center; }
                .mb-2 { margin-bottom: 0.5rem; }
                .mb-4 { margin-bottom: 1rem; }
                .mb-6 { margin-bottom: 1.5rem; }
                .mb-8 { margin-bottom: 2rem; }
                .mt-8 { margin-top: 2rem; }
                .mt-12 { margin-top: 3rem; }
                .text-xl { font-size: 1.25rem; }
                .text-sm { font-size: 0.875rem; }
                .text-xs { font-size: 0.75rem; }
                .font-bold { font-weight: bold; }
                .grid { display: grid; }
                .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
                .gap-8 { gap: 2rem; }
                .border-b { border-bottom: 1px solid black; }
                .border-black { border-color: black; }
                .text-gray-600 { color: #666; }
                @media print {
                    body { margin: 20px; }
                    .no-print { display: none; }
                }
            </style>
        </head>
        <body>
            ${contractContent}
        </body>
        </html>
    `;
    
    // Open in new window for printing/saving
    const printWindow = window.open('', '_blank');
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    
    // Automatically trigger print dialog
    setTimeout(() => {
        printWindow.print();
    }, 250);
}

// Logout function
function logout() {
    if (confirm('Are you sure you want to logout?')) {
        localStorage.removeItem('enrichedPropsAuth');
        localStorage.removeItem('enrichedPropsUser');
        showSuccessMessage('Logged out successfully. Redirecting...');
        
        setTimeout(() => {
            window.location.href = 'index.html';
        }, 1500);
    }
}

// ==============================================
// DEAL ANALYSIS CALCULATOR FUNCTIONS
// ==============================================

// Calculate ARV (After Repair Value) - pure function
function getARVValue() {
    const comp1 = parseFloat(document.getElementById('comp1').value) || 0;
    const comp2 = parseFloat(document.getElementById('comp2').value) || 0;
    const comp3 = parseFloat(document.getElementById('comp3').value) || 0;
    
    let avgARV = 0;
    let compCount = 0;
    
    if (comp1 > 0) { avgARV += comp1; compCount++; }
    if (comp2 > 0) { avgARV += comp2; compCount++; }
    if (comp3 > 0) { avgARV += comp3; compCount++; }
    
    if (compCount > 0) {
        avgARV = avgARV / compCount;
    }
    
    return avgARV;
}

// Calculate ARV and update display
function calculateARV() {
    const avgARV = getARVValue();
    document.getElementById('calculatedARV').textContent = formatCurrency(avgARV);
    updateProfitDisplay();
}

// Get total repair costs - pure function
function getRepairsValue() {
    const kitchenCost = parseFloat(document.getElementById('kitchenCost').value) || 0;
    const bathroomCost = parseFloat(document.getElementById('bathroomCost').value) || 0;
    const flooringCost = parseFloat(document.getElementById('flooringCost').value) || 0;
    const paintCost = parseFloat(document.getElementById('paintCost').value) || 0;
    const roofCost = parseFloat(document.getElementById('roofCost').value) || 0;
    const hvacCost = parseFloat(document.getElementById('hvacCost').value) || 0;
    const electricalCost = parseFloat(document.getElementById('electricalCost').value) || 0;
    const plumbingCost = parseFloat(document.getElementById('plumbingCost').value) || 0;
    const landscapingCost = parseFloat(document.getElementById('landscapingCost').value) || 0;
    
    const subtotal = kitchenCost + bathroomCost + flooringCost + paintCost + 
                    roofCost + hvacCost + electricalCost + plumbingCost + landscapingCost;
    
    const contingency = subtotal * 0.10; // 10% contingency
    const totalRepairs = subtotal + contingency;
    
    return { totalRepairs, contingency };
}

// Calculate repairs and update display
function calculateRepairs() {
    const { totalRepairs, contingency } = getRepairsValue();
    
    document.getElementById('contingencyCost').textContent = formatCurrency(contingency);
    document.getElementById('totalRepairs').textContent = formatCurrency(totalRepairs);
    
    updateProfitDisplay();
}

// Calculate profit margins
function calculateProfit() {
    updateProfitDisplay();
}

// Update profit display with all calculations
function updateProfitDisplay() {
    const arv = getARVValue();
    const { totalRepairs } = getRepairsValue();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const assignmentFee = parseFloat(document.getElementById('assignmentFee').value) || 0;
    const marketingCosts = parseFloat(document.getElementById('marketingCosts').value) || 0;
    const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
    
    const totalCosts = marketingCosts + otherCosts;
    const buyerInvestment = purchasePrice + totalRepairs;
    const buyerProfit = arv - buyerInvestment;
    const yourProfit = assignmentFee - totalCosts;
    
    // Update profit analysis display
    const profitARVEl = document.getElementById('profitARV');
    const profitPurchaseEl = document.getElementById('profitPurchase');
    const profitRepairsEl = document.getElementById('profitRepairs');
    const profitAssignmentEl = document.getElementById('profitAssignment');
    const profitCostsEl = document.getElementById('profitCosts');
    const buyerProfitEl = document.getElementById('buyerProfit');
    const yourProfitEl = document.getElementById('yourProfit');
    
    if (profitARVEl) profitARVEl.textContent = formatCurrency(arv);
    if (profitPurchaseEl) profitPurchaseEl.textContent = formatCurrency(purchasePrice);
    if (profitRepairsEl) profitRepairsEl.textContent = formatCurrency(totalRepairs);
    if (profitAssignmentEl) profitAssignmentEl.textContent = formatCurrency(assignmentFee);
    if (profitCostsEl) profitCostsEl.textContent = formatCurrency(totalCosts);
    if (buyerProfitEl) buyerProfitEl.textContent = formatCurrency(buyerProfit);
    if (yourProfitEl) yourProfitEl.textContent = formatCurrency(yourProfit);
    
    // Update profit color coding
    if (buyerProfitEl) {
        if (buyerProfit > 0) {
            buyerProfitEl.className = 'text-lg font-bold text-green-600';
        } else {
            buyerProfitEl.className = 'text-lg font-bold text-red-600';
        }
    }
    
    if (yourProfitEl) {
        if (yourProfit > 0) {
            yourProfitEl.className = 'text-lg font-bold text-green-600';
        } else {
            yourProfitEl.className = 'text-lg font-bold text-red-600';
        }
    }
    
    // Calculate ROI automatically (but don't call recursively)
    updateROIDisplay();
    
    // Calculate Rapid Offers automatically
    calculateRapidOffers();
}

// Calculate ROI and deal metrics (public function)
function calculateROI() {
    updateROIDisplay();
}

// Update ROI display with all calculations
function updateROIDisplay() {
    const assignmentFee = parseFloat(document.getElementById('assignmentFee').value) || 0;
    const marketingCosts = parseFloat(document.getElementById('marketingCosts').value) || 0;
    const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
    const timeInvestment = parseFloat(document.getElementById('timeInvestment').value) || 1;
    const hourlyTarget = parseFloat(document.getElementById('hourlyTarget').value) || 0;
    const daysToClose = parseFloat(document.getElementById('daysToClose').value) || 30;
    
    const netProfit = assignmentFee - marketingCosts - otherCosts;
    const profitPerHour = netProfit / timeInvestment;
    const dealsPerMonth = 30 / daysToClose;
    const monthlyROI = netProfit * dealsPerMonth;
    
    // Calculate deal score (0-100)
    let dealScore = 0;
    const arv = getARVValue();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const { totalRepairs } = getRepairsValue();
    
    if (arv > 0 && purchasePrice > 0) {
        const buyerProfit = arv - purchasePrice - totalRepairs;
        const profitMarginPercent = (buyerProfit / arv) * 100;
        const assignmentPercent = (assignmentFee / purchasePrice) * 100;
        
        // Score based on various factors
        if (profitMarginPercent >= 20) dealScore += 30;
        else if (profitMarginPercent >= 15) dealScore += 20;
        else if (profitMarginPercent >= 10) dealScore += 10;
        
        if (assignmentPercent >= 8) dealScore += 25;
        else if (assignmentPercent >= 5) dealScore += 15;
        else if (assignmentPercent >= 3) dealScore += 10;
        
        if (profitPerHour >= hourlyTarget) dealScore += 25;
        else if (profitPerHour >= hourlyTarget * 0.8) dealScore += 15;
        else if (profitPerHour >= hourlyTarget * 0.6) dealScore += 10;
        
        if (daysToClose <= 21) dealScore += 20;
        else if (daysToClose <= 30) dealScore += 15;
        else if (daysToClose <= 45) dealScore += 10;
    }
    
    // Update ROI display
    const profitPerHourEl = document.getElementById('profitPerHour');
    const monthlyROIEl = document.getElementById('monthlyROI');
    const dealScoreEl = document.getElementById('dealScore');
    const dealEvaluationEl = document.getElementById('dealEvaluation');
    
    if (profitPerHourEl) profitPerHourEl.textContent = formatCurrency(profitPerHour);
    if (monthlyROIEl) monthlyROIEl.textContent = formatCurrency(monthlyROI);
    if (dealScoreEl) dealScoreEl.textContent = Math.round(dealScore) + '/100';
    
    // Update deal score color
    if (dealScoreEl) {
        if (dealScore >= 80) {
            dealScoreEl.className = 'text-lg font-bold text-green-600';
        } else if (dealScore >= 60) {
            dealScoreEl.className = 'text-lg font-bold text-yellow-600';
        } else {
            dealScoreEl.className = 'text-lg font-bold text-red-600';
        }
    }
    
    // Update deal evaluation
    let evaluation = '';
    if (dealScore >= 80) {
        evaluation = '🚀 EXCELLENT DEAL - Strong profit margins for both you and buyer. High ROI potential.';
    } else if (dealScore >= 70) {
        evaluation = '✅ GOOD DEAL - Solid profits with acceptable risk. Worth pursuing.';
    } else if (dealScore >= 60) {
        evaluation = '⚠️ MARGINAL DEAL - Lower profits but still viable. Consider negotiating better terms.';
    } else if (dealScore >= 40) {
        evaluation = '❌ POOR DEAL - Low profit margins. High risk, not recommended.';
    } else {
        evaluation = '🛑 BAD DEAL - Negative or very low returns. Avoid this deal.';
    }
    
    if (dealEvaluationEl) dealEvaluationEl.textContent = evaluation;
}

// Rapid Offer System Calculator
// Based on Flip with Rick / Zach Ginn Wholesaling Formula
function calculateOffers({ ARV, repairs = 0 }) {
  if (!ARV || ARV <= 0) {
    throw new Error("ARV (After Repair Value) must be a positive number");
  }

  // Adjusted Value (ARV minus repairs)
  const netValue = ARV - repairs;

  let multiplier;

  if (ARV < 120000) {
    multiplier = 0.70; // 70%
  } else if (ARV >= 120000 && ARV <= 220000) {
    multiplier = 0.80; // 80%
  } else if (ARV > 220000 && ARV <= 300000) {
    multiplier = 0.815; // 81.5%
  } else if (ARV > 300000 && ARV <= 400000) {
    multiplier = 0.829; // 82.9%
  } else {
    multiplier = 0.849; // 84.9%
  }

  // Max Allowable Offer (MAO)
  const MAO = netValue * multiplier;

  // Least Allowable Offer (initial lowball = 70% of MAO)
  const LAO = MAO * 0.70;

  return {
    ARV,
    repairs,
    netValue,
    multiplier,
    MAO: Math.round(MAO),
    LAO: Math.round(LAO)
  };
}

// Calculate Rapid Offer System and update display
function calculateRapidOffers() {
    try {
        const arv = getARVValue();
        const { totalRepairs } = getRepairsValue();
        
        if (arv <= 0) {
            document.getElementById('rapidMAO').textContent = '$0';
            document.getElementById('rapidLAO').textContent = '$0';
            document.getElementById('rapidMultiplier').textContent = '0%';
            document.getElementById('rapidNetValue').textContent = '$0';
            return;
        }
        
        const offerData = calculateOffers({ ARV: arv, repairs: totalRepairs });
        
        // Update display elements
        document.getElementById('rapidMAO').textContent = formatCurrency(offerData.MAO);
        document.getElementById('rapidLAO').textContent = formatCurrency(offerData.LAO);
        document.getElementById('rapidMultiplier').textContent = (offerData.multiplier * 100).toFixed(1) + '%';
        document.getElementById('rapidNetValue').textContent = formatCurrency(offerData.netValue);
        
        // Update color coding for offers
        const maoEl = document.getElementById('rapidMAO');
        const laoEl = document.getElementById('rapidLAO');
        
        if (maoEl) {
            maoEl.className = 'text-lg font-bold text-green-600';
        }
        
        if (laoEl) {
            laoEl.className = 'text-lg font-bold text-blue-600';
        }
        
    } catch (error) {
        console.error('Error calculating rapid offers:', error);
        document.getElementById('rapidMAO').textContent = 'Error';
        document.getElementById('rapidLAO').textContent = 'Error';
    }
}

// Search comparables with pre-populated external links
function searchComparables() {
    const neighborhood = document.getElementById('neighborhood').value;
    const priceRangeLow = document.getElementById('priceRangeLow').value;
    const priceRangeHigh = document.getElementById('priceRangeHigh').value;
    const minBeds = document.getElementById('minBeds').value;
    const minBaths = document.getElementById('minBaths').value;
    const minSqft = document.getElementById('minSqft').value;
    
    const resultsDiv = document.getElementById('comparablesResults');
    
    if (!neighborhood) {
        resultsDiv.innerHTML = '<p class="text-red-600">Please enter a neighborhood or zip code</p>';
        return;
    }
    
    // Build search URLs with parameters
    updateSearchLinks();
    
    // Show search results
    resultsDiv.innerHTML = `
        <div class="space-y-2">
            <h5 class="font-semibold">Search Parameters:</h5>
            <p class="text-xs"><strong>Area:</strong> ${neighborhood}</p>
            <p class="text-xs"><strong>Price:</strong> $${formatNumber(priceRangeLow)} - $${formatNumber(priceRangeHigh)}</p>
            <p class="text-xs"><strong>Beds/Baths:</strong> ${minBeds}+/${minBaths}+</p>
            <p class="text-xs"><strong>Min Sqft:</strong> ${formatNumber(minSqft)}</p>
            <hr class="my-2">
            <p class="text-sm text-green-600">✅ <strong>Ready!</strong> Zillow and Realtor.com buttons above now have your search criteria pre-loaded.</p>
            <p class="text-xs text-gray-500">Click the buttons above to open searches with your criteria automatically filled in.</p>
        </div>
    `;
    
    showSuccessMessage('Search links updated! Click Zillow/Realtor.com buttons to open pre-populated searches.');
}

// Update external search links with current criteria
function updateSearchLinks() {
    const neighborhood = document.getElementById('neighborhood').value;
    const priceRangeLow = document.getElementById('priceRangeLow').value || '';
    const priceRangeHigh = document.getElementById('priceRangeHigh').value || '';
    const minBeds = document.getElementById('minBeds').value || '';
    const minBaths = document.getElementById('minBaths').value || '';
    const minSqft = document.getElementById('minSqft').value || '';
    
    // Build Zillow URL
    let zillowUrl = 'https://www.zillow.com/homes/';
    if (neighborhood) {
        zillowUrl += encodeURIComponent(neighborhood) + '_rb/';
    }
    
    // Add Zillow search parameters
    const zillowParams = [];
    if (priceRangeLow && priceRangeHigh) {
        zillowParams.push(`${priceRangeLow}-${priceRangeHigh}_price`);
    } else if (priceRangeLow) {
        zillowParams.push(`${priceRangeLow}-_price`);
    } else if (priceRangeHigh) {
        zillowParams.push(`0-${priceRangeHigh}_price`);
    }
    
    if (minBeds) {
        zillowParams.push(`${minBeds}-_beds`);
    }
    
    if (minBaths) {
        zillowParams.push(`${minBaths}-_baths`);
    }
    
    if (minSqft) {
        zillowParams.push(`${minSqft}-_size`);
    }
    
    if (zillowParams.length > 0) {
        zillowUrl += zillowParams.join('/') + '/';
    }
    
    // Build Realtor.com URL (simplified approach)
    // Realtor.com search URLs are complex, so we'll use their generic search page with location
    let realtorUrl = 'https://www.realtor.com/realestateandhomes-search';
    
    const realtorParams = new URLSearchParams();
    
    // Add location if provided
    if (neighborhood) {
        realtorParams.append('city', neighborhood);
    }
    
    // Add all search parameters
    if (priceRangeLow) realtorParams.append('price-min', priceRangeLow);
    if (priceRangeHigh) realtorParams.append('price-max', priceRangeHigh);
    if (minBeds) realtorParams.append('beds-min', minBeds);
    if (minBaths) realtorParams.append('baths-min', minBaths);
    if (minSqft) realtorParams.append('sqft-min', minSqft);
    
    // Default to for-sale listings
    realtorParams.append('status', 'for-sale');
    
    if (realtorParams.toString()) {
        realtorUrl += '?' + realtorParams.toString();
    }
    
    // Update the button onclick handlers
    const zillowButton = document.querySelector('button[onclick*="zillow.com"]');
    const realtorButton = document.querySelector('button[onclick*="realtor.com"]');
    
    if (zillowButton) {
        zillowButton.setAttribute('onclick', `window.open('${zillowUrl}', '_blank')`);
        zillowButton.innerHTML = 'Open Zillow Search 🔗';
    }
    
    if (realtorButton) {
        realtorButton.setAttribute('onclick', `window.open('${realtorUrl}', '_blank')`);
        realtorButton.innerHTML = 'Open Realtor.com Search 🔗';
    }
}

// Open Redfin search with criteria
function openRedfinSearch() {
    const neighborhood = document.getElementById('neighborhood').value;
    const priceRangeLow = document.getElementById('priceRangeLow').value || '';
    const priceRangeHigh = document.getElementById('priceRangeHigh').value || '';
    const minBeds = document.getElementById('minBeds').value || '';
    const minBaths = document.getElementById('minBaths').value || '';
    const minSqft = document.getElementById('minSqft').value || '';
    
    if (!neighborhood) {
        alert('Please enter a neighborhood or zip code first, then click "Research Comparables"');
        return;
    }
    
    // Build Redfin URL
    let redfinUrl = `https://www.redfin.com/city/${encodeURIComponent(neighborhood)}/filter/`;
    
    const redfinParams = [];
    if (priceRangeLow) redfinParams.push(`min-price=${priceRangeLow}`);
    if (priceRangeHigh) redfinParams.push(`max-price=${priceRangeHigh}`);
    if (minBeds) redfinParams.push(`min-beds=${minBeds}`);
    if (minBaths) redfinParams.push(`min-baths=${minBaths}`);
    if (minSqft) redfinParams.push(`min-sqft=${minSqft}`);
    
    if (redfinParams.length > 0) {
        redfinUrl += redfinParams.join(',');
    }
    
    window.open(redfinUrl, '_blank');
}

// Open Homes.com search with criteria
function openHomesSearch() {
    const neighborhood = document.getElementById('neighborhood').value;
    const priceRangeLow = document.getElementById('priceRangeLow').value || '';
    const priceRangeHigh = document.getElementById('priceRangeHigh').value || '';
    const minBeds = document.getElementById('minBeds').value || '';
    const minBaths = document.getElementById('minBaths').value || '';
    const minSqft = document.getElementById('minSqft').value || '';
    
    if (!neighborhood) {
        alert('Please enter a neighborhood or zip code first, then click "Research Comparables"');
        return;
    }
    
    // Build Homes.com URL
    let homesUrl = 'https://www.homes.com/for-sale/';
    if (neighborhood) {
        homesUrl += encodeURIComponent(neighborhood) + '/';
    }
    
    const homesParams = new URLSearchParams();
    if (priceRangeLow) homesParams.append('min_price', priceRangeLow);
    if (priceRangeHigh) homesParams.append('max_price', priceRangeHigh);
    if (minBeds) homesParams.append('min_beds', minBeds);
    if (minBaths) homesParams.append('min_baths', minBaths);
    if (minSqft) homesParams.append('min_sqft', minSqft);
    
    if (homesParams.toString()) {
        homesUrl += '?' + homesParams.toString();
    }
    
    window.open(homesUrl, '_blank');
}

// Clear all analysis data
function clearAnalysis() {
    if (confirm('Clear all deal analysis data?')) {
        // Property info
        document.getElementById('propAddress').value = '';
        document.getElementById('propSqft').value = '';
        document.getElementById('propBeds').value = '';
        document.getElementById('propBaths').value = '';
        
        // ARV Calculator
        document.getElementById('comp1').value = '';
        document.getElementById('comp2').value = '';
        document.getElementById('comp3').value = '';
        document.getElementById('calculatedARV').textContent = '$0';
        
        // Repair costs
        document.getElementById('kitchenCost').value = '';
        document.getElementById('bathroomCost').value = '';
        document.getElementById('flooringCost').value = '';
        document.getElementById('paintCost').value = '';
        document.getElementById('roofCost').value = '';
        document.getElementById('hvacCost').value = '';
        document.getElementById('electricalCost').value = '';
        document.getElementById('plumbingCost').value = '';
        document.getElementById('landscapingCost').value = '';
        document.getElementById('contingencyCost').textContent = '$0';
        document.getElementById('totalRepairs').textContent = '$0';
        
        // Profit analysis
        document.getElementById('purchasePrice').value = '';
        document.getElementById('assignmentFee').value = '';
        document.getElementById('marketingCosts').value = '';
        document.getElementById('otherCosts').value = '';
        
        // ROI Calculator
        document.getElementById('timeInvestment').value = '';
        document.getElementById('hourlyTarget').value = '';
        document.getElementById('daysToClose').value = '';
        
        // Market comparables
        document.getElementById('neighborhood').value = '';
        document.getElementById('priceRangeLow').value = '';
        document.getElementById('priceRangeHigh').value = '';
        document.getElementById('minBeds').value = '';
        document.getElementById('minBaths').value = '';
        document.getElementById('minSqft').value = '';
        document.getElementById('researchNotes').value = '';
        document.getElementById('comparablesResults').innerHTML = '<p class="text-gray-600">Comparable search results will appear here</p>';
        
        // Reset external search buttons
        const zillowButton = document.querySelector('button[onclick*="zillow"]');
        const realtorButton = document.querySelector('button[onclick*="realtor"]');
        
        if (zillowButton) {
            zillowButton.setAttribute('onclick', `window.open('https://www.zillow.com', '_blank')`);
            zillowButton.innerHTML = 'Open Zillow';
        }
        
        if (realtorButton) {
            realtorButton.setAttribute('onclick', `window.open('https://www.realtor.com', '_blank')`);
            realtorButton.innerHTML = 'Open Realtor.com';
        }
        
        // AI Assessment Form
        document.getElementById('aiSqft').value = '';
        document.getElementById('aiYearBuilt').value = '';
        document.getElementById('aiStories').value = '';
        document.getElementById('aiBedrooms').value = '';
        document.getElementById('aiBathrooms').value = '';
        document.getElementById('aiWindows').value = '';
        document.getElementById('aiHvacUnits').value = '';
        document.getElementById('aiWaterHeaters').value = '';
        document.getElementById('aiElectricalPanels').value = '';
        document.getElementById('aiRoofPercent').value = '';
        document.getElementById('aiFoundationFeet').value = '';
        document.getElementById('aiSidingSqft').value = '';
        document.getElementById('aiFlooringSqft').value = '';
        document.getElementById('aiPaintRooms').value = '';
        document.getElementById('aiDoors').value = '';
        document.getElementById('aiAppliances').value = '';
        document.getElementById('aiLightFixtures').value = '';
        document.getElementById('aiPlumbingFixtures').value = '';
        document.getElementById('aiDeckSqft').value = '';
        document.getElementById('aiLandscapingSqft').value = '';
        document.getElementById('aiGarageDoors').value = '';
        
        // AI Calculator outputs
        document.getElementById('aiPromptOutput').value = '';
        document.getElementById('chatGPTLink').href = '#';
        document.getElementById('aiStructuralCost').textContent = '$0';
        document.getElementById('aiInteriorCost').textContent = '$0';
        document.getElementById('aiSystemsCost').textContent = '$0';
        document.getElementById('aiAppliancesCost').textContent = '$0';
        document.getElementById('aiLaborCost').textContent = '$0';
        document.getElementById('aiSubtotal').textContent = '$0';
        document.getElementById('aiContingency').textContent = '$0';
        document.getElementById('aiTotalEstimate').textContent = '$0';
        
        // Reset all displays
        updateProfitDisplay();
        
        showSuccessMessage('Deal analysis cleared successfully!');
    }
}

// AI Property Assessment & Smart Calculator Functions

// Update AI Calculator and Prompt Generator
function updateAICalculator() {
    const data = collectAIFormData();
    generateAIPrompt(data);
    calculateSmartRepairs(data);
}

// Collect all form data
function collectAIFormData() {
    const getValue = (id) => parseFloat(document.getElementById(id)?.value) || 0;
    
    return {
        // Property Details
        sqft: getValue('aiSqft'),
        yearBuilt: getValue('aiYearBuilt'),
        stories: getValue('aiStories'),
        
        // Room Counts
        bedrooms: getValue('aiBedrooms'),
        bathrooms: getValue('aiBathrooms'),
        windows: getValue('aiWindows'),
        
        // Major Systems
        hvacUnits: getValue('aiHvacUnits'),
        waterHeaters: getValue('aiWaterHeaters'),
        electricalPanels: getValue('aiElectricalPanels'),
        
        // Structural & Exterior
        roofPercent: getValue('aiRoofPercent'),
        foundationFeet: getValue('aiFoundationFeet'),
        sidingSqft: getValue('aiSidingSqft'),
        
        // Interior
        flooringSqft: getValue('aiFlooringSqft'),
        paintRooms: getValue('aiPaintRooms'),
        doors: getValue('aiDoors'),
        
        // Appliances & Fixtures
        appliances: getValue('aiAppliances'),
        lightFixtures: getValue('aiLightFixtures'),
        plumbingFixtures: getValue('aiPlumbingFixtures'),
        
        // Outdoor & Other
        deckSqft: getValue('aiDeckSqft'),
        landscapingSqft: getValue('aiLandscapingSqft'),
        garageDoors: getValue('aiGarageDoors')
    };
}

// Generate AI Prompt
function generateAIPrompt(data) {
    if (!hasAnyInput(data)) {
        document.getElementById('aiPromptOutput').value = '';
        document.getElementById('chatGPTLink').href = '#';
        return;
    }

    const prompt = `Please provide a detailed repair cost estimate for a residential property with the following specifications:

PROPERTY DETAILS:
• Square Footage: ${data.sqft} sq ft
• Year Built: ${data.yearBuilt}
• Number of Stories: ${data.stories}

REPAIR REQUIREMENTS:

Structural & Exterior:
• Roof repairs needed: ${data.roofPercent}% of total roof area
• Foundation issues: ${data.foundationFeet} linear feet
• Siding repair: ${data.sidingSqft} sq ft

Interior Repairs:
• Bedrooms needing repair: ${data.bedrooms}
• Bathrooms needing repair: ${data.bathrooms}
• Flooring replacement: ${data.flooringSqft} sq ft
• Interior paint: ${data.paintRooms} rooms
• Doors needing replacement: ${data.doors}
• Windows needing replacement: ${data.windows}

Systems & Mechanical:
• HVAC units needing repair/replace: ${data.hvacUnits}
• Water heaters needing replacement: ${data.waterHeaters}
• Electrical panels needing update: ${data.electricalPanels}

Fixtures & Appliances:
• Kitchen appliances needed: ${data.appliances}
• Light fixtures needing replacement: ${data.lightFixtures}
• Plumbing fixtures needing replacement: ${data.plumbingFixtures}

Outdoor & Miscellaneous:
• Deck/patio repair: ${data.deckSqft} sq ft
• Landscaping areas: ${data.landscapingSqft} sq ft
• Garage doors needing repair/replace: ${data.garageDoors}

Please provide:
1. Itemized cost breakdown for each category
2. Labor costs and timeline estimates
3. Total repair cost estimate with 15% contingency
4. Regional cost considerations
5. Potential cost-saving alternatives where applicable

Format the response in a clear, organized manner suitable for real estate investment analysis.`;

    document.getElementById('aiPromptOutput').value = prompt;
    
    // Update ChatGPT link
    const encodedPrompt = encodeURIComponent(prompt);
    document.getElementById('chatGPTLink').href = `https://chat.openai.com/?q=${encodedPrompt}`;
}

// Check if any input has data
function hasAnyInput(data) {
    return Object.values(data).some(value => value > 0);
}

// Calculate Smart Repair Costs
function calculateSmartRepairs(data) {
    // Cost per unit calculations based on industry standards
    const costs = {
        // Structural & Exterior
        roofRepair: (data.sqft * 0.5) * (data.roofPercent / 100) * 8, // $8 per sq ft affected
        foundation: data.foundationFeet * 150, // $150 per linear foot
        siding: data.sidingSqft * 12, // $12 per sq ft
        
        // Interior
        flooring: data.flooringSqft * 6, // $6 per sq ft average
        paintPerRoom: data.paintRooms * 400, // $400 per room
        doors: data.doors * 250, // $250 per door
        windows: data.windows * 450, // $450 per window
        
        // Systems & Mechanical
        hvac: data.hvacUnits * 4500, // $4,500 per unit
        waterHeater: data.waterHeaters * 1200, // $1,200 per unit
        electricalPanel: data.electricalPanels * 1800, // $1,800 per panel
        
        // Appliances & Fixtures
        appliances: data.appliances * 800, // $800 per appliance average
        lightFixtures: data.lightFixtures * 150, // $150 per fixture
        plumbingFixtures: data.plumbingFixtures * 300, // $300 per fixture
        
        // Outdoor & Other
        deck: data.deckSqft * 15, // $15 per sq ft
        landscaping: data.landscapingSqft * 3, // $3 per sq ft
        garageDoors: data.garageDoors * 800 // $800 per door
    };
    
    // Category totals
    const structural = costs.roofRepair + costs.foundation + costs.siding;
    const interior = costs.flooring + costs.paintPerRoom + costs.doors + costs.windows;
    const systems = costs.hvac + costs.waterHeater + costs.electricalPanel;
    const appliances = costs.appliances + costs.lightFixtures + costs.plumbingFixtures;
    const outdoor = costs.deck + costs.landscaping + costs.garageDoors;
    
    // Labor calculation (25% of materials for most items)
    const labor = (structural + interior + systems + appliances + outdoor) * 0.25;
    
    const subtotal = structural + interior + systems + appliances + outdoor + labor;
    const contingency = subtotal * 0.15; // 15% contingency
    const total = subtotal + contingency;
    
    // Update display
    document.getElementById('aiStructuralCost').textContent = formatCurrency(structural);
    document.getElementById('aiInteriorCost').textContent = formatCurrency(interior);
    document.getElementById('aiSystemsCost').textContent = formatCurrency(systems);
    document.getElementById('aiAppliancesCost').textContent = formatCurrency(appliances);
    document.getElementById('aiLaborCost').textContent = formatCurrency(labor + outdoor); // Include outdoor in labor category
    document.getElementById('aiSubtotal').textContent = formatCurrency(subtotal);
    document.getElementById('aiContingency').textContent = formatCurrency(contingency);
    document.getElementById('aiTotalEstimate').textContent = formatCurrency(total);
}

// Copy AI Prompt to clipboard
function copyAIPrompt() {
    const promptText = document.getElementById('aiPromptOutput').value;
    if (!promptText) {
        showErrorMessage('No prompt generated yet. Please fill out the assessment form first.');
        return;
    }
    
    navigator.clipboard.writeText(promptText).then(() => {
        showSuccessMessage('AI prompt copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy text: ', err);
        showErrorMessage('Failed to copy prompt. Please select and copy manually.');
    });
}

// Helper function to format numbers without currency symbol
function formatNumber(number) {
    if (!number) return '0';
    return new Intl.NumberFormat('en-US').format(number);
}

// ================================
// MARKETING & LEAD GENERATION FUNCTIONS (PHASES 4.1-4.4)
// ================================

// Global Marketing Variables
let directMailCampaigns = [];
let callingLists = [];
let landingPages = [];
let marketingMetrics = {
    totalSpend: 0,
    totalRevenue: 0,
    totalLeads: 0,
    campaigns: 0
};

// Marketing Sub-Tab Navigation
function showMarketingSubTab(tabName) {
    // Hide all sub-content
    const subContents = document.querySelectorAll('.marketing-sub-content');
    subContents.forEach(content => content.classList.add('hidden'));
    
    // Remove active class from all sub-tabs
    const subTabs = document.querySelectorAll('.marketing-sub-tab');
    subTabs.forEach(tab => {
        tab.classList.remove('active', 'border-indigo-500', 'text-indigo-600');
        tab.classList.add('border-transparent', 'text-gray-500');
    });
    
    // Show selected sub-content
    const targetContent = document.getElementById(tabName + '-content');
    if (targetContent) {
        targetContent.classList.remove('hidden');
    }
    
    // Activate selected sub-tab
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active', 'border-indigo-500', 'text-indigo-600');
        targetTab.classList.remove('border-transparent', 'text-gray-500');
    }
}

// ================================
// PHASE 4.1: DIRECT MAIL CAMPAIGN MANAGER
// ================================

// Create Direct Mail Campaign
function createDirectMailCampaign() {
    const name = document.getElementById('campaignName').value;
    const type = document.getElementById('campaignType').value;
    const listSize = parseInt(document.getElementById('listSize').value) || 0;
    const costPerPiece = parseFloat(document.getElementById('costPerPiece').value) || 0;
    const mailDate = document.getElementById('mailDate').value;
    const expectedResponse = parseFloat(document.getElementById('expectedResponse').value) || 0;
    
    if (!name || !mailDate || listSize === 0 || costPerPiece === 0) {
        showErrorMessage('Please fill in all required fields');
        return;
    }
    
    // Get selected criteria
    const criteria = Array.from(document.querySelectorAll('.campaign-criteria:checked'))
        .map(cb => cb.value);
    
    const campaign = {
        id: Date.now(),
        name,
        type,
        listSize,
        costPerPiece,
        mailDate,
        expectedResponse,
        criteria,
        totalCost: listSize * costPerPiece,
        actualResponses: 0,
        actualLeads: 0,
        revenue: 0,
        status: 'planned',
        createdAt: new Date().toISOString()
    };
    
    directMailCampaigns.push(campaign);
    updateDirectMailTable();
    updateMarketingDashboard();
    clearDirectMailForm();
    
    showSuccessMessage('Direct mail campaign created successfully!');
}

// Calculate Campaign ROI
function calculateCampaignROI() {
    const listSize = parseInt(document.getElementById('listSize').value) || 0;
    const costPerPiece = parseFloat(document.getElementById('costPerPiece').value) || 0;
    const expectedResponse = parseFloat(document.getElementById('expectedResponse').value) || 0;
    
    if (listSize === 0 || costPerPiece === 0) {
        showErrorMessage('Please enter list size and cost per piece');
        return;
    }
    
    const totalCost = listSize * costPerPiece;
    const expectedResponses = Math.round((listSize * expectedResponse) / 100);
    const costPerResponse = expectedResponses > 0 ? totalCost / expectedResponses : 0;
    const expectedLeads = Math.round(expectedResponses * 0.6); // Assume 60% of responses become leads
    
    // Estimate ROI based on average deal value ($15,000 assignment fee)
    const avgDealValue = 15000;
    const expectedDeals = Math.round(expectedLeads * 0.1); // Assume 10% close rate
    const expectedRevenue = expectedDeals * avgDealValue;
    const netProfit = expectedRevenue - totalCost;
    const roi = totalCost > 0 ? ((netProfit / totalCost) * 100) : 0;
    
    // Update projections display
    document.getElementById('projectedCost').textContent = formatCurrency(totalCost);
    document.getElementById('projectedResponses').textContent = expectedResponses.toString();
    document.getElementById('projectedCostPerResponse').textContent = formatCurrency(costPerResponse);
    document.getElementById('projectedLeads').textContent = expectedLeads.toString();
    document.getElementById('projectedROI').textContent = roi.toFixed(1) + '%';
    
    // Color code ROI
    const roiElement = document.getElementById('projectedROI');
    if (roi >= 300) {
        roiElement.className = 'text-green-600 font-semibold';
    } else if (roi >= 100) {
        roiElement.className = 'text-blue-600 font-semibold';
    } else if (roi >= 0) {
        roiElement.className = 'text-yellow-600 font-semibold';
    } else {
        roiElement.className = 'text-red-600 font-semibold';
    }
}

// Update Direct Mail Campaigns Table
function updateDirectMailTable() {
    const tbody = document.getElementById('directMailCampaignsTable');
    
    if (directMailCampaigns.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-4 text-center text-gray-500">No campaigns created yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = directMailCampaigns.map(campaign => {
        const roi = campaign.totalCost > 0 ? (((campaign.revenue - campaign.totalCost) / campaign.totalCost) * 100) : 0;
        const roiClass = roi >= 100 ? 'text-green-600' : roi >= 0 ? 'text-blue-600' : 'text-red-600';
        
        return `
            <tr>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${campaign.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${campaign.type}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatNumber(campaign.listSize)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatCurrency(campaign.totalCost)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${campaign.actualResponses}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium ${roiClass}">${roi.toFixed(1)}%</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <button onclick="editCampaign(${campaign.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button onclick="deleteCampaign(${campaign.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `;
    }).join('');
}

// Clear Direct Mail Form
function clearDirectMailForm() {
    document.getElementById('campaignName').value = '';
    document.getElementById('listSize').value = '';
    document.getElementById('costPerPiece').value = '';
    document.getElementById('mailDate').value = '';
    document.getElementById('expectedResponse').value = '';
    document.querySelectorAll('.campaign-criteria').forEach(cb => cb.checked = false);
    
    // Clear projections
    document.getElementById('projectedCost').textContent = '$0';
    document.getElementById('projectedResponses').textContent = '0';
    document.getElementById('projectedCostPerResponse').textContent = '$0';
    document.getElementById('projectedLeads').textContent = '0';
    document.getElementById('projectedROI').textContent = '0%';
}

// ================================
// PHASE 4.2: COLD CALLING LISTS
// ================================

// Create Calling List
function createCallingList() {
    const name = document.getElementById('callingListName').value;
    const targetCount = parseInt(document.getElementById('targetCount').value) || 0;
    const skipTraceCost = parseFloat(document.getElementById('skipTraceCost').value) || 0;
    const provider = document.getElementById('skipTraceProvider').value;
    
    if (!name || targetCount === 0) {
        showErrorMessage('Please fill in list name and target count');
        return;
    }
    
    // Get selected criteria
    const criteria = Array.from(document.querySelectorAll('.calling-criteria:checked'))
        .map(cb => cb.value);
    
    const list = {
        id: Date.now(),
        name,
        targetCount,
        skipTraceCost,
        provider,
        criteria,
        totalCost: targetCount * skipTraceCost,
        called: 0,
        contacts: 0,
        leads: 0,
        appointments: 0,
        status: 'active',
        createdAt: new Date().toISOString()
    };
    
    callingLists.push(list);
    updateCallingListsTable();
    updateMarketingDashboard();
    clearCallingForm();
    
    showSuccessMessage('Calling list created successfully!');
}

// Upload CSV for Calling List
function uploadCSV() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.csv';
    input.onchange = function(event) {
        const file = event.target.files[0];
        if (file) {
            // In a real implementation, you would parse the CSV file
            showSuccessMessage('CSV upload functionality would be implemented here');
        }
    };
    input.click();
}

// Start Calling Session
function startCallingSession() {
    showSuccessMessage('Calling session started! This would integrate with your dialer system.');
    // Update call tracking numbers
    updateCallTracking();
}

// Log Call Result
function logCall() {
    // In a real implementation, this would open a modal to log call results
    showSuccessMessage('Call logging functionality would be implemented here');
}

// Update Call Tracking
function updateCallTracking() {
    // Simulate call tracking data
    const callsMade = Math.floor(Math.random() * 50) + 10;
    const contacts = Math.floor(callsMade * 0.3);
    const appointments = Math.floor(contacts * 0.2);
    
    document.getElementById('callsMadeToday').textContent = callsMade.toString();
    document.getElementById('contactRate').textContent = ((contacts / callsMade) * 100).toFixed(1) + '%';
    document.getElementById('appointmentsSet').textContent = appointments.toString();
    document.getElementById('callConversionRate').textContent = ((appointments / callsMade) * 100).toFixed(1) + '%';
}

// Update Calling Lists Table
function updateCallingListsTable() {
    const tbody = document.getElementById('callingListsTable');
    
    if (callingLists.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No calling lists created yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = callingLists.map(list => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${list.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatNumber(list.targetCount)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${list.called}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${list.contacts}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${list.leads}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editList(${list.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onclick="deleteList(${list.id})" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Clear Calling Form
function clearCallingForm() {
    document.getElementById('callingListName').value = '';
    document.getElementById('targetCount').value = '';
    document.getElementById('skipTraceCost').value = '';
    document.querySelectorAll('.calling-criteria').forEach(cb => cb.checked = false);
}

// ================================
// PHASE 4.3: MARKETING ROI ANALYTICS
// ================================

// Update Marketing Dashboard Overview
function updateMarketingDashboard() {
    try {
        // Calculate totals from all campaigns
        const totalCampaigns = directMailCampaigns.length + callingLists.length;
        const totalSpend = directMailCampaigns.reduce((sum, c) => sum + c.totalCost, 0) + 
                         callingLists.reduce((sum, l) => sum + l.totalCost, 0);
        const totalLeads = directMailCampaigns.reduce((sum, c) => sum + c.actualLeads, 0) + 
                          callingLists.reduce((sum, l) => sum + l.leads, 0);
        const totalRevenue = directMailCampaigns.reduce((sum, c) => sum + c.revenue, 0);
        
        const roi = totalSpend > 0 ? (((totalRevenue - totalSpend) / totalSpend) * 100) : 0;
        const costPerLead = totalLeads > 0 ? totalSpend / totalLeads : 0;
        
        // Update dashboard metrics (with null checks)
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };
        
        updateElement('activeCampaigns', totalCampaigns.toString());
        updateElement('totalLeadsGenerated', totalLeads.toString());
        updateElement('marketingROI', roi.toFixed(1) + '%');
        updateElement('costPerLead', formatCurrency(costPerLead));
        
        // Update ROI analytics section
        updateElement('totalMarketingSpend', formatCurrency(totalSpend));
        updateElement('totalMarketingRevenue', formatCurrency(totalRevenue));
        updateElement('totalMarketingProfit', formatCurrency(totalRevenue - totalSpend));
        updateElement('overallMarketingROI', roi.toFixed(1) + '%');
        
        // Update channel-specific ROI (simplified for demo)
        updateElement('directMailROI', '150.0%');
        updateElement('coldCallingROI', '120.0%');
        updateElement('digitalAdsROI', '80.0%');
        updateElement('referralsROI', '300.0%');
        
        // Update cost per lead by channel
        updateElement('directMailCPL', '$85');
        updateElement('coldCallingCPL', '$45');
        
        // Update lead quality metrics
        updateElement('appointmentRate', '25.0%');
        updateElement('contractRate', '12.0%');
        updateElement('closeRate', '8.0%');
    } catch (error) {
        console.error('Error updating marketing dashboard:', error);
    }
}

// ================================
// PHASE 4.4: LANDING PAGE BUILDER
// ================================

// Update Page Preview
function updatePagePreview() {
    const template = document.getElementById('pageTemplate').value;
    const headline = document.getElementById('pageHeadline').value || 'Get a Cash Offer in 24 Hours';
    const subheadline = document.getElementById('pageSubheadline').value || 'No repairs, no commissions, no hassles. Sell your house fast for cash.';
    const buttonText = document.getElementById('buttonText').value || 'Get My Cash Offer';
    const primaryColor = document.getElementById('primaryColor').value;
    
    const preview = document.getElementById('pagePreview');
    
    let templateContent = '';
    
    switch (template) {
        case 'cash-offer':
            templateContent = `
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-2">${headline}</h3>
                    <p class="text-sm text-gray-600 mb-4">${subheadline}</p>
                    <form class="space-y-2">
                        <input type="text" placeholder="Property Address" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Your Name" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Phone Number" class="w-full px-2 py-1 border rounded text-xs">
                        <button style="background-color: ${primaryColor}" class="w-full text-white py-2 rounded text-xs">${buttonText}</button>
                    </form>
                </div>
            `;
            break;
        case 'foreclosure-help':
            templateContent = `
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-2 text-red-600">Stop Foreclosure Now!</h3>
                    <p class="text-sm text-gray-600 mb-4">We can help you avoid foreclosure and save your credit.</p>
                    <form class="space-y-2">
                        <input type="text" placeholder="Property Address" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Your Name" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Phone Number" class="w-full px-2 py-1 border rounded text-xs">
                        <button class="w-full bg-red-600 text-white py-2 rounded text-xs">Get Help Now</button>
                    </form>
                </div>
            `;
            break;
        default:
            templateContent = `
                <div class="text-center">
                    <h3 class="text-lg font-bold mb-2">${headline}</h3>
                    <p class="text-sm text-gray-600 mb-4">${subheadline}</p>
                    <form class="space-y-2">
                        <input type="text" placeholder="Property Address" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Your Name" class="w-full px-2 py-1 border rounded text-xs">
                        <input type="text" placeholder="Phone Number" class="w-full px-2 py-1 border rounded text-xs">
                        <button style="background-color: ${primaryColor}" class="w-full text-white py-2 rounded text-xs">${buttonText}</button>
                    </form>
                </div>
            `;
    }
    
    preview.innerHTML = templateContent;
}

// Generate Landing Page
function generateLandingPage() {
    const pageName = document.getElementById('pageName').value;
    const template = document.getElementById('pageTemplate').value;
    
    if (!pageName) {
        showErrorMessage('Please enter a page name');
        return;
    }
    
    updatePagePreview();
    showSuccessMessage('Landing page generated successfully!');
}

// Save Landing Page
function saveLandingPage() {
    const pageName = document.getElementById('pageName').value;
    const template = document.getElementById('pageTemplate').value;
    const source = document.getElementById('pageSource').value;
    const headline = document.getElementById('pageHeadline').value;
    const phone = document.getElementById('pagePhone').value;
    
    if (!pageName) {
        showErrorMessage('Please enter a page name');
        return;
    }
    
    const page = {
        id: Date.now(),
        name: pageName,
        template,
        source,
        headline,
        phone,
        views: 0,
        conversions: 0,
        conversionRate: 0,
        status: 'draft',
        createdAt: new Date().toISOString()
    };
    
    landingPages.push(page);
    updateLandingPagesTable();
    clearLandingPageForm();
    
    showSuccessMessage('Landing page saved successfully!');
}

// Publish Page
function publishPage() {
    showSuccessMessage('Page publishing functionality would integrate with your hosting provider');
}

// Update Landing Pages Table
function updateLandingPagesTable() {
    const tbody = document.getElementById('landingPagesTable');
    
    if (landingPages.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-gray-500">No landing pages created yet</td></tr>';
        return;
    }
    
    tbody.innerHTML = landingPages.map(page => `
        <tr>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${page.name}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">${page.template.replace('-', ' ')}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatNumber(page.views)}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${page.conversions}</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${page.conversionRate.toFixed(1)}%</td>
            <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                <button onclick="editPage(${page.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                <button onclick="deletePage(${page.id})" class="text-red-600 hover:text-red-900">Delete</button>
            </td>
        </tr>
    `).join('');
}

// Clear Landing Page Form
function clearLandingPageForm() {
    document.getElementById('pageName').value = '';
    document.getElementById('pageHeadline').value = '';
    document.getElementById('pagePhone').value = '';
    document.getElementById('pageSubheadline').value = '';
    document.getElementById('buttonText').value = '';
    document.getElementById('primaryColor').value = '#3b82f6';
}

// ================================
// MARKETING UTILITY FUNCTIONS
// ================================

// Export Marketing Data
function exportMarketingData() {
    const data = {
        directMailCampaigns,
        callingLists,
        landingPages,
        marketingMetrics
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'marketing_data_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    showSuccessMessage('Marketing data exported successfully!');
}

// Add Campaign Modal (placeholder)
function showAddCampaignModal() {
    showSuccessMessage('Campaign creation modal would be implemented here');
}

// Initialize Marketing Dashboard on Load
function initializeMarketing() {
    try {
        updateMarketingDashboard();
        updateDirectMailTable();
        updateCallingListsTable();
        updateLandingPagesTable();
        
        // Only update page preview if elements exist
        if (document.getElementById('pageTemplate')) {
            updatePagePreview();
        }
        
        // Set default marketing sub-tab
        showMarketingSubTab('direct-mail');
    } catch (error) {
        console.error('Error initializing marketing:', error);
    }
}

// ==============================================
// ASSIGNMENT CONTRACT MANAGEMENT FUNCTIONS
// ==============================================

// Assignment Fee Management (2.1)
function showAssignmentFeeModal() {
    // Populate buyer dropdown
    const buyerSelect = document.getElementById('feeStructureBuyer');
    buyerSelect.innerHTML = '<option value="">Select Buyer</option><option value="new">+ Add New Buyer</option>';
    
    buyers.forEach(buyer => {
        const option = document.createElement('option');
        option.value = buyer.id;
        option.textContent = buyer.name;
        buyerSelect.appendChild(option);
    });
    
    document.getElementById('assignmentFeeModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideAssignmentFeeModal() {
    document.getElementById('assignmentFeeModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
    document.getElementById('assignmentFeeModal').querySelector('form').reset();
}

function addAssignmentFeeStructure(event) {
    event.preventDefault();
    
    const buyerId = document.getElementById('feeStructureBuyer').value;
    const structureType = document.getElementById('feeStructureType').value;
    const typicalFee = parseFloat(document.getElementById('typicalFeeAmount').value) || 0;
    const minFee = parseFloat(document.getElementById('minFeeAmount').value) || 0;
    const maxFee = parseFloat(document.getElementById('maxFeeAmount').value) || 0;
    const specialConditions = document.getElementById('specialConditions').value;
    
    // Get selected property types
    const propertyTypes = Array.from(document.querySelectorAll('input[name="propertyTypes"]:checked')).map(cb => cb.value);
    
    const feeStructure = {
        id: Date.now(),
        buyerId: buyerId,
        buyerName: buyers.find(b => b.id == buyerId)?.name || 'Unknown Buyer',
        structureType: structureType,
        typicalFee: typicalFee,
        minFee: minFee,
        maxFee: maxFee,
        propertyTypes: propertyTypes,
        specialConditions: specialConditions,
        dateCreated: new Date().toISOString(),
        lastUsed: null,
        totalDeals: 0
    };
    
    assignmentFees.push(feeStructure);
    saveData();
    updateAssignmentFeesTable();
    updateAssignmentFeeStats();
    hideAssignmentFeeModal();
    
    showSuccessMessage('Assignment fee structure added successfully!');
}

function updateAssignmentFeesTable() {
    const tbody = document.getElementById('assignmentFeesTable');
    if (!tbody) return;
    
    if (assignmentFees.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="px-4 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">💰</div>
                    <p class="text-sm">No fee structures yet</p>
                    <p class="text-xs">Add fee structures to track assignment fees by buyer</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = assignmentFees.map(fee => `
            <tr>
                <td class="px-4 py-4 text-sm font-medium text-gray-900">${fee.buyerName}</td>
                <td class="px-4 py-4 text-sm text-gray-600">
                    <span class="capitalize">${fee.structureType}</span>
                    ${fee.propertyTypes.length > 0 ? `<br><span class="text-xs text-gray-500">${fee.propertyTypes.join(', ').toUpperCase()}</span>` : ''}
                </td>
                <td class="px-4 py-4 text-sm text-gray-900">
                    <div class="font-medium">${formatCurrency(fee.typicalFee)}</div>
                    <div class="text-xs text-gray-500">${formatCurrency(fee.minFee)} - ${formatCurrency(fee.maxFee)}</div>
                </td>
                <td class="px-4 py-4 text-sm text-gray-600">
                    ${fee.lastUsed ? formatDate(fee.lastUsed) : 'Never'}
                    <div class="text-xs text-gray-500">${fee.totalDeals} deals</div>
                </td>
                <td class="px-4 py-4 text-sm font-medium">
                    <button onclick="editAssignmentFee(${fee.id})" class="text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button onclick="deleteAssignmentFee(${fee.id})" class="text-red-600 hover:text-red-900">Delete</button>
                </td>
            </tr>
        `).join('');
    }
}

function updateAssignmentFeeStats() {
    if (assignmentFees.length === 0) {
        document.getElementById('avgAssignmentFee').textContent = '$0';
        document.getElementById('minAssignmentFee').textContent = '$0';
        document.getElementById('maxAssignmentFee').textContent = '$0';
        document.getElementById('feeEfficiency').textContent = '0%';
        document.getElementById('totalAssignmentFees').textContent = '$0';
        return;
    }
    
    const fees = assignmentFees.map(f => f.typicalFee);
    const avgFee = fees.reduce((sum, fee) => sum + fee, 0) / fees.length;
    const minFee = Math.min(...fees);
    const maxFee = Math.max(...fees);
    
    // Calculate efficiency (average fee as percentage of average purchase price)
    const avgPurchasePrice = contracts.length > 0 ? 
        contracts.reduce((sum, c) => sum + (c.purchasePrice || 0), 0) / contracts.length : 250000;
    const feeEfficiency = avgPurchasePrice > 0 ? (avgFee / avgPurchasePrice) * 100 : 0;
    
    // Calculate total pending assignment fees
    const totalPending = contracts.filter(c => ['active', 'executed'].includes(c.status))
        .reduce((sum, c) => sum + (c.assignmentFee || 0), 0);
    
    document.getElementById('avgAssignmentFee').textContent = formatCurrency(avgFee);
    document.getElementById('minAssignmentFee').textContent = formatCurrency(minFee);
    document.getElementById('maxAssignmentFee').textContent = formatCurrency(maxFee);
    document.getElementById('feeEfficiency').textContent = feeEfficiency.toFixed(1) + '%';
    document.getElementById('totalAssignmentFees').textContent = formatCurrency(totalPending);
}

function deleteAssignmentFee(id) {
    const fee = assignmentFees.find(f => f.id === id);
    if (fee && confirm(`Delete fee structure for ${fee.buyerName}?`)) {
        assignmentFees = assignmentFees.filter(f => f.id !== id);
        saveData();
        updateAssignmentFeesTable();
        updateAssignmentFeeStats();
        showSuccessMessage('Fee structure deleted successfully!');
    }
}

// Digital Signature Management (2.3)
function showDigitalSignatureModal(contractId) {
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    // Populate contract details
    document.getElementById('signatureContractTitle').textContent = contract.contractType || 'Purchase Agreement';
    document.getElementById('signatureProperty').textContent = contract.propertyAddress || 'Unknown Property';
    document.getElementById('signatureAmount').textContent = formatCurrency(contract.purchasePrice || 0);
    document.getElementById('signatureDeadline').textContent = formatDate(contract.closingDate);
    document.getElementById('signatureStatus').textContent = contract.status || 'Draft';
    
    // Store current contract ID for signature operations
    window.currentSignatureContractId = contractId;
    
    document.getElementById('digitalSignatureModal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

function hideDigitalSignatureModal() {
    document.getElementById('digitalSignatureModal').classList.add('hidden');
    document.body.style.overflow = 'auto';
}

function requestSignature(party) {
    const contractId = window.currentSignatureContractId;
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    // Simulate signature request
    const email = party === 'seller' ? contract.sellerEmail : contract.buyerEmail;
    const name = party === 'seller' ? contract.sellerName : contract.buyerName;
    
    if (!email) {
        showErrorMessage(`No email found for ${party}. Please update contact information.`);
        return;
    }
    
    // Simulate sending signature request
    showSuccessMessage(`Signature request sent to ${name} (${email})`);
    
    // Update contract status
    if (!contract.signatures) contract.signatures = {};
    contract.signatures[party + 'Requested'] = new Date().toISOString();
    
    saveData();
    updateContractsTable();
}

function markSigned(party) {
    const contractId = window.currentSignatureContractId;
    const contract = contracts.find(c => c.id === contractId);
    if (!contract) return;
    
    if (!contract.signatures) contract.signatures = {};
    contract.signatures[party + 'Signed'] = new Date().toISOString();
    contract.signatures[party + 'SignedBy'] = 'Manual Entry';
    
    // Check if both parties have signed
    if (contract.signatures.sellerSigned && contract.signatures.buyerSigned) {
        contract.status = 'executed';
        showSuccessMessage('Contract fully executed! Both parties have signed.');
    } else {
        showSuccessMessage(`${party.charAt(0).toUpperCase() + party.slice(1)} signature recorded.`);
    }
    
    saveData();
    updateContractsTable();
    updateContractStats();
}

function integrateDocuSign() {
    showErrorMessage('DocuSign integration requires API setup. Contact support for implementation.');
}

function integrateAdobeSign() {
    showErrorMessage('Adobe Sign integration requires API setup. Contact support for implementation.');
}

function generateSignatureLink() {
    const contractId = window.currentSignatureContractId;
    const baseUrl = window.location.origin + window.location.pathname;
    const signatureUrl = `${baseUrl}?sign=${contractId}&token=${Math.random().toString(36).substr(2, 9)}`;
    
    navigator.clipboard.writeText(signatureUrl).then(() => {
        showSuccessMessage('Signature link copied to clipboard!');
    }).catch(() => {
        alert(`Signature link: ${signatureUrl}`);
    });
}

function finalizeSignatures() {
    console.log('finalizeSignatures() called');
    const contractId = window.currentSignatureContractId;
    console.log('Contract ID:', contractId);
    
    if (!contractId) {
        showErrorMessage('No contract selected. Please close and reopen the signature modal.');
        return;
    }
    
    const contract = contracts.find(c => c.id == contractId); // Use == to handle type coercion
    
    if (!contract) {
        showErrorMessage('Contract not found. Please try again.');
        console.error('Contract lookup failed:', {
            contractId,
            contractIds: contracts.map(c => c.id),
            contracts: contracts.length
        });
        return;
    }
    
    // Check if both parties have signed
    const sellerSigned = contract.signatures?.sellerSigned;
    const buyerSigned = contract.signatures?.buyerSigned;
    
    if (sellerSigned && buyerSigned) {
        contract.status = 'executed';
        contract.executedDate = new Date().toISOString();
        
        saveData();
        updateContractsTable();
        updateContractStats();
        updateContractDeadlines();
        hideDigitalSignatureModal();
        
        showSuccessMessage('Contract finalized and marked as executed!');
    } else {
        let missingSignatures = [];
        if (!sellerSigned) missingSignatures.push('Seller');
        if (!buyerSigned) missingSignatures.push('Buyer');
        
        showErrorMessage(`Missing signatures from: ${missingSignatures.join(' and ')}. Both parties must sign before finalizing the contract.`);
    }
}

// Helper functions for contract table display
function calculateDaysUntilDeadline(closingDate) {
    if (!closingDate) return 'N/A';
    
    const today = new Date();
    const closing = new Date(closingDate);
    const timeDiff = closing.getTime() - today.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    if (daysDiff < 0) {
        return `${Math.abs(daysDiff)} days overdue`;
    } else if (daysDiff === 0) {
        return 'Due Today';
    } else {
        return `${daysDiff} days`;
    }
}

function getContractSignatureStatus(contract) {
    if (!contract.signatures) return 'Pending';
    
    const sellerSigned = contract.signatures.sellerSigned;
    const buyerSigned = contract.signatures.buyerSigned;
    
    if (sellerSigned && buyerSigned) return 'Complete';
    if (sellerSigned || buyerSigned) return 'Partial';
    if (contract.signatures.sellerRequested || contract.signatures.buyerRequested) return 'Requested';
    return 'Pending';
}

function getSignatureStatusColor(status) {
    switch(status.toLowerCase()) {
        case 'complete': return 'bg-green-100 text-green-800';
        case 'partial': return 'bg-yellow-100 text-yellow-800';
        case 'requested': return 'bg-blue-100 text-blue-800';
        case 'pending': return 'bg-gray-100 text-gray-800';
        default: return 'bg-gray-100 text-gray-800';
    }
}

// Contract Status Pipeline (2.4)
function filterContractsByStatus(status) {
    // Update active filter button
    document.querySelectorAll('.pipeline-filter').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Filter contracts table
    const rows = document.querySelectorAll('#contractsTableBody tr');
    rows.forEach(row => {
        if (status === 'all') {
            row.style.display = '';
        } else {
            const statusCell = row.querySelector('td:nth-child(5)'); // Status column (updated from 6 to 5 for new table structure)
            if (statusCell && statusCell.textContent.toLowerCase().includes(status)) {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        }
    });
}

// Deadline Management (2.5)
function updateContractDeadlines() {
    const now = new Date();
    const urgentDeadlines = [];
    
    contracts.forEach(contract => {
        if (contract.closingDate && ['draft', 'active', 'executed'].includes(contract.status)) {
            const closingDate = new Date(contract.closingDate);
            const daysUntil = Math.ceil((closingDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 7 && daysUntil >= 0) {
                urgentDeadlines.push({
                    contract: contract,
                    daysUntil: daysUntil,
                    type: 'closing',
                    urgent: daysUntil <= 3
                });
            }
        }
        
        // Check for option expiration deadlines
        if (contract.optionExpiration && ['draft', 'active'].includes(contract.status)) {
            const optionDate = new Date(contract.optionExpiration);
            const daysUntil = Math.ceil((optionDate - now) / (1000 * 60 * 60 * 24));
            
            if (daysUntil <= 5 && daysUntil >= 0) {
                urgentDeadlines.push({
                    contract: contract,
                    daysUntil: daysUntil,
                    type: 'option',
                    urgent: daysUntil <= 1
                });
            }
        }
    });
    
    const deadlineContainer = document.getElementById('urgentDeadlines');
    if (urgentDeadlines.length === 0) {
        deadlineContainer.innerHTML = '<p class="text-sm text-red-600">No urgent deadlines</p>';
    } else {
        deadlineContainer.innerHTML = urgentDeadlines.map(deadline => `
            <div class="flex items-center justify-between py-2 ${deadline.urgent ? 'bg-red-100 px-3 rounded' : ''}">
                <div>
                    <span class="font-medium">${deadline.contract.propertyAddress}</span>
                    <span class="text-sm text-gray-600">- ${deadline.type === 'closing' ? 'Closing' : 'Option expires'}</span>
                </div>
                <div class="text-right">
                    <div class="text-sm font-bold ${deadline.urgent ? 'text-red-800' : 'text-red-600'}">
                        ${deadline.daysUntil === 0 ? 'TODAY' : `${deadline.daysUntil} days`}
                    </div>
                    <div class="text-xs text-gray-500">${formatDate(deadline.type === 'closing' ? deadline.contract.closingDate : deadline.contract.optionExpiration)}</div>
                </div>
            </div>
        `).join('');
    }
    
    // Update deadline alert visibility
    const alertContainer = document.getElementById('deadlineAlerts');
    if (urgentDeadlines.length > 0) {
        alertContainer.style.display = 'block';
    } else {
        alertContainer.style.display = 'none';
    }
}

// Sorting functionality for buyers table
let currentSortField = '';
let currentSortDirection = 'asc';

function sortBuyersTable(field) {
    // Toggle sort direction if clicking the same field
    if (currentSortField === field) {
        currentSortDirection = currentSortDirection === 'asc' ? 'desc' : 'asc';
    } else {
        currentSortField = field;
        currentSortDirection = 'asc';
    }
    
    // Update sort indicators
    updateSortIndicators(field, currentSortDirection);
    
    // Sort the buyers array
    buyers.sort((a, b) => {
        let aValue, bValue;
        
        switch(field) {
            case 'name':
                aValue = a.name?.toLowerCase() || '';
                bValue = b.name?.toLowerCase() || '';
                break;
            case 'type':
                aValue = a.type?.toLowerCase() || '';
                bValue = b.type?.toLowerCase() || '';
                break;
            case 'city':
                aValue = (a.city || a.address?.city || '').toLowerCase();
                bValue = (b.city || b.address?.city || '').toLowerCase();
                break;
            case 'state':
                aValue = (a.state || a.address?.state || '').toLowerCase();
                bValue = (b.state || b.address?.state || '').toLowerCase();
                break;
            case 'email':
                aValue = a.email?.toLowerCase() || '';
                bValue = b.email?.toLowerCase() || '';
                break;
            case 'budget':
                aValue = a.maxBudget || 0;
                bValue = b.maxBudget || 0;
                break;
            case 'status':
                aValue = a.status?.toLowerCase() || '';
                bValue = b.status?.toLowerCase() || '';
                break;
            default:
                return 0;
        }
        
        // Handle numeric values
        if (field === 'budget') {
            return currentSortDirection === 'asc' ? aValue - bValue : bValue - aValue;
        }
        
        // Handle string values
        if (aValue < bValue) return currentSortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return currentSortDirection === 'asc' ? 1 : -1;
        return 0;
    });
    
    // Re-render the table
    updateBuyersTable();
    
    // Save sorted data
    CloudStorage.saveData('buyers', buyers);
}

function updateSortIndicators(activeField, direction) {
    // Reset all indicators
    const indicators = ['sort-name', 'sort-type', 'sort-city', 'sort-state', 'sort-email', 'sort-budget', 'sort-status'];
    indicators.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = '⇅';
            element.className = 'ml-1 text-gray-400';
        }
    });
    
    // Set active indicator
    const activeIndicator = document.getElementById(`sort-${activeField}`);
    if (activeIndicator) {
        activeIndicator.textContent = direction === 'asc' ? '↑' : '↓';
        activeIndicator.className = 'ml-1 text-blue-600 font-bold';
    }
}

// Floating horizontal scroll bar functionality
let floatingScrollBar;
let buyersTableContainer;

function initializeFloatingScrollBar() {
    // Wait for DOM to be ready
    setTimeout(() => {
        buyersTableContainer = document.querySelector('#buyers .overflow-x-auto');
        floatingScrollBar = document.getElementById('floatingScrollBar');
        
        if (buyersTableContainer && floatingScrollBar) {
            // Create scroll content for the floating bar
            const scrollContent = document.createElement('div');
            scrollContent.id = 'floatingScrollContent';
            scrollContent.style.width = '1px';
            scrollContent.style.height = '1px';
            floatingScrollBar.appendChild(scrollContent);
            
            // Make floating bar scrollable
            floatingScrollBar.style.overflowX = 'auto';
            floatingScrollBar.style.overflowY = 'hidden';
            floatingScrollBar.style.maxWidth = '80vw';
            
            // Set up scroll synchronization
            setupScrollSync();
            
            // Monitor table container for scroll necessity
            monitorScrollNeed();
        }
    }, 100);
}

function setupScrollSync() {
    if (!buyersTableContainer || !floatingScrollBar) return;
    
    let syncingFromTable = false;
    let syncingFromFloating = false;
    
    // Sync floating bar with table container
    buyersTableContainer.addEventListener('scroll', () => {
        if (syncingFromFloating) return;
        syncingFromTable = true;
        floatingScrollBar.scrollLeft = buyersTableContainer.scrollLeft;
        setTimeout(() => { syncingFromTable = false; }, 10);
    });
    
    // Sync table container with floating bar
    floatingScrollBar.addEventListener('scroll', () => {
        if (syncingFromTable) return;
        syncingFromFloating = true;
        buyersTableContainer.scrollLeft = floatingScrollBar.scrollLeft;
        setTimeout(() => { syncingFromFloating = false; }, 10);
    });
}

function monitorScrollNeed() {
    if (!buyersTableContainer || !floatingScrollBar) return;
    
    const checkScrollNeed = () => {
        const table = buyersTableContainer.querySelector('table');
        if (table) {
            const containerWidth = buyersTableContainer.clientWidth;
            const tableWidth = table.scrollWidth;
            const needsScroll = tableWidth > containerWidth;
            
            if (needsScroll) {
                // Update floating scroll bar width to match table
                const scrollContent = document.getElementById('floatingScrollContent');
                if (scrollContent) {
                    scrollContent.style.width = `${tableWidth}px`;
                }
                floatingScrollBar.classList.remove('hidden');
            } else {
                floatingScrollBar.classList.add('hidden');
            }
        }
    };
    
    // Check initially and on window resize
    checkScrollNeed();
    window.addEventListener('resize', checkScrollNeed);
    
    // Check when table content changes
    const observer = new MutationObserver(checkScrollNeed);
    observer.observe(buyersTableContainer, { childList: true, subtree: true });
}

// Initialize floating scroll bar when buyers tab is shown
function initializeBuyersTab() {
    initializeFloatingScrollBar();
}

// Hook into existing tab switching for buyers only
window.showTab = function(tabName) {
    // Call the original showTab logic
    showTabOriginal(tabName);
    
    if (tabName === 'buyers') {
        setTimeout(initializeBuyersTab, 100);
    }
};

// Rename the original function to avoid conflicts
function showTabOriginal(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    const tabButton = document.getElementById(`${tabName}-tab`);
    if (tabButton) {
        tabButton.classList.add('active');
    }
    
    // Hide all content
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.add('hidden');
    });
    
    // Show selected content
    const selectedContent = document.getElementById(`${tabName}-content`);
    if (selectedContent) {
        selectedContent.classList.remove('hidden');
        
        // Load content based on tab
        switch(tabName) {
            case 'overview':
                updateOverview();
                break;
            case 'leads':
                updateLeadsTable();
                break;
            case 'buyers':
                updateBuyersTable();
                break;
            case 'contracts':
                updateContractsTable();
                break;
            case 'properties':
                updatePropertiesGrid();
                break;
            case 'analytics':
                updateAnalytics();
                break;
            case 'dealanalysis':
                // Initialize Deal Analysis displays
                updateProfitDisplay();
                break;
            case 'marketing':
                // Initialize Marketing displays and force visibility
                const marketingContent = document.getElementById('marketing-content');
                if (marketingContent) {
                    marketingContent.classList.add('marketing-force-visible');
                    console.log('Marketing content forced visible with CSS class');
                }
                setTimeout(() => {
                    initializeMarketing();
                }, 50);
                break;
        }
    }
}

// Make marketing functions globally accessible for onclick handlers
window.showMarketingSubTab = showMarketingSubTab;
window.createDirectMailCampaign = createDirectMailCampaign;
window.calculateCampaignROI = calculateCampaignROI;
window.createCallingList = createCallingList;
window.uploadCSV = uploadCSV;
window.startCallingSession = startCallingSession;
window.logCall = logCall;
window.updatePagePreview = updatePagePreview;
window.generateLandingPage = generateLandingPage;
window.saveLandingPage = saveLandingPage;
window.publishPage = publishPage;
window.showAddCampaignModal = showAddCampaignModal;
window.exportMarketingData = exportMarketingData;
