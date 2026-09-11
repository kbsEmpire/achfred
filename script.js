(function () {
    'use strict';

    // =============================================
    // Before/After Data Structure
    // =============================================
    const transformations = [
        {
            before: 'assets/images/before-1.jpg',
            after: 'assets/images/after-1.jpg'
        },
        {
            before: 'assets/images/before-2.jpg',
            after: 'assets/images/after-2.jpg'
        },
        {
            before: 'assets/images/before-3.jpg',
            after: 'assets/images/after-3.jpg'
        }
    ];

    const WHATSAPP_NUMBER = '233500940089';

    // =============================================
    // Mobile Navigation
    // =============================================
    const mobileToggle = document.getElementById('mobile-toggle');
    const mobileClose = document.getElementById('mobile-close');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileOverlay = document.getElementById('mobile-overlay');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');

    function openMobileMenu() {
        mobileMenu.classList.add('open');
        mobileOverlay.classList.add('visible');
        mobileMenu.setAttribute('aria-hidden', 'false');
        mobileOverlay.setAttribute('aria-hidden', 'false');
        mobileToggle.setAttribute('aria-expanded', 'true');
        document.body.style.overflow = 'hidden';
    }

    function closeMobileMenu() {
        mobileMenu.classList.remove('open');
        mobileOverlay.classList.remove('visible');
        mobileMenu.setAttribute('aria-hidden', 'true');
        mobileOverlay.setAttribute('aria-hidden', 'true');
        mobileToggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
    }

    if (mobileToggle) {
        mobileToggle.addEventListener('click', openMobileMenu);
    }

    if (mobileClose) {
        mobileClose.addEventListener('click', closeMobileMenu);
    }

    if (mobileOverlay) {
        mobileOverlay.addEventListener('click', closeMobileMenu);
    }

    mobileNavLinks.forEach(function (link) {
        link.addEventListener('click', closeMobileMenu);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && mobileMenu.classList.contains('open')) {
            closeMobileMenu();
        }
    });

    // =============================================
    // Sticky Header & Active Navigation
    // =============================================
    const siteHeader = document.getElementById('site-header');
    const navLinks = document.querySelectorAll('.nav-link[data-section]');
    const sections = document.querySelectorAll('section[id]');

    function updateHeader() {
        const scrollY = window.scrollY;
        if (scrollY > 60) {
            siteHeader.classList.add('scrolled');
        } else {
            siteHeader.classList.remove('scrolled');
        }
    }

    function updateActiveNav() {
        let current = '';
        const offset = siteHeader.offsetHeight + 20;

        sections.forEach(function (section) {
            const top = section.offsetTop - offset;
            const height = section.offsetHeight;
            if (window.scrollY >= top && window.scrollY < top + height) {
                current = section.getAttribute('id');
            }
        });

        navLinks.forEach(function (link) {
            link.classList.remove('active');
            if (link.getAttribute('data-section') === current) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', function () {
        updateHeader();
        updateActiveNav();
    }, { passive: true });

    updateHeader();

    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const target = document.querySelector(targetId);
            if (target) {
                e.preventDefault();
                const headerOffset = siteHeader.offsetHeight;
                const top = target.getBoundingClientRect().top + window.scrollY - headerOffset;
                window.scrollTo({ top: top, behavior: 'smooth' });
            }
        });
    });

    // =============================================
    // Scroll Reveal
    // =============================================
    const revealElements = document.querySelectorAll('.reveal');

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12,
            rootMargin: '0px 0px -40px 0px'
        });

        revealElements.forEach(function (el) {
            revealObserver.observe(el);
        });
    } else {
        revealElements.forEach(function (el) {
            el.classList.add('visible');
        });
    }

    // =============================================
    // Before/After Slider — Comparison Component
    // =============================================
    function createComparison(beforeSrc, afterSrc, index) {
        const slide = document.createElement('div');
        slide.className = 'slider-slide';
        slide.setAttribute('role', 'tabpanel');
        slide.setAttribute('aria-label', 'Transformation ' + (index + 1));

        slide.innerHTML =
            '<div class="comparison" data-comparison>' +
                '<img class="comparison-before" src="' + beforeSrc + '" alt="Before cleaning — transformation ' + (index + 1) + '" draggable="false">' +
                '<div class="comparison-after-wrap" data-after-wrap>' +
                    '<img class="comparison-after" src="' + afterSrc + '" alt="After cleaning — transformation ' + (index + 1) + '" draggable="false">' +
                '</div>' +
                '<div class="comparison-handle" data-handle>' +
                    '<div class="comparison-handle-btn" aria-hidden="true">' +
                        '<i class="fa-solid fa-chevron-left"></i>' +
                        '<i class="fa-solid fa-chevron-right"></i>' +
                    '</div>' +
                '</div>' +
                '<span class="comparison-label comparison-label-before">Before</span>' +
                '<span class="comparison-label comparison-label-after">After</span>' +
            '</div>';

        initComparison(slide.querySelector('[data-comparison]'));
        return slide;
    }

    function initComparison(container) {
        const afterWrap = container.querySelector('[data-after-wrap]');
        const handle = container.querySelector('[data-handle]');
        const afterImg = container.querySelector('.comparison-after');
        let isDragging = false;

        function setPosition(percent) {
            const clamped = Math.max(2, Math.min(98, percent));
            afterWrap.style.width = clamped + '%';
            handle.style.left = clamped + '%';
        }

        function updateAfterImageWidth() {
            afterImg.style.width = container.offsetWidth + 'px';
        }

        function getPercentFromEvent(e) {
            const rect = container.getBoundingClientRect();
            return ((e.clientX - rect.left) / rect.width) * 100;
        }

        container.addEventListener('pointerdown', function (e) {
            isDragging = true;
            container.setPointerCapture(e.pointerId);
            setPosition(getPercentFromEvent(e));
        });

        container.addEventListener('pointermove', function (e) {
            if (!isDragging) return;
            e.preventDefault();
            setPosition(getPercentFromEvent(e));
        });

        container.addEventListener('pointerup', function () {
            isDragging = false;
        });

        container.addEventListener('pointercancel', function () {
            isDragging = false;
        });

        updateAfterImageWidth();
        window.addEventListener('resize', updateAfterImageWidth);
        setPosition(50);
    }

    // =============================================
    // Carousel
    // =============================================
    const sliderTrack = document.getElementById('slider-track');
    const sliderPrev = document.getElementById('slider-prev');
    const sliderNext = document.getElementById('slider-next');
    const sliderDots = document.getElementById('slider-dots');
    const slideCurrent = document.getElementById('slide-current');
    const slideTotal = document.getElementById('slide-total');
    const sliderWrapper = document.getElementById('transformation-slider');

    let currentSlide = 0;
    let autoSlideTimer = null;
    let isPaused = false;
    let touchStartX = 0;
    let touchEndX = 0;

    if (sliderTrack && transformations.length) {
        slideTotal.textContent = String(transformations.length).padStart(2, '0');

        transformations.forEach(function (item, index) {
            sliderTrack.appendChild(createComparison(item.before, item.after, index));

            const dot = document.createElement('button');
            dot.className = 'slider-dot' + (index === 0 ? ' active' : '');
            dot.setAttribute('role', 'tab');
            dot.setAttribute('aria-label', 'Go to slide ' + (index + 1));
            dot.setAttribute('aria-selected', index === 0 ? 'true' : 'false');
            dot.addEventListener('click', function () {
                goToSlide(index);
                resetAutoSlide();
            });
            sliderDots.appendChild(dot);
        });

        function goToSlide(index) {
            currentSlide = ((index % transformations.length) + transformations.length) % transformations.length;
            sliderTrack.style.transform = 'translateX(-' + (currentSlide * 100) + '%)';
            slideCurrent.textContent = String(currentSlide + 1).padStart(2, '0');

            sliderDots.querySelectorAll('.slider-dot').forEach(function (dot, i) {
                dot.classList.toggle('active', i === currentSlide);
                dot.setAttribute('aria-selected', i === currentSlide ? 'true' : 'false');
            });
        }

        function nextSlide() {
            goToSlide(currentSlide + 1);
        }

        function prevSlide() {
            goToSlide(currentSlide - 1);
        }

        function startAutoSlide() {
            stopAutoSlide();
            autoSlideTimer = setInterval(function () {
                if (!isPaused) {
                    nextSlide();
                }
            }, 5000);
        }

        function stopAutoSlide() {
            if (autoSlideTimer) {
                clearInterval(autoSlideTimer);
                autoSlideTimer = null;
            }
        }

        function resetAutoSlide() {
            stopAutoSlide();
            startAutoSlide();
        }

        sliderPrev.addEventListener('click', function () {
            prevSlide();
            resetAutoSlide();
        });

        sliderNext.addEventListener('click', function () {
            nextSlide();
            resetAutoSlide();
        });

        if (sliderWrapper) {
            sliderWrapper.addEventListener('mouseenter', function () {
                isPaused = true;
            });

            sliderWrapper.addEventListener('mouseleave', function () {
                isPaused = false;
            });

            sliderWrapper.addEventListener('touchstart', function (e) {
                if (e.target.closest('[data-comparison]')) return;
                touchStartX = e.changedTouches[0].screenX;
                isPaused = true;
            }, { passive: true });

            sliderWrapper.addEventListener('touchend', function (e) {
                if (e.target.closest('[data-comparison]')) return;
                touchEndX = e.changedTouches[0].screenX;
                handleSwipe();
                isPaused = false;
                resetAutoSlide();
            }, { passive: true });
        }

        function handleSwipe() {
            const diff = touchStartX - touchEndX;
            if (Math.abs(diff) > 50) {
                if (diff > 0) {
                    nextSlide();
                } else {
                    prevSlide();
                }
            }
        }

        startAutoSlide();
    }

    // =============================================
    // Booking Form Validation
    // =============================================
    const bookingForm = document.getElementById('booking-form');
    const submitBtn = document.getElementById('submit-btn');
    const preferredDateInput = document.getElementById('preferred-date');

    const fields = {
        fullName: {
            input: document.getElementById('full-name'),
            error: document.getElementById('error-full-name'),
            message: 'Please enter your full name.'
        },
        phone: {
            input: document.getElementById('phone'),
            error: document.getElementById('error-phone'),
            message: 'Please enter your phone number.'
        },
        serviceType: {
            input: document.getElementById('service-type'),
            error: document.getElementById('error-service-type'),
            message: 'Please select a service type.'
        },
        location: {
            input: document.getElementById('location'),
            error: document.getElementById('error-location'),
            message: 'Please enter the property location.'
        },
        propertyType: {
            input: document.getElementById('property-type'),
            error: document.getElementById('error-property-type'),
            message: 'Please select a property type.'
        },
        preferredDate: {
            input: preferredDateInput,
            error: document.getElementById('error-preferred-date'),
            message: 'Please select a preferred date.'
        }
    };

    function setMinDate() {
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        preferredDateInput.min = year + '-' + month + '-' + day;
    }

    setMinDate();

    function validateField(key) {
        const field = fields[key];
        const value = field.input.value.trim();
        let isValid = true;

        if (key === 'phone') {
            isValid = value.length >= 9;
            field.error.textContent = isValid ? '' : 'Please enter a valid phone number.';
        } else if (key === 'preferredDate') {
            isValid = value !== '';
            if (isValid) {
                const selected = new Date(value + 'T00:00:00');
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                if (selected < today) {
                    isValid = false;
                    field.error.textContent = 'Please select a future date.';
                } else {
                    field.error.textContent = '';
                }
            } else {
                field.error.textContent = field.message;
            }
        } else {
            isValid = value !== '';
            field.error.textContent = isValid ? '' : field.message;
        }

        field.input.classList.toggle('error', !isValid);
        return isValid;
    }

    function validateForm() {
        let isValid = true;
        Object.keys(fields).forEach(function (key) {
            if (!validateField(key)) {
                isValid = false;
            }
        });
        return isValid;
    }

    Object.keys(fields).forEach(function (key) {
        fields[key].input.addEventListener('blur', function () {
            validateField(key);
        });

        fields[key].input.addEventListener('input', function () {
            if (fields[key].input.classList.contains('error')) {
                validateField(key);
            }
        });
    });

    // =============================================
    // WhatsApp Redirect
    // =============================================
    function buildWhatsAppMessage(data) {
        let message = 'Hello AchFred Elite Cleaning,\n\n';
        message += 'I would like to request a cleaning service.\n\n';
        message += 'Name: ' + data.fullName + '\n';
        message += 'Phone: ' + data.phone + '\n';
        message += 'Service: ' + data.serviceType + '\n';
        message += 'Location: ' + data.location + '\n';
        message += 'Property Type: ' + data.propertyType + '\n';
        message += 'Preferred Date: ' + data.preferredDate + '\n';

        if (data.note) {
            message += 'Note: ' + data.note + '\n';
        }

        message += '\nThank you.';
        return message;
    }

    if (bookingForm) {
        bookingForm.addEventListener('submit', function (e) {
            e.preventDefault();

            if (!validateForm()) {
                const firstError = bookingForm.querySelector('.error');
                if (firstError) {
                    firstError.focus();
                }
                return;
            }

            const formData = {
                fullName: fields.fullName.input.value.trim(),
                phone: fields.phone.input.value.trim(),
                serviceType: fields.serviceType.input.value,
                location: fields.location.input.value.trim(),
                propertyType: fields.propertyType.input.value,
                preferredDate: fields.preferredDate.input.value,
                note: document.getElementById('note').value.trim()
            };

            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Preparing WhatsApp... <i class="fa-brands fa-whatsapp" aria-hidden="true"></i>';

            const message = buildWhatsAppMessage(formData);
            const encodedMessage = encodeURIComponent(message);
            const whatsappUrl = 'https://wa.me/' + WHATSAPP_NUMBER + '?text=' + encodedMessage;

            window.location.href = whatsappUrl;
        });
    }

    // =============================================
    // Footer Year
    // =============================================
    const footerYear = document.getElementById('footer-year');
    if (footerYear) {
        footerYear.textContent = new Date().getFullYear();
    }

})();
