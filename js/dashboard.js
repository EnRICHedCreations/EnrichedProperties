// Dashboard JavaScript for Enriched Properties LLC CRM

// Global variables
let currentTab = 'overview';
let leads = [];
let properties = [];
let contracts = [];
let buyers = [];

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

// Tab management
function showTab(tabName) {
    currentTab = tabName;
    
    // Update tab buttons
    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');
    
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
        }
    }
}

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
}

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
                <td colspan="6" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">📄</div>
                    <p class="text-sm">No contracts yet</p>
                    <p class="text-xs">Contracts will appear here as you close deals</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = contracts.map(contract => `
            <tr class="table-row">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${contract.propertyAddress}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${contract.sellerName}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatCurrency(contract.purchasePrice)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${contract.status}">${contract.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${formatDate(contract.closingDate)}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="viewContract(${contract.id})" class="action-button text-indigo-600 hover:text-indigo-900 mr-2">View</button>
                    <button onclick="editContract(${contract.id})" class="action-button text-gray-600 hover:text-gray-900">Edit</button>
                </td>
            </tr>
        `).join('');
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
                    <div>
                        <button onclick="editProperty(${property.id})" class="action-button text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                        <button onclick="deleteProperty(${property.id})" class="action-button text-red-600 hover:text-red-900">Delete</button>
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
    const tbody = document.getElementById('buyersTableBody');
    if (!tbody) return;
    
    if (buyers.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="px-6 py-8 text-center text-gray-500">
                    <div class="text-4xl mb-2">🏦</div>
                    <p class="text-sm">No buyers yet</p>
                    <p class="text-xs">Add your first buyer to start building your network</p>
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = buyers.map(buyer => `
            <tr class="table-row">
                <td class="px-6 py-4">
                    <div class="text-sm font-medium text-gray-900">${buyer.name}</div>
                    <div class="text-sm text-gray-500">${buyer.company}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${buyer.type}">${formatBuyerType(buyer.type)}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">${buyer.email}</div>
                    <div class="text-sm text-gray-500">${formatPhoneNumber(buyer.phone)}</div>
                </td>
                <td class="px-6 py-4">
                    <div class="text-sm text-gray-900">${buyer.preferredAreas || 'Any'}</div>
                    <div class="text-sm text-gray-500">${buyer.propertyTypes || 'All types'}</div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <div class="text-sm text-gray-900">
                        ${buyer.minBudget ? formatCurrency(buyer.minBudget) : '$0'} - ${buyer.maxBudget ? formatCurrency(buyer.maxBudget) : '∞'}
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="status-badge status-${buyer.status}">${buyer.status}</span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="editBuyer(${buyer.id})" class="action-button text-indigo-600 hover:text-indigo-900 mr-2">Edit</button>
                    <button onclick="deleteBuyer(${buyer.id})" class="action-button text-red-600 hover:text-red-900">Delete</button>
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
        document.body.style.overflow = 'auto';
        modal.querySelector('form').reset();
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

// CRUD operations
function editLead(id) {
    const lead = leads.find(l => l.id === id);
    if (lead) {
        // This would open an edit modal - simplified for demo
        const newStatus = prompt('Enter new status (new, contacted, qualified, under-contract, closed):', lead.status);
        if (newStatus && ['new', 'contacted', 'qualified', 'under-contract', 'closed'].includes(newStatus)) {
            lead.status = newStatus;
            lead.lastContact = new Date().toISOString();
            saveData();
            updateLeadsTable();
            updateDashboardStats();
            showSuccessMessage('Lead updated successfully!');
        }
    }
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
    if (property) {
        const newPrice = prompt('Enter new purchase price:', property.purchasePrice);
        if (newPrice && !isNaN(newPrice)) {
            property.purchasePrice = parseInt(newPrice);
            saveData();
            updatePropertiesGrid();
            showSuccessMessage('Property updated successfully!');
        }
    }
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
    if (contract) {
        alert(`Contract Details:\n\nProperty: ${contract.propertyAddress}\nSeller: ${contract.sellerName}\nPrice: ${formatCurrency(contract.purchasePrice)}\nStatus: ${contract.status}\nClosing: ${formatDate(contract.closingDate)}`);
    }
}

function editContract(id) {
    const contract = contracts.find(c => c.id === id);
    if (contract) {
        const newStatus = prompt('Enter new status (draft, active, executed):', contract.status);
        if (newStatus && ['draft', 'active', 'executed'].includes(newStatus)) {
            contract.status = newStatus;
            saveData();
            updateContractsTable();
            showSuccessMessage('Contract updated successfully!');
        }
    }
}

function generateContract() {
    showContractGeneratorModal();
}

// Buyer CRUD operations
function editBuyer(id) {
    const buyer = buyers.find(b => b.id === id);
    if (buyer) {
        const newStatus = prompt('Enter new status (active, warm, cold, inactive):', buyer.status);
        if (newStatus && ['active', 'warm', 'cold', 'inactive'].includes(newStatus)) {
            buyer.status = newStatus;
            buyer.lastContact = new Date().toISOString();
            saveData();
            updateBuyersTable();
            updateDashboardStats();
            showSuccessMessage('Buyer updated successfully!');
        }
    }
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

// Calculate ARV (After Repair Value)
function calculateARV() {
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
    
    document.getElementById('calculatedARV').textContent = formatCurrency(avgARV);
    
    // Update profit analysis display
    updateProfitDisplay();
    
    return avgARV;
}

// Calculate total repair costs
function calculateRepairs() {
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
    
    document.getElementById('contingencyCost').textContent = formatCurrency(contingency);
    document.getElementById('totalRepairs').textContent = formatCurrency(totalRepairs);
    
    // Update profit analysis display
    updateProfitDisplay();
    
    return totalRepairs;
}

// Calculate profit margins
function calculateProfit() {
    updateProfitDisplay();
}

// Update profit display with all calculations
function updateProfitDisplay() {
    const arv = calculateARV();
    const totalRepairs = calculateRepairs();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const assignmentFee = parseFloat(document.getElementById('assignmentFee').value) || 0;
    const marketingCosts = parseFloat(document.getElementById('marketingCosts').value) || 0;
    const otherCosts = parseFloat(document.getElementById('otherCosts').value) || 0;
    
    const totalCosts = marketingCosts + otherCosts;
    const buyerInvestment = purchasePrice + totalRepairs;
    const buyerProfit = arv - buyerInvestment;
    const yourProfit = assignmentFee - totalCosts;
    
    // Update profit analysis display
    document.getElementById('profitARV').textContent = formatCurrency(arv);
    document.getElementById('profitPurchase').textContent = formatCurrency(purchasePrice);
    document.getElementById('profitRepairs').textContent = formatCurrency(totalRepairs);
    document.getElementById('profitAssignment').textContent = formatCurrency(assignmentFee);
    document.getElementById('profitCosts').textContent = formatCurrency(totalCosts);
    document.getElementById('buyerProfit').textContent = formatCurrency(buyerProfit);
    document.getElementById('yourProfit').textContent = formatCurrency(yourProfit);
    
    // Update profit color coding
    const buyerProfitEl = document.getElementById('buyerProfit');
    const yourProfitEl = document.getElementById('yourProfit');
    
    if (buyerProfit > 0) {
        buyerProfitEl.className = 'text-lg font-bold text-green-600';
    } else {
        buyerProfitEl.className = 'text-lg font-bold text-red-600';
    }
    
    if (yourProfit > 0) {
        yourProfitEl.className = 'text-lg font-bold text-green-600';
    } else {
        yourProfitEl.className = 'text-lg font-bold text-red-600';
    }
    
    // Calculate ROI automatically
    calculateROI();
}

// Calculate ROI and deal metrics
function calculateROI() {
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
    const arv = calculateARV();
    const purchasePrice = parseFloat(document.getElementById('purchasePrice').value) || 0;
    const totalRepairs = calculateRepairs();
    
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
    document.getElementById('profitPerHour').textContent = formatCurrency(profitPerHour);
    document.getElementById('monthlyROI').textContent = formatCurrency(monthlyROI);
    document.getElementById('dealScore').textContent = Math.round(dealScore) + '/100';
    
    // Update deal score color
    const dealScoreEl = document.getElementById('dealScore');
    if (dealScore >= 80) {
        dealScoreEl.className = 'text-lg font-bold text-green-600';
    } else if (dealScore >= 60) {
        dealScoreEl.className = 'text-lg font-bold text-yellow-600';
    } else {
        dealScoreEl.className = 'text-lg font-bold text-red-600';
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
    
    document.getElementById('dealEvaluation').textContent = evaluation;
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
    
    // Build Realtor.com URL
    let realtorUrl = 'https://www.realtor.com/realestateandhomes-search/';
    if (neighborhood) {
        realtorUrl += encodeURIComponent(neighborhood);
    }
    
    const realtorParams = new URLSearchParams();
    if (priceRangeLow) realtorParams.append('price-min', priceRangeLow);
    if (priceRangeHigh) realtorParams.append('price-max', priceRangeHigh);
    if (minBeds) realtorParams.append('beds-min', minBeds);
    if (minBaths) realtorParams.append('baths-min', minBaths);
    if (minSqft) realtorParams.append('sqft-min', minSqft);
    
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
        
        // Reset all displays
        updateProfitDisplay();
        
        showSuccessMessage('Deal analysis cleared successfully!');
    }
}

// Helper function to format numbers without currency symbol
function formatNumber(number) {
    if (!number) return '0';
    return new Intl.NumberFormat('en-US').format(number);
}
