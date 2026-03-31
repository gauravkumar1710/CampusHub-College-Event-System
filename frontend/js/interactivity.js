/**
 * CampusHub Interactivity & Micro-Animations
 * Enhances the premium feel of the application
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavbarScrollEffect();
    initRippleEffect();
});

/**
 * Initializes Intersection Observer to fade/slide in elements as they enter the viewport
 */
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.15
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate-visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Select elements to animate
    const animateElements = document.querySelectorAll('.animate-on-scroll');
    animateElements.forEach(el => observer.observe(el));
}

/**
 * Adds a glassmorphism blur effect to the navbar when the user scrolls down
 */
function initNavbarScrollEffect() {
    const nav = document.querySelector('.home-nav');
    if (!nav) return;

    window.addEventListener('scroll', () => {
        if (window.scrollY > 20) {
            nav.classList.add('nav-scrolled');
        } else {
            nav.classList.remove('nav-scrolled');
        }
    });
}

/**
 * Adds a Material Design style ripple effect to buttons on click
 */
function initRippleEffect() {
    const buttons = document.querySelectorAll('.btn-primary, .btn-explore, .btn-create, .btn-teal, .btn-purple-sm, .btn-submit-panel, .btn-nav-register');
    
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            // Prevent adding multiple ripples quickly if not needed, but typical implementations allow it
            const x = e.clientX - e.target.getBoundingClientRect().left;
            const y = e.clientY - e.target.getBoundingClientRect().top;
            
            const ripples = document.createElement('span');
            ripples.style.left = x + 'px';
            ripples.style.top = y + 'px';
            ripples.classList.add('ripple-wave');
            this.appendChild(ripples);
            
            setTimeout(() => {
                ripples.remove();
            }, 600);
        });
    });
}

/**
 * Premium Toast Notifications using SweetAlert2
 * Replaces the default `showAlert` logic dynamically if SweetAlert is loaded
 */
function showPremiumToast(type, message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    // Map bootstrap variant "danger" to standard "danger" class
    const toastType = type === 'error' ? 'danger' : type;
    toast.className = `custom-toast ${toastType}`;
    
    let iconClass = 'bi-info-circle-fill';
    if (toastType === 'success') iconClass = 'bi-check-circle-fill';
    if (toastType === 'danger') iconClass = 'bi-exclamation-circle-fill';
    if (toastType === 'warning') iconClass = 'bi-exclamation-triangle-fill';

    toast.innerHTML = `
        <i class="bi ${iconClass}"></i>
        <div class="toast-content">${message}</div>
    `;

    container.appendChild(toast);

    // Trigger slide-in animation
    setTimeout(() => toast.classList.add('show'), 10);

    // Auto remove after 3.5s
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); // match css transition duration
    }, 3500);
}
