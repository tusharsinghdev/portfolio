// Performance optimized portfolio script
(function() {
    'use strict';

    // Cache DOM elements
    const scrollProgress = document.querySelector('.scroll-progress');
    const header = document.querySelector('header');
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Throttle function for performance
    function throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        }
    }

    // Optimized scroll handler
    const handleScroll = throttle(() => {
        const scrollY = window.pageYOffset;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        
        // Update progress bar
        if (scrollProgress) {
            const scrollPercentage = Math.min(100, (scrollY / scrollHeight) * 100);
            scrollProgress.style.width = scrollPercentage + '%';
        }
        
        // Update header style
        if (header) {
            if (scrollY > 100) {
                header.style.background = 'rgba(255, 255, 255, 0.95)';
                header.style.borderBottomColor = 'rgba(229, 231, 235, 0.8)';
            } else {
                header.style.background = 'rgba(255, 255, 255, 0.9)';
                header.style.borderBottomColor = 'var(--border)';
            }
        }
    }, 16);

    // Mobile menu toggle
    if (mobileToggle && navLinks) {
        mobileToggle.addEventListener('click', () => {
            try {
                navLinks.classList.toggle('active');
                const spans = mobileToggle.querySelectorAll('span');
                const isActive = navLinks.classList.contains('active');
                
                spans[0].style.transform = isActive ? 'rotate(45deg) translate(5px, 5px)' : 'none';
                spans[1].style.opacity = isActive ? '0' : '1';
                spans[2].style.transform = isActive ? 'rotate(-45deg) translate(7px, -6px)' : 'none';
            } catch (error) {
                console.error('Error toggling mobile menu:', error);
            }
        });
    }

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            try {
                const target = document.querySelector(this.getAttribute('href'));
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 80;
                    const targetPosition = target.offsetTop - headerHeight;
                    window.scrollTo({ top: targetPosition, behavior: 'smooth' });
                    
                    // Close mobile menu if open
                    if (navLinks && navLinks.classList.contains('active')) {
                        navLinks.classList.remove('active');
                        const spans = mobileToggle.querySelectorAll('span');
                        spans[0].style.transform = 'none';
                        spans[1].style.opacity = '1';
                        spans[2].style.transform = 'none';
                    }
                }
            } catch (error) {
                console.error('Error scrolling to target:', error);
            }
        });
    });

    // Intersection Observer for animations
    const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, observerOptions);

    // Observe fade-in elements
    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

    // Enhanced project card interactions
    document.querySelectorAll('.project-card').forEach(card => {
        card.addEventListener('click', function (e) {
            if (e.target.tagName === 'A' || e.target.closest('a')) return;
            this.style.transform = 'translateY(-4px) scale(1.02)';
            setTimeout(() => { this.style.transform = 'translateY(-4px) scale(1)'; }, 200);
        });
    });

    // Parallax effect for profile card (optimized)
    const profileCard = document.querySelector('.profile-card');
    if (profileCard) {
        const handleParallax = throttle(() => {
            const scrolled = window.pageYOffset;
            profileCard.style.transform = `translateY(${scrolled * 0.05}px)`; // Reduced multiplier for subtlety
        }, 16);
        window.addEventListener('scroll', handleParallax, { passive: true });
    }

    // Skills animation
    const skillItems = document.querySelectorAll('.skill-item');
    if (skillItems.length > 0) {
        const skillObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const skillLevel = entry.target.querySelector('.skill-level');
                    if (skillLevel) {
                        skillLevel.style.opacity = '0';
                        setTimeout(() => {
                            skillLevel.style.opacity = '1';
                            skillLevel.style.transform = 'translateX(0)';
                        }, Math.random() * 300 + 100); // Reduced max delay
                    }
                }
            });
        });
        
        skillItems.forEach(item => {
            const skillLevel = item.querySelector('.skill-level');
            if (skillLevel) {
                skillLevel.style.transform = 'translateX(20px)';
                skillLevel.style.transition = 'all 0.6s ease';
                skillObserver.observe(item);
            }
        });
    }

    // Project link loading animation
    document.querySelectorAll('.project-link').forEach(link => {
        link.addEventListener('click', function (e) {
            if (this.href === '#') {
                e.preventDefault();
                const originalText = this.textContent;
                this.textContent = 'Loading...';
                this.style.pointerEvents = 'none';
                setTimeout(() => {
                    this.textContent = originalText;
                    this.style.pointerEvents = 'auto';
                }, 1500); // Reduced timeout
            }
        });
    });

    // Event listeners with error handling
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Prevent layout shift on initial load
    document.addEventListener('DOMContentLoaded', () => {
        handleScroll(); // Set initial header state
    });

})();
