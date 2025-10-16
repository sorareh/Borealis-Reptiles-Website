// Password Protection System
const CORRECT_PASSWORD = 'duncan';

// Check if user is already authenticated
function checkAuthentication() {
    return sessionStorage.getItem('authenticated') === 'true';
}

// Show password modal
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const siteContent = document.querySelector('.site-content');
    
    if (modal && siteContent) {
        modal.style.display = 'flex';
        siteContent.classList.add('blurred');
    }
}

// Hide password modal
function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const siteContent = document.querySelector('.site-content');
    
    if (modal && siteContent) {
        modal.style.display = 'none';
        siteContent.classList.remove('blurred');
    }
}

// Validate password
function validatePassword(password) {
    return password === CORRECT_PASSWORD;
}

// Show error message
function showErrorMessage(message) {
    const errorDiv = document.getElementById('errorMessage');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.classList.remove('hidden');
        
        // Hide error after 3 seconds
        setTimeout(() => {
            errorDiv.classList.add('hidden');
        }, 3000);
    }
}

// Handle password submission
function handlePasswordSubmit() {
    const passwordInput = document.getElementById('passwordInput');
    const password = passwordInput.value.trim();
    
    if (validatePassword(password)) {
        // Store authentication in session storage
        sessionStorage.setItem('authenticated', 'true');
        hidePasswordModal();
    } else {
        showErrorMessage('Incorrect password. Please try again.');
        passwordInput.value = '';
        passwordInput.focus();
    }
}

// Initialize password protection
function initPasswordProtection() {
    // Check if already authenticated
    if (checkAuthentication()) {
        hidePasswordModal();
        return;
    }
    
    // Show password modal
    showPasswordModal();
    
    // Add event listeners
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmit = document.getElementById('passwordSubmit');
    
    if (passwordInput && passwordSubmit) {
        // Handle submit button click
        passwordSubmit.addEventListener('click', handlePasswordSubmit);
        
        // Handle Enter key press
        passwordInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                handlePasswordSubmit();
            }
        });
        
        // Focus on input
        passwordInput.focus();
    }
}

// Sample data for baby snakes from breeding pairs
const babyData = {
    pair1: {
        parents: "Nagini (Pastel) × Opal (Mojave)",
        genetics: "Pastel × Mojave",
        babies: [
            {
                code: "NAOP01",
                gene: "Pastel Mojave",
                price: 250,
                image: "imgs/snakes/amber.jpg",
                sold: false
            },
            {
                code: "NAOP02",
                gene: "Pastel",
                price: 150,
                image: "imgs/snakes/emerald.jpg",
                sold: false
            },
            {
                code: "NAOP03",
                gene: "Mojave",
                price: 200,
                image: "imgs/snakes/jasper.jpg",
                sold: true
            },
            {
                code: "NAOP04",
                gene: "Normal",
                price: 100,
                image: "imgs/snakes/opal.jpg",
                sold: false
            }
        ]
    },
    pair2: {
        parents: "Nagini (Pastel) × Axinite (Spider)",
        genetics: "Pastel × Spider",
        babies: [
            {
                code: "NAAX01",
                gene: "Pastel Spider",
                price: 300,
                image: "imgs/snakes/quartize.jpg",
                sold: false
            },
            {
                code: "NAAX02",
                gene: "Pastel",
                price: 150,
                image: "imgs/snakes/zoiste .jpg",
                sold: false
            },
            {
                code: "NAAX03",
                gene: "Spider",
                price: 180,
                image: "imgs/snakes/back1.jpg",
                sold: true
            },
            {
                code: "NAAX04",
                gene: "Normal",
                price: 100,
                image: "imgs/snakes/amber.jpg",
                sold: false
            }
        ]
    },
    pair3: {
        parents: "Jasper (Pinstripe) × Peridot (Mojave)",
        genetics: "Pinstripe × Mojave",
        babies: [
            {
                code: "JAPE01",
                gene: "Pinstripe Mojave",
                price: 320,
                image: "imgs/snakes/emerald.jpg",
                sold: false
            },
            {
                code: "JAPE02",
                gene: "Pinstripe",
                price: 220,
                image: "imgs/snakes/jasper.jpg",
                sold: false
            },
            {
                code: "JAPE03",
                gene: "Mojave",
                price: 200,
                image: "imgs/snakes/quartize.jpg",
                sold: false
            },
            {
                code: "JAPE04",
                gene: "Normal",
                price: 100,
                image: "imgs/snakes/opal.jpg",
                sold: true
            }
        ]
    }
};

// Navigation functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize password protection first
    initPasswordProtection();
    
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');

    // Tab switching
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetTab = this.getAttribute('data-tab');
            
            // Remove active class from all links and tabs
            navLinks.forEach(l => l.classList.remove('active'));
            tabContents.forEach(tab => tab.classList.remove('active'));
            
            // Add active class to clicked link and corresponding tab
            this.classList.add('active');
            document.getElementById(targetTab).classList.add('active');
            
            // Close mobile menu if open
            navMenu.classList.remove('active');
        });
    });

    // Mobile menu toggle
    hamburger.addEventListener('click', function() {
        navMenu.classList.toggle('active');
    });

    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!hamburger.contains(e.target) && !navMenu.contains(e.target)) {
            navMenu.classList.remove('active');
        }
    });
});

