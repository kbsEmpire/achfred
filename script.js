(function () {
    'use strict';

    const WHATSAPP_NUMBER = '233500940089';

    // =============================================
    // Fallback Content (used when Supabase is unavailable)
    // =============================================
    const fallbackServices = [
        {
            service_number: 1,
            title: 'Residential Cleaning',
            description: 'Professional cleaning for homes, apartments, bedrooms, kitchens, bathrooms and everyday living spaces.',
            icon: 'fa-house',
            image_url: 'assets/images/service-residential.webp'
        },
        {
            service_number: 2,
            title: 'Commercial Cleaning',
            description: 'Cleaning solutions for offices, shops, workplaces and commercial environments.',
            icon: 'fa-building',
            image_url: 'assets/images/service-commercial.webp'
        },
        {
            service_number: 3,
            title: 'Deep Cleaning',
            description: 'Detailed cleaning for spaces requiring more intensive attention.',
            icon: 'fa-broom',
            image_url: 'assets/images/service-deep.webp'
        },
        {
            service_number: 4,
            title: 'Move-In / Move-Out Cleaning',
            description: 'Prepare a property for a new occupant or leave it ready for the next one.',
            icon: 'fa-box-open',
            image_url: 'assets/images/service-move.webp'
        },
        {
            service_number: 5,
            title: 'Post-Construction Cleaning',
            description: 'Detailed cleaning to remove construction dust, residue and debris from completed spaces.',
            icon: 'fa-hard-hat',
            image_url: 'assets/images/service-construction.webp'
        },
        {
            service_number: 6,
            title: 'Property & Office Maintenance',
            description: 'Routine cleaning support for spaces that need to remain consistently clean and presentable.',
            icon: 'fa-clipboard-check',
            image_url: 'assets/images/service-maintenance.webp'
        }
    ];

    const fallbackTransformations = [
        { before: 'assets/images/after-1.webp', after: 'assets/images/before-1.webp', title: 'Transformation 1' },
        { before: 'assets/images/after-2.webp', after: 'assets/images/before-2.webp', title: 'Transformation 2' },
        { before: 'assets/images/after-3.webp', after: 'assets/images/before-3.webp', title: 'Transformation 3' }
    ];

    let transformations = [];

    // =============================================
    // Supabase Client
    // =============================================
    let supabaseClient = null;

    function initSupabase() {
        if (typeof supabase !== 'undefined' &&
            typeof SUPABASE_URL !== 'undefined' &&
            typeof SUPABASE_ANON_KEY !== 'undefined' &&
            SUPABASE_URL !== 'YOUR_SUPABASE_PROJECT_URL' &&
            SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_PUBLISHABLE_KEY') {
            supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        }
        return supabaseClient;
    }

    // =============================================
    // Services — Dynamic Loading
    // =============================================
    const servicesGrid = document.getElementById('services-grid');

    function renderServiceSkeletons(count) {
        if (!servicesGrid) return;
        servicesGrid.innerHTML = '';
        for (let i = 0; i < count; i++) {
            const skeleton = document.createElement('article');
            skeleton.className = 'service-card-skeleton';
            skeleton.innerHTML =
                '<div class="skeleton-image"></div>' +
                '<div class="skeleton-body">' +
                    '<div class="skeleton-icon"></div>' +
                    '<div class="skeleton-line title"></div>' +
                    '<div class="skeleton-line"></div>' +
                    '<div class="skeleton-line"></div>' +
                    '<div class="skeleton-line short"></div>' +
                '</div>';
            servicesGrid.appendChild(skeleton);
        }
    }

    function createServiceCard(service, index) {
        const num = String(service.service_number || (index + 1)).padStart(2, '0');
        const iconClass = service.icon || 'fa-broom';
        const card = document.createElement('article');
        card.className = 'service-card reveal fade-in';
        card.innerHTML =
            '<span class="service-num">' + num + '</span>' +
            '<div class="service-card-image">' +
                '<img src="' + service.image_url + '" alt="' + service.title + '" loading="lazy">' +
            '</div>' +
            '<div class="service-card-body">' +
                '<div class="service-icon"><i class="fa-solid ' + iconClass + '" aria-hidden="true"></i></div>' +
                '<h3>' + service.title + '</h3>' +
                '<p>' + service.description + '</p>' +
                '<a href="#booking" class="service-link">Explore <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
            '</div>';
        return card;
    }

    function renderServices(services) {
        if (!servicesGrid) return;
        servicesGrid.innerHTML = '';

        services.forEach(function (service, index) {
            servicesGrid.appendChild(createServiceCard(service, index));
        });

        observeRevealElements(servicesGrid.querySelectorAll('.reveal'));
    }

    async function loadServices() {
        renderServiceSkeletons(6);

        if (!supabaseClient) {
            renderServices(fallbackServices);
            return;
        }

        try {
            const { data, error } = await supabaseClient
                .from('services')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                renderServices(data);
            } else {
                renderServices(fallbackServices);
            }
        } catch (err) {
            console.error('Failed to load services:', err);
            renderServices(fallbackServices);
        }
    }

    // =============================================
    // Before/After — Dynamic Loading
    // =============================================
    async function loadTransformations() {
        if (!supabaseClient) {
            return fallbackTransformations;
        }

        try {
            const { data, error } = await supabaseClient
                .from('before_after')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true });

            if (error) throw error;

            if (data && data.length > 0) {
                return data.map(function (item) {
                    return {
                        before: item.before_image_url,
                        after: item.after_image_url,
                        title: item.title || ''
                    };
                });
            }
        } catch (err) {
            console.error('Failed to load transformations:', err);
        }

        return fallbackTransformations;
    }

    function showSliderSkeleton() {
        const sliderTrack = document.getElementById('slider-track');
        if (sliderTrack) {
            sliderTrack.innerHTML = '<div class="slider-slide"><div class="slider-skeleton"></div></div>';
        }
    }

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
    let revealObserver = null;

    function observeRevealElements(elements) {
        if (!elements || !elements.length) return;

        if ('IntersectionObserver' in window) {
            if (!revealObserver) {
                revealObserver = new IntersectionObserver(function (entries) {
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
            }
            elements.forEach(function (el) {
                revealObserver.observe(el);
            });
        } else {
            elements.forEach(function (el) {
                el.classList.add('visible');
            });
        }
    }

    observeRevealElements(document.querySelectorAll('.reveal'));

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

    function initSlider(slides) {
        if (!sliderTrack || !slides.length) return;

        transformations = slides;
        sliderTrack.innerHTML = '';
        sliderDots.innerHTML = '';

        slideTotal.textContent = String(slides.length).padStart(2, '0');

        slides.forEach(function (item, index) {
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

        currentSlide = 0;
        sliderTrack.style.transform = 'translateX(0)';
        slideCurrent.textContent = '01';
        startAutoSlide();
    }

    function goToSlide(index) {
        if (!transformations.length) return;
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

    if (sliderTrack) {
        showSliderSkeleton();

        if (sliderPrev) {
            sliderPrev.addEventListener('click', function () {
                prevSlide();
                resetAutoSlide();
            });
        }

        if (sliderNext) {
            sliderNext.addEventListener('click', function () {
                nextSlide();
                resetAutoSlide();
            });
        }

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
    }

    async function initDynamicContent() {
        initSupabase();
        await loadServices();
        const slides = await loadTransformations();
        initSlider(slides);
    }

    initDynamicContent();

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
