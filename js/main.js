// Main JavaScript for Enriched Properties LLC public site

// DOM Content Loaded
document.addEventListener('DOMContentLoaded', function() {
    // Initialize the application
    initializeApp();
    
    // Add smooth scrolling for navigation links
    addSmoothScrolling();
    
    // Add form handling
    setupFormHandling();
    
    // Add mobile menu functionality
    setupMobileMenu();
});

// Initialize application
function initializeApp() {
    // Check if user is already logged in
    if (localStorage.getItem('enrichedPropsAuth') === 'true') {
        // Redirect to dashboard if already authenticated
        // Only redirect if we're not already on dashboard
        if (!window.location.pathname.includes('dashboard.html')) {
            showSuccessMessage('Welcome back! Redirecting to dashboard...');
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        }
    }
    
    // Add loading states to buttons
    addButtonLoadingStates();
}

// Smooth scrolling for navigation
function addSmoothScrolling() {
    const navLinks = document.querySelectorAll('a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href').substring(1);
            const targetElement = document.getElementById(targetId);
            
            if (targetElement) {
                const headerOffset = 80; // Account for fixed header
                const elementPosition = targetElement.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
}

// Form handling
function setupFormHandling() {
    const contactForm = document.querySelector('#contact form');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            handleContactForm(this);
        });
    }
}

// Handle contact form submission
function handleContactForm(form) {
    const formData = new FormData(form);
    const submitButton = form.querySelector('button[type="submit"]');
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="spinner"></span>Processing...';
    submitButton.disabled = true;
    
    // Simulate form processing (in real implementation, this would send to a server)
    setTimeout(() => {
        // Store lead information locally for demo purposes
        const leadData = {
            id: Date.now(),
            firstName: form.querySelector('input[placeholder="John"]').value,
            lastName: form.querySelector('input[placeholder="Doe"]').value,
            phone: form.querySelector('input[placeholder="(555) 123-4567"]').value,
            email: form.querySelector('input[placeholder="john@example.com"]').value,
            propertyAddress: form.querySelector('input[placeholder="123 Main St, City, State 12345"]').value,
            notes: form.querySelector('textarea').value,
            source: 'Website Form',
            status: 'new',
            dateAdded: new Date().toISOString(),
            estimatedValue: 0
        };
        
        // Store lead in local storage
        storeLead(leadData);
        
        // Show success message
        showSuccessMessage('Thank you! We\'ve received your information and will contact you within 24 hours with a competitive cash offer.');
        
        // Reset form
        form.reset();
        
        // Reset button
        submitButton.innerHTML = originalText;
        submitButton.disabled = false;
        
    }, 2000);
}

// Store lead in cloud storage
async function storeLead(leadData) {
    try {
        // Load existing leads
        let leads = await CloudStorage.loadData('Leads', []);
        leads.push(leadData);
        
        // Save to cloud storage
        await CloudStorage.saveData('Leads', leads);
        
        console.log('Lead stored successfully in cloud');
    } catch (error) {
        console.error('Error storing lead:', error);
        // Fallback to localStorage
        let leads = JSON.parse(localStorage.getItem('enrichedPropsLeads') || '[]');
        leads.push(leadData);
        localStorage.setItem('enrichedPropsLeads', JSON.stringify(leads));
    }
}

// Mobile menu functionality
function setupMobileMenu() {
    // Add mobile menu toggle if needed
    const nav = document.querySelector('nav');
    const navItems = nav.querySelector('.flex.items-center.space-x-8');
    
    // Check if screen is mobile size
    if (window.innerWidth <= 768) {
        addMobileMenuToggle(nav, navItems);
    }
    
    // Handle window resize
    window.addEventListener('resize', function() {
        if (window.innerWidth <= 768) {
            if (!nav.querySelector('.mobile-menu-toggle')) {
                addMobileMenuToggle(nav, navItems);
            }
        } else {
            const toggle = nav.querySelector('.mobile-menu-toggle');
            if (toggle) {
                toggle.remove();
                navItems.classList.remove('hidden');
            }
        }
    });
}

// Add mobile menu toggle
function addMobileMenuToggle(nav, navItems) {
    const toggle = document.createElement('button');
    toggle.className = 'mobile-menu-toggle md:hidden text-gray-700 hover:text-secondary';
    toggle.innerHTML = `
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
        </svg>
    `;
    
    toggle.addEventListener('click', function() {
        navItems.classList.toggle('hidden');
        navItems.classList.toggle('mobile-menu-open');
        
        if (navItems.classList.contains('mobile-menu-open')) {
            navItems.className = 'mobile-menu-open absolute top-16 left-0 right-0 bg-white shadow-lg p-4 flex flex-col space-y-4';
        }
    });
    
    nav.querySelector('.flex.justify-between').appendChild(toggle);
    navItems.classList.add('hidden');
}