// Function to show tab (used by CTA button)
function showTab(tabName) {
    const navLinks = document.querySelectorAll('.nav-link');
    const tabContents = document.querySelectorAll('.tab-content');
    
    // Remove active class from all links and tabs
    navLinks.forEach(l => l.classList.remove('active'));
    tabContents.forEach(tab => tab.classList.remove('active'));
    
    // Add active class to target link and tab
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    document.getElementById(tabName).classList.add('active');
}

// Function to show babies modal
function showBabies(pairId) {
    const modal = document.getElementById('babyModal');
    const modalTitle = document.getElementById('modalTitle');
    const babyGrid = document.getElementById('babyGrid');
    
    const pairData = babyData[pairId];
    if (!pairData) return;
    
    // Set modal title
    modalTitle.textContent = `${pairData.parents} - Available Offspring`;
    
    // Clear existing baby cards
    babyGrid.innerHTML = '';
    
    // Create baby cards
    pairData.babies.forEach(baby => {
        const babyCard = document.createElement('div');
        babyCard.className = `baby-card ${baby.sold ? 'sold' : ''}`;
        babyCard.style.position = 'relative';
        
        babyCard.innerHTML = `
            <div class="baby-image">
                <img src="${baby.image}" alt="${baby.gene} Ball Python">
            </div>
            <div class="baby-code">${baby.code}</div>
            <div class="baby-gene">${baby.gene} Ball Python</div>
            <div class="baby-price ${baby.sold ? 'sold' : ''}">
                ${baby.sold ? 'SOLD' : `$${baby.price}`}
            </div>
        `;
        
        babyGrid.appendChild(babyCard);
    });
    
    // Show modal
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// Function to close modal
function closeModal() {
    const modal = document.getElementById('babyModal');
    modal.style.display = 'none';
    document.body.style.overflow = 'auto';
}

// Close modal when clicking outside of it
window.addEventListener('click', function(e) {
    const modal = document.getElementById('babyModal');
    if (e.target === modal) {
        closeModal();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
        closeModal();
    }
});

// Smooth scrolling for anchor links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Add loading animation for images
document.addEventListener('DOMContentLoaded', function() {
    const images = document.querySelectorAll('img');
    images.forEach(img => {
        img.addEventListener('load', function() {
            this.style.opacity = '1';
        });
        img.style.opacity = '0';
        img.style.transition = 'opacity 0.3s ease';
    });
});

// Add hover effects for interactive elements
document.addEventListener('DOMContentLoaded', function() {
    // Add ripple effect to buttons
    const buttons = document.querySelectorAll('.cta-button, .nav-link');
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.width = ripple.style.height = size + 'px';
            ripple.style.left = x + 'px';
            ripple.style.top = y + 'px';
            ripple.classList.add('ripple');
            
            this.appendChild(ripple);
            
            setTimeout(() => {
                ripple.remove();
            }, 600);
        });
    });
});

// Contact form functionality
function toggleFormFields() {
    const inquiryType = document.getElementById('inquiryType').value;
    const questionFields = document.getElementById('questionFields');
    const buyRequestFields = document.getElementById('buyRequestFields');
    
    // Hide all conditional fields first
    questionFields.style.display = 'none';
    buyRequestFields.style.display = 'none';
    
    // Clear conditional field values
    document.getElementById('question').value = '';
    document.getElementById('snakeCode').value = '';
    document.getElementById('address').value = '';
    document.getElementById('additionalDetails').value = '';
    
    // Show relevant fields based on selection
    if (inquiryType === 'question') {
        questionFields.style.display = 'block';
        document.getElementById('question').required = true;
        document.getElementById('snakeCode').required = false;
        document.getElementById('address').required = false;
    } else if (inquiryType === 'buyRequest') {
        buyRequestFields.style.display = 'block';
        document.getElementById('question').required = false;
        document.getElementById('snakeCode').required = true;
        document.getElementById('address').required = true;
    } else {
        document.getElementById('question').required = false;
        document.getElementById('snakeCode').required = false;
        document.getElementById('address').required = false;
    }
}

// Form submission handling
document.addEventListener('DOMContentLoaded', function() {
    const contactForm = document.getElementById('contactForm');
    
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(contactForm);
            const inquiryType = formData.get('inquiryType');
            
            // Validate form based on inquiry type
            if (inquiryType === 'question') {
                if (!formData.get('question').trim()) {
                    alert('Please enter your question.');
                    return;
                }
            } else if (inquiryType === 'buyRequest') {
                if (!formData.get('snakeCode').trim()) {
                    alert('Please enter the snake code.');
                    return;
                }
                if (!formData.get('address').trim()) {
                    alert('Please enter your shipping address.');
                    return;
                }
            }
            
            // Simulate form submission
            const submitBtn = contactForm.querySelector('.submit-btn');
            const originalText = submitBtn.innerHTML;
            
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
            submitBtn.disabled = true;
            
            setTimeout(() => {
                alert('Thank you for your message! We will get back to you within 24 hours.');
                contactForm.reset();
                toggleFormFields(); // Reset conditional fields
                submitBtn.innerHTML = originalText;
                submitBtn.disabled = false;
            }, 2000);
        });
    }
});

// Add CSS for ripple effect
const style = document.createElement('style');
style.textContent = `
    .ripple {
        position: absolute;
        border-radius: 50%;
        background: rgba(255, 255, 255, 0.3);
        transform: scale(0);
        animation: ripple-animation 0.6s linear;
        pointer-events: none;
    }
    
    @keyframes ripple-animation {
        to {
            transform: scale(4);
            opacity: 0;
        }
    }
    
    .cta-button, .nav-link {
        position: relative;
        overflow: hidden;
    }
`;
document.head.appendChild(style);
