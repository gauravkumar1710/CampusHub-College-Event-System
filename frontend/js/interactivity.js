/**
 * CampusHub Interactivity & Micro-Animations
 * Enhances the premium feel of the application
 */

document.addEventListener('DOMContentLoaded', () => {
    initScrollAnimations();
    initNavbarScrollEffect();
    initRippleEffect();
    initMagneticButtons();
    initNumberCounters();
});

/**
 * Initializes Intersection Observer to fade/slide in elements as they enter the viewport
 */
let globalScrollObserver = null;
function initScrollAnimations() {
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    globalScrollObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    observeNewElements();
}

function observeNewElements() {
    if (!globalScrollObserver) return;
    const animateElements = document.querySelectorAll('.animate-slide-up:not(.visible)');
    animateElements.forEach(el => globalScrollObserver.observe(el));
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

/**
 * Magnetic button interaction
 */
function initMagneticButtons() {
    const buttons = document.querySelectorAll('.btn-magnetic');
    buttons.forEach(btn => {
        btn.addEventListener('mousemove', (e) => {
            const rect = btn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Subtle pull
            btn.style.transform = `translate(${x * 0.15}px, ${y * 0.15}px)`;
        });
        
        btn.addEventListener('mouseleave', () => {
            btn.style.transform = `translate(0px, 0px)`;
        });
    });
}

/**
 * Animated number counters for statistics
 */
function initNumberCounters() {
    const counters = document.querySelectorAll('.stat-num');
    const speed = 40;

    counters.forEach(counter => {
        const targetText = counter.innerText.replace(/,/g, '').replace(/%/g, '');
        const target = parseFloat(targetText);
        if (isNaN(target)) return;

        const isPercentage = counter.innerText.includes('%');
        
        counter.innerText = '0';
        counter.setAttribute('data-target', target);
        
        const updateCount = () => {
            const finalTarget = parseFloat(counter.getAttribute('data-target'));
            const count = parseFloat(counter.innerText.replace(/,/g, '').replace(/%/g, ''));
            
            const inc = finalTarget / speed;
            
            if (count < finalTarget) {
                let current = count + inc;
                if (isPercentage) {
                    counter.innerText = current.toFixed(1) + '%';
                } else {
                    counter.innerText = Math.ceil(current).toLocaleString();
                }
                setTimeout(updateCount, 25);
            } else {
                if (isPercentage) {
                    counter.innerText = finalTarget.toFixed(1) + '%';
                } else {
                    counter.innerText = Math.ceil(finalTarget).toLocaleString();
                }
            }
        };

        // Delay execution to allow slide-up animation entry
        setTimeout(updateCount, 400);
    });
}