// Login modal functions
function showLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.remove('hidden');
        document.body.style.overflow = 'hidden'; // Prevent background scrolling
        
        // Focus on username field
        setTimeout(() => {
            const usernameField = document.getElementById('username');
            if (usernameField) {
                usernameField.focus();
            }
        }, 100);
    }
}

function hideLoginModal() {
    const modal = document.getElementById('loginModal');
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto'; // Restore scrolling
        
        // Clear form
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
    }
}

// Login function
function login(event) {
    event.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const submitButton = event.target.querySelector('button[type="submit"]');
    
    // Show loading state
    const originalText = submitButton.textContent;
    submitButton.innerHTML = '<span class="spinner"></span>Authenticating...';
    submitButton.disabled = true;
    
    // Simple authentication (in production, this would be server-side)
    setTimeout(() => {
        if (username === 'admin' && password === 'enriched2024') {
            // Set authentication flag
            localStorage.setItem('enrichedPropsAuth', 'true');
            localStorage.setItem('enrichedPropsUser', username);
            
            showSuccessMessage('Login successful! Redirecting to dashboard...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            showErrorMessage('Invalid username or password. Try: admin / enriched2024');
            
            // Reset button
            submitButton.innerHTML = originalText;
            submitButton.disabled = false;
        }
    }, 1500);
}

// Logout function
function logout() {
    localStorage.removeItem('enrichedPropsAuth');
    localStorage.removeItem('enrichedPropsUser');
    showSuccessMessage('Logged out successfully. Redirecting...');
    
    setTimeout(() => {
        window.location.href = 'index.html';
    }, 1500);
}

// Button loading states
function addButtonLoadingStates() {
    const buttons = document.querySelectorAll('button, .btn');
    
    buttons.forEach(button => {
        button.addEventListener('click', function() {
            if (!this.disabled && !this.classList.contains('no-loading')) {
                const originalText = this.textContent;
                
                // Add loading class if button has specific action
                if (this.type === 'submit' || this.classList.contains('action-btn')) {
                    this.style.position = 'relative';
                    this.style.pointerEvents = 'none';
                }
            }
        });
    });
}

// Utility functions
function showSuccessMessage(message) {
    showMessage(message, 'success');
}

function showErrorMessage(message) {
    showMessage(message, 'error');
}

function showMessage(message, type) {
    // Remove existing messages
    const existingMessages = document.querySelectorAll('.alert-message');
    existingMessages.forEach(msg => msg.remove());
    
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `alert-message fixed top-20 right-4 z-50 p-4 rounded-lg shadow-lg max-w-md ${
        type === 'success' ? 'bg-green-100 border border-green-300 text-green-700' : 'bg-red-100 border border-red-300 text-red-700'
    }`;
    messageEl.innerHTML = `
        <div class="flex items-center">
            <span class="mr-2">${type === 'success' ? '✅' : '❌'}</span>
            <span>${message}</span>
            <button onclick="this.parentElement.parentElement.remove()" class="ml-auto text-lg leading-none">&times;</button>
        </div>
    `;
    
    // Add to page
    document.body.appendChild(messageEl);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
        if (messageEl && messageEl.parentElement) {
            messageEl.remove();
        }
    }, 5000);
    
    // Add animation
    messageEl.style.transform = 'translateX(100%)';
    messageEl.style.transition = 'transform 0.3s ease-out';
    
    setTimeout(() => {
        messageEl.style.transform = 'translateX(0)';
    }, 10);
}

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(amount);
}

// Format phone number
function formatPhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
    if (match) {
        return `(${match[1]}) ${match[2]}-${match[3]}`;
    }
    return phone;
}

// Validate email
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

// Validate phone
function validatePhone(phone) {
    const cleaned = phone.replace(/\D/g, '');
    return cleaned.length === 10;
}

// Animation observer for scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-in');
        }
    });
}, observerOptions);

// Observe elements for animation
document.addEventListener('DOMContentLoaded', function() {
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));
});

// Export functions for use in other files
window.EnrichedProps = {
    showLoginModal,
    hideLoginModal,
    login,
    logout,
    showSuccessMessage,
    showErrorMessage,
    formatCurrency,
    formatPhoneNumber,
    validateEmail,
    validatePhone,
    storeLead
};
