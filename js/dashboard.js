// Dashboard JavaScript for Enriched Properties LLC CRM

// Global variables
let currentTab = 'overview';
let leads = [];
let properties = [];
let contracts = [];

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
            case 'n':
                e.preventDefault();
                if (currentTab === 'leads') showAddLeadModal();
                else if (currentTab === 'properties') showAddPropertyModal();
                break;
        }
    }
    
    // ESC key to close modals
    if (e.key === 'Escape') {
        hideAllModals();
    }
}

// Load data from localStorage
function loadData() {
    leads = JSON.parse(localStorage.getItem('enrichedPropsLeads') || '[]');
    properties = JSON.parse(localStorage.getItem('enrichedPropsProperties') || '[]');
    contracts = JSON.parse(localStorage.getItem('enrichedPropsContracts') || '[]');
    
    // Load sample data if none exists
    if (leads.length === 0) {
        loadSampleData();
    }
    
    updateDashboardStats();
}

// Save data to localStorage
function saveData() {
    localStorage.setItem('enrichedPropsLeads', JSON.stringify(leads));
    localStorage.setItem('enrichedPropsProperties', JSON.stringify(properties));
    localStorage.setItem('enrichedPropsContracts', JSON.stringify(contracts));
}

// Load sample data for demo
function loadSampleData() {
    const sampleLeads = [
        {
            id: 1,
            firstName: 'John',
            lastName: 'Smith',
            phone: '(555) 123-4567',
            email: 'john.smith@email.com',
            propertyAddress: '123 Oak Street, Dallas, TX 75201',
            estimatedValue: 285000,
            status: 'qualified',
            source: 'Cold Call',
            notes: 'Motivated seller, divorce situation. Needs quick closing.',
            dateAdded: new Date(Date.now() - 86400000 * 2).toISOString(),
            lastContact: new Date(Date.now() - 86400000).toISOString()
        },
        {
            id: 2,
            firstName: 'Sarah',
            lastName: 'Johnson',
            phone: '(555) 987-6543',
            email: 'sarah.j@email.com',
            propertyAddress: '456 Pine Avenue, Houston, TX 77001',
            estimatedValue: 320000,
            status: 'contacted',
            source: 'Direct Mail',
            notes: 'Inherited property, needs repairs. Open to cash offers.',
            dateAdded: new Date(Date.now() - 86400000 * 3).toISOString(),
            lastContact: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: 3,
            firstName: 'Michael',
            lastName: 'Davis',
            phone: '(555) 456-7890',
            email: 'mdavis@email.com',
            propertyAddress: '789 Elm Drive, Austin, TX 78701',
            estimatedValue: 410000,
            status: 'under-contract',
            source: 'Website Form',
            notes: 'Pre-foreclosure. Contract signed, closing in 10 days.',
            dateAdded: new Date(Date.now() - 86400000 * 5).toISOString(),
            lastContact: new Date(Date.now() - 86400000).toISOString()
        }
    ];
    
    const sampleProperties = [
        {
            id: 1,
            address: '123 Oak Street, Dallas, TX 75201',
            purchasePrice: 285000,
            bedrooms: 3,
            bathrooms: 2,
            sqft: 1850,
            yearBuilt: 1995,
            status: 'under-contract',
            notes: 'Good condition, minor cosmetic updates needed.',
            dateAdded: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: 2,
            address: '456 Pine Avenue, Houston, TX 77001',
            purchasePrice: 320000,
            bedrooms: 4,
            bathrooms: 2.5,
            sqft: 2100,
            yearBuilt: 1988,
            status: 'evaluating',
            notes: 'Needs kitchen renovation, good bones.',
            dateAdded: new Date(Date.now() - 86400000 * 3).toISOString()
        }
    ];
    
    const sampleContracts = [
        {
            id: 1,
            propertyAddress: '123 Oak Street, Dallas, TX 75201',
            sellerName: 'John Smith',
            purchasePrice: 285000,
            status: 'executed',
            closingDate: new Date(Date.now() + 86400000 * 10).toISOString().split('T')[0],
            dateCreated: new Date(Date.now() - 86400000 * 2).toISOString()
        },
        {
            id: 2,
            propertyAddress: '789 Elm Drive, Austin, TX 78701',
            sellerName: 'Michael Davis',
            purchasePrice: 410000,
            status: 'active',
            closingDate: new Date(Date.now() + 86400000 * 15).toISOString().split('T')[0],
            dateCreated: new Date(Date.now() - 86400000 * 1).toISOString()
        }
    ];
    
    leads = sampleLeads;
    properties = sampleProperties;
    contracts = sampleContracts;
    
    saveData();
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
    
    // Update elements
    const activeLeadsEl = document.getElementById('activeLeads');
    const dealsClosedEl = document.getElementById('dealsClosedCount');
    const pendingEl = document.getElementById('pendingCount');
    const totalVolumeEl = document.getElementById('totalVolume');
    
    if (activeLeadsEl) activeLeadsEl.textContent = activeLeadsCount;
    if (dealsClosedEl) dealsClosedEl.textContent = dealsClosedCount;
    if (pendingEl) pendingEl.textContent = pendingCount;
    if (totalVolumeEl) totalVolumeEl.textContent = formatCurrency(totalVolume);
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

// Update leads table
function updateLeadsTable() {
    const tbody = document.getElementById('leadsTableBody');
    if (!tbody) return;
    
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

// Update contracts table
function updateContractsTable() {
    const tbody = document.getElementById('contractsTableBody');
    if (!tbody) return;
    
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

// Update properties grid
function updatePropertiesGrid() {
    const grid = document.getElementById('propertiesGrid');
    if (!grid) return;
    
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

// Update analytics
function updateAnalytics() {
    // Analytics are already updated in the HTML template
    // This could be expanded to include dynamic charts
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

function hideAllModals() {
    hideAddLeadModal();
    hideAddPropertyModal();
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
    alert('Contract generation feature would integrate with document templates. For demo purposes, this would create a professional purchase agreement.');
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