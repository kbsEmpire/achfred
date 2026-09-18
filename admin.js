(function () {
    'use strict';

    // =============================================
    // Supabase Client
    // =============================================
    let supabaseClient = null;

    function initSupabase() {
        if (typeof supabase === 'undefined') {
            console.error('Supabase library not loaded');
            return null;
        }
        if (!SUPABASE_URL || !SUPABASE_ANON_KEY ||
            SUPABASE_URL === "" ||
            SUPABASE_ANON_KEY === "") {
            console.error('Supabase credentials not configured');
            const info = document.getElementById('login-info');
            if(info) info.textContent = 'Supabase is not configured. Update supabase-config.js.';
            return null;
        }
        supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        return supabaseClient;
    }

    // =============================================
    // DOM References
    // =============================================
    const loginScreen = document.getElementById('login-screen');
    const adminApp = document.getElementById('admin-app');
    const loginForm = document.getElementById('login-form');
    const loginEmail = document.getElementById('login-email');
    const loginPassword = document.getElementById('login-password');
    const loginBtn = document.getElementById('login-btn');
    const loginError = document.getElementById('login-error');
    const loginInfo = document.getElementById('login-info');
    const sidebarLogout = document.getElementById('sidebar-logout');
    const headerLogout = document.getElementById('header-logout');
    const servicesList = document.getElementById('services-list');
    const transformationsList = document.getElementById('transformations-list');
    const servicesError = document.getElementById('services-error');
    const transformationsError = document.getElementById('transformations-error');
    const servicesRetry = document.getElementById('services-retry');
    const transformationsRetry = document.getElementById('transformations-retry');
    const summaryServices = document.getElementById('summary-services');
    const summaryTransformations = document.getElementById('summary-transformations');
    const addTransformationBtn = document.getElementById('add-transformation-btn');
    const addModal = document.getElementById('add-modal');
    const addForm = document.getElementById('add-transformation-form');
    const deleteModal = document.getElementById('delete-modal');
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');
    const toastContainer = document.getElementById('toast-container');
    const adminSidebar = document.getElementById('admin-sidebar');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');

    let deleteTargetId = null;
    let pendingImageFiles = {};

    // =============================================
    // Toast Notifications
    // =============================================
    function showToast(message, type) {
        const toast = document.createElement('div');
        toast.className = 'toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        toastContainer.appendChild(toast);

        setTimeout(function () {
            toast.style.animation = 'toastOut 0.35s ease forwards';
            setTimeout(function () {
                toast.remove();
            }, 350);
        }, 3500);
    }

    // =============================================
    // Auth State
    // =============================================
    function showLogin(message) {
        adminApp.hidden = true;
        loginScreen.hidden = false;
        loginError.textContent = '';
        loginInfo.textContent = message || '';
    }

    function showDashboard() {
        loginScreen.hidden = true;
        adminApp.hidden = false;
        loadDashboardData();
    }

    async function checkSession() {
        if (!supabaseClient) {
            showLogin('Supabase is not configured. Update supabase-config.js.');
            return;
        }

        const { data: { session } } = await supabaseClient.auth.getSession();

        if (session) {
            const isAdmin = await verifyAdmin(session.user.id);
            if (isAdmin) {
                showDashboard();
            } else {
                await supabaseClient.auth.signOut();
                showLogin('You are not authorized to access this dashboard.');
            }
        } else {
            showLogin('');
        }
    }

    async function verifyAdmin(userId) {
        const { data, error } = await supabaseClient
            .from('admin_users')
            .select('id')
            .eq('user_id', userId)
            .maybeSingle();

        if (error) {
            console.error('Admin verification failed:', error);
            return false;
        }
        return !!data;
    }

    supabaseClient = initSupabase();

    if (supabaseClient) {
        supabaseClient.auth.onAuthStateChange(function (event, session) {
            if (event === 'SIGNED_OUT') {
                showLogin('');
            } else if (event === 'TOKEN_REFRESHED' && !session) {
                showLogin('Your session has expired. Please sign in again.');
            }
        });
    }

    // =============================================
    // Login / Logout
    // =============================================
    if (loginForm) {
        loginForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            loginError.textContent = '';
            loginInfo.textContent = '';

            if (!supabaseClient) {
                loginError.textContent = 'Supabase is not configured.';
                return;
            }

            const email = loginEmail.value.trim();
            const password = loginPassword.value;

            if (!email || !password) {
                loginError.textContent = 'Please enter your email and password.';
                return;
            }

            loginBtn.disabled = true;
            loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Signing in...';

            try {
                const { data, error } = await supabaseClient.auth.signInWithPassword({
                    email: email,
                    password: password
                });

                if (error) throw error;

                const isAdmin = await verifyAdmin(data.user.id);
                if (!isAdmin) {
                    await supabaseClient.auth.signOut();
                    loginError.textContent = 'You are not authorized to access this dashboard.';
                    return;
                }

                showDashboard();
            } catch (err) {
                console.error('Login failed:', err);
                loginError.textContent = 'Invalid email or password.';
            } finally {
                loginBtn.disabled = false;
                loginBtn.innerHTML = '<i class="fa-solid fa-right-to-bracket" aria-hidden="true"></i> Sign In';
            }
        });
    }

    async function handleLogout(btn) {
        if (!supabaseClient) return;

        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Signing out...';

        await supabaseClient.auth.signOut();
        servicesList.innerHTML = '';
        transformationsList.innerHTML = '';
        showLogin('');

        btn.disabled = false;
        btn.innerHTML = originalHTML;
    }

    if (sidebarLogout) sidebarLogout.addEventListener('click', function () { handleLogout(sidebarLogout); });
    if (headerLogout) headerLogout.addEventListener('click', function () { handleLogout(headerLogout); });

    // =============================================
    // Navigation
    // =============================================
    function switchPanel(panelName) {
        document.querySelectorAll('.admin-panel').forEach(function (panel) {
            panel.classList.toggle('active', panel.dataset.panel === panelName);
        });
        document.querySelectorAll('.sidebar-link').forEach(function (link) {
            link.classList.toggle('active', link.dataset.panel === panelName);
        });
        adminSidebar.classList.remove('open');
        mobileMenuBtn.setAttribute('aria-expanded', 'false');

        if (panelName === 'services') loadServices();
        if (panelName === 'transformations') loadTransformations();
    }

    document.querySelectorAll('.sidebar-link').forEach(function (link) {
        link.addEventListener('click', function () {
            switchPanel(link.dataset.panel);
        });
    });

    document.querySelectorAll('[data-goto]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            switchPanel(btn.dataset.goto);
        });
    });

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', function () {
            const isOpen = adminSidebar.classList.toggle('open');
            mobileMenuBtn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
        });
    }

    // =============================================
    // Image Utilities
    // =============================================
    function validateImageFile(file) {
        if (!file) return 'No file selected.';
        if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
            return 'Invalid file type. Please use JPG, PNG, or WEBP.';
        }
        if (file.size > MAX_IMAGE_SIZE) {
            return 'File is too large. Maximum size is 5 MB.';
        }
        if (file.size > 2 * 1024 * 1024) {
            return 'warning:large';
        }
        return null;
    }

    function generateUniqueFilename(prefix, extension) {
        const id = crypto.randomUUID ? crypto.randomUUID() : Date.now() + '-' + Math.random().toString(36).slice(2);
        return prefix + '-' + id + '.' + extension;
    }

    function getExtensionFromFile(file) {
        const map = { 'image/jpeg': 'jpg', 'image/jpg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };
        return map[file.type] || 'webp';
    }

    function extractStoragePath(url) {
        if (!url || !url.includes('/storage/v1/object/public/')) return null;
        const parts = url.split('/storage/v1/object/public/' + STORAGE_BUCKET + '/');
        return parts[1] || null;
    }

    async function uploadImage(file, folder, prefix) {
        const ext = getExtensionFromFile(file);
        const filename = generateUniqueFilename(prefix, ext);
        const path = folder + '/' + filename;

        const { error } = await supabaseClient.storage
            .from(STORAGE_BUCKET)
            .upload(path, file, { cacheControl: '3600', upsert: false });

        if (error) throw error;

        const { data } = supabaseClient.storage
            .from(STORAGE_BUCKET)
            .getPublicUrl(path);

        return { url: data.publicUrl, path: path };
    }

    async function deleteStorageFile(url) {
        const path = extractStoragePath(url);
        if (!path) return;
        await supabaseClient.storage.from(STORAGE_BUCKET).remove([path]);
    }

    function showImagePreview(container, fileOrUrl, label) {
        container.innerHTML = '';
        container.classList.remove('empty');

        if (fileOrUrl instanceof File) {
            const img = document.createElement('img');
            img.alt = label || 'Preview';
            img.src = URL.createObjectURL(fileOrUrl);
            container.appendChild(img);
        } else if (typeof fileOrUrl === 'string' && fileOrUrl) {
            const img = document.createElement('img');
            img.alt = label || 'Current image';
            img.src = fileOrUrl;
            container.appendChild(img);
        } else {
            container.classList.add('empty');
        }
    }

    // =============================================
    // Services Management
    // =============================================
    async function loadServices() {
        servicesError.hidden = true;
        servicesList.innerHTML = '<p class="loading-screen">Loading services...</p>';

        try {
            const { data, error } = await supabaseClient
                .from('services')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                servicesList.innerHTML =
                    '<div class="empty-state">' +
                        '<p>No services found. Run supabase-setup.sql to seed initial records.</p>' +
                    '</div>';
                return;
            }

            renderServices(data);
        } catch (err) {
            console.error('Failed to load services:', err);
            servicesList.innerHTML = '';
            servicesError.hidden = false;
        }
    }

    function renderServices(services) {
        servicesList.innerHTML = '';

        services.forEach(function (service) {
            const num = String(service.service_number).padStart(2, '0');
            const card = document.createElement('div');
            card.className = 'content-card';
            card.dataset.id = service.id;
            card.innerHTML =
                '<div class="content-card-header">Service ' + num + '</div>' +
                '<div class="image-section">' +
                    '<p class="image-section-label">Current Image</p>' +
                    '<div class="image-preview" id="service-img-' + service.id + '">' +
                        '<img src="' + service.image_url + '" alt="' + service.title + '">' +
                    '</div>' +
                    '<p class="image-section-label" style="margin-top:0.75rem">Choose New Image</p>' +
                    '<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" data-service-upload="' + service.id + '">' +
                    '<div class="image-preview empty" id="service-preview-' + service.id + '"></div>' +
                    '<p class="upload-status" id="service-upload-status-' + service.id + '"></p>' +
                '</div>' +
                '<div class="content-card-grid">' +
                    '<div class="form-field">' +
                        '<label for="service-title-' + service.id + '">Title</label>' +
                        '<input type="text" id="service-title-' + service.id + '" value="' + escapeAttr(service.title) + '">' +
                    '</div>' +
                    '<div class="form-field">' +
                        '<label for="service-icon-' + service.id + '">Icon</label>' +
                        '<input type="text" id="service-icon-' + service.id + '" value="' + escapeAttr(service.icon) + '" placeholder="fa-house">' +
                    '</div>' +
                    '<div class="form-field" style="grid-column:1/-1">' +
                        '<label for="service-desc-' + service.id + '">Description</label>' +
                        '<textarea id="service-desc-' + service.id + '" rows="3">' + escapeHtml(service.description) + '</textarea>' +
                    '</div>' +
                    '<div class="form-field">' +
                        '<label for="service-order-' + service.id + '">Display Order</label>' +
                        '<input type="number" id="service-order-' + service.id + '" min="1" value="' + service.display_order + '">' +
                    '</div>' +
                    '<div class="form-field">' +
                        '<label for="service-status-' + service.id + '">Status</label>' +
                        '<select id="service-status-' + service.id + '">' +
                            '<option value="true"' + (service.is_active ? ' selected' : '') + '>Active</option>' +
                            '<option value="false"' + (!service.is_active ? ' selected' : '') + '>Inactive</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="card-actions">' +
                    '<button class="btn-admin btn-admin-primary btn-admin-sm" data-save-service="' + service.id + '">' +
                        '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Changes' +
                    '</button>' +
                '</div>';

            servicesList.appendChild(card);

            const uploadInput = card.querySelector('[data-service-upload]');
            uploadInput.addEventListener('change', function () {
                const file = uploadInput.files[0];
                const preview = document.getElementById('service-preview-' + service.id);
                const status = document.getElementById('service-upload-status-' + service.id);
                status.textContent = '';

                if (!file) return;

                const validation = validateImageFile(file);
                if (validation && validation !== 'warning:large') {
                    status.textContent = validation;
                    status.style.color = 'var(--color-error)';
                    uploadInput.value = '';
                    return;
                }

                if (validation === 'warning:large') {
                    status.textContent = 'This image is large. Consider using a smaller file for faster loading.';
                }

                pendingImageFiles['service-' + service.id] = file;
                showImagePreview(preview, file, 'New preview');
            });
        });

        servicesList.querySelectorAll('[data-save-service]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                saveService(btn.dataset.saveService, btn);
            });
        });
    }

    async function saveService(id, btn) {
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving...';

        try {
            let imageUrl = null;
            const pendingFile = pendingImageFiles['service-' + id];

            if (pendingFile) {
                const statusEl = document.getElementById('service-upload-status-' + id);
                statusEl.textContent = 'Uploading...';

                const { data: current } = await supabaseClient
                    .from('services')
                    .select('image_url')
                    .eq('id', id)
                    .single();

                const upload = await uploadImage(pendingFile, 'services', 'service-' + String(document.getElementById('service-order-' + id).value).padStart(2, '0'));
                imageUrl = upload.url;

                const updateData = {
                    title: document.getElementById('service-title-' + id).value.trim(),
                    description: document.getElementById('service-desc-' + id).value.trim(),
                    icon: document.getElementById('service-icon-' + id).value.trim(),
                    display_order: parseInt(document.getElementById('service-order-' + id).value, 10),
                    is_active: document.getElementById('service-status-' + id).value === 'true',
                    image_url: imageUrl
                };

                const { error } = await supabaseClient
                    .from('services')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw error;

                if (current && current.image_url && current.image_url.includes('/storage/v1/object/public/')) {
                    await deleteStorageFile(current.image_url);
                }

                delete pendingImageFiles['service-' + id];
                statusEl.textContent = 'Image uploaded successfully.';
                document.getElementById('service-img-' + id).innerHTML = '<img src="' + imageUrl + '" alt="Updated">';
                document.getElementById('service-preview-' + id).innerHTML = '';
                document.getElementById('service-preview-' + id).classList.add('empty');
            } else {
                const updateData = {
                    title: document.getElementById('service-title-' + id).value.trim(),
                    description: document.getElementById('service-desc-' + id).value.trim(),
                    icon: document.getElementById('service-icon-' + id).value.trim(),
                    display_order: parseInt(document.getElementById('service-order-' + id).value, 10),
                    is_active: document.getElementById('service-status-' + id).value === 'true'
                };

                const { error } = await supabaseClient
                    .from('services')
                    .update(updateData)
                    .eq('id', id);

                if (error) throw error;
            }

            showToast('Service updated successfully.', 'success');
            updateSummaryCounts();
        } catch (err) {
            console.error('Failed to save service:', err);
            showToast('Failed to save service. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    if (servicesRetry) servicesRetry.addEventListener('click', loadServices);

    // =============================================
    // Transformations Management
    // =============================================
    async function loadTransformations() {
        transformationsError.hidden = true;
        transformationsList.innerHTML = '<p class="loading-screen">Loading transformations...</p>';

        try {
            const { data, error } = await supabaseClient
                .from('before_after')
                .select('*')
                .order('display_order', { ascending: true });

            if (error) throw error;

            if (!data || data.length === 0) {
                transformationsList.innerHTML =
                    '<div class="empty-state">' +
                        '<p>No transformations yet.</p>' +
                        '<p>Add your first before &amp; after transformation.</p>' +
                        '<button class="btn-admin btn-admin-primary" id="empty-add-btn">' +
                            '<i class="fa-solid fa-plus" aria-hidden="true"></i> Add Transformation' +
                        '</button>' +
                    '</div>';
                document.getElementById('empty-add-btn').addEventListener('click', openAddModal);
                return;
            }

            renderTransformations(data);
        } catch (err) {
            console.error('Failed to load transformations:', err);
            transformationsList.innerHTML = '';
            transformationsError.hidden = false;
        }
    }

    function renderTransformations(items) {
        transformationsList.innerHTML = '';

        items.forEach(function (item, index) {
            const num = String(index + 1).padStart(2, '0');
            const card = document.createElement('div');
            card.className = 'content-card';
            card.dataset.id = item.id;
            card.innerHTML =
                '<div class="content-card-header">Transformation ' + num + '</div>' +
                '<div class="transform-images">' +
                    '<div class="transform-image-block">' +
                        '<p class="image-section-label">Before</p>' +
                        '<div class="image-preview" id="before-img-' + item.id + '">' +
                            '<img src="' + item.before_image_url + '" alt="Before">' +
                        '</div>' +
                        '<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" data-before-upload="' + item.id + '" style="margin-top:0.5rem">' +
                        '<div class="image-preview empty" id="before-preview-' + item.id + '"></div>' +
                    '</div>' +
                    '<div class="transform-image-block">' +
                        '<p class="image-section-label">After</p>' +
                        '<div class="image-preview" id="after-img-' + item.id + '">' +
                            '<img src="' + item.after_image_url + '" alt="After">' +
                        '</div>' +
                        '<input type="file" accept="image/jpeg,image/jpg,image/png,image/webp" data-after-upload="' + item.id + '" style="margin-top:0.5rem">' +
                        '<div class="image-preview empty" id="after-preview-' + item.id + '"></div>' +
                    '</div>' +
                '</div>' +
                '<p class="upload-status" id="transform-upload-status-' + item.id + '"></p>' +
                '<div class="content-card-grid">' +
                    '<div class="form-field">' +
                        '<label for="transform-title-' + item.id + '">Title</label>' +
                        '<input type="text" id="transform-title-' + item.id + '" value="' + escapeAttr(item.title) + '">' +
                    '</div>' +
                    '<div class="form-field">' +
                        '<label for="transform-order-' + item.id + '">Display Order</label>' +
                        '<input type="number" id="transform-order-' + item.id + '" min="1" value="' + item.display_order + '">' +
                    '</div>' +
                    '<div class="form-field" style="grid-column:1/-1">' +
                        '<label for="transform-desc-' + item.id + '">Description</label>' +
                        '<textarea id="transform-desc-' + item.id + '" rows="2">' + escapeHtml(item.description) + '</textarea>' +
                    '</div>' +
                    '<div class="form-field">' +
                        '<label for="transform-status-' + item.id + '">Status</label>' +
                        '<select id="transform-status-' + item.id + '">' +
                            '<option value="true"' + (item.is_active ? ' selected' : '') + '>Active</option>' +
                            '<option value="false"' + (!item.is_active ? ' selected' : '') + '>Inactive</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="card-actions">' +
                    '<button class="btn-admin btn-admin-primary btn-admin-sm" data-save-transform="' + item.id + '">' +
                        '<i class="fa-solid fa-floppy-disk" aria-hidden="true"></i> Save Changes' +
                    '</button>' +
                    '<button class="btn-admin btn-admin-danger btn-admin-sm" data-delete-transform="' + item.id + '">' +
                        '<i class="fa-solid fa-trash" aria-hidden="true"></i> Delete' +
                    '</button>' +
                '</div>';

            transformationsList.appendChild(card);

            card.querySelector('[data-before-upload]').addEventListener('change', function (e) {
                handleTransformImageSelect(e.target.files[0], 'before-' + item.id, 'before-preview-' + item.id);
            });

            card.querySelector('[data-after-upload]').addEventListener('change', function (e) {
                handleTransformImageSelect(e.target.files[0], 'after-' + item.id, 'after-preview-' + item.id);
            });
        });

        transformationsList.querySelectorAll('[data-save-transform]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                saveTransformation(btn.dataset.saveTransform, btn);
            });
        });

        transformationsList.querySelectorAll('[data-delete-transform]').forEach(function (btn) {
            btn.addEventListener('click', function () {
                openDeleteModal(btn.dataset.deleteTransform);
            });
        });
    }

    function handleTransformImageSelect(file, key, previewId) {
        if (!file) return;
        const validation = validateImageFile(file);
        if (validation && validation !== 'warning:large') {
            showToast(validation, 'error');
            return;
        }
        pendingImageFiles[key] = file;
        showImagePreview(document.getElementById(previewId), file, 'New preview');
    }

    async function saveTransformation(id, btn) {
        const originalHTML = btn.innerHTML;
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving...';

        try {
            const statusEl = document.getElementById('transform-upload-status-' + id);
            const { data: current } = await supabaseClient
                .from('before_after')
                .select('before_image_url, after_image_url')
                .eq('id', id)
                .single();

            const updateData = {
                title: document.getElementById('transform-title-' + id).value.trim(),
                description: document.getElementById('transform-desc-' + id).value.trim(),
                display_order: parseInt(document.getElementById('transform-order-' + id).value, 10),
                is_active: document.getElementById('transform-status-' + id).value === 'true'
            };

            const beforeFile = pendingImageFiles['before-' + id];
            const afterFile = pendingImageFiles['after-' + id];

            if (beforeFile) {
                statusEl.textContent = 'Uploading before image...';
                const upload = await uploadImage(beforeFile, 'before-after', 'before');
                updateData.before_image_url = upload.url;
            }

            if (afterFile) {
                statusEl.textContent = 'Uploading after image...';
                const upload = await uploadImage(afterFile, 'before-after', 'after');
                updateData.after_image_url = upload.url;
            }

            const { error } = await supabaseClient
                .from('before_after')
                .update(updateData)
                .eq('id', id);

            if (error) throw error;

            if (beforeFile && current && current.before_image_url && current.before_image_url.includes('/storage/v1/')) {
                await deleteStorageFile(current.before_image_url);
            }
            if (afterFile && current && current.after_image_url && current.after_image_url.includes('/storage/v1/')) {
                await deleteStorageFile(current.after_image_url);
            }

            delete pendingImageFiles['before-' + id];
            delete pendingImageFiles['after-' + id];
            statusEl.textContent = beforeFile || afterFile ? 'Image uploaded successfully.' : '';

            if (updateData.before_image_url) {
                document.getElementById('before-img-' + id).innerHTML = '<img src="' + updateData.before_image_url + '" alt="Before">';
            }
            if (updateData.after_image_url) {
                document.getElementById('after-img-' + id).innerHTML = '<img src="' + updateData.after_image_url + '" alt="After">';
            }

            showToast('Changes saved successfully.', 'success');
            updateSummaryCounts();
        } catch (err) {
            console.error('Failed to save transformation:', err);
            showToast('Failed to save transformation. Please try again.', 'error');
        } finally {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }

    if (transformationsRetry) transformationsRetry.addEventListener('click', loadTransformations);

    // =============================================
    // Add Transformation
    // =============================================
    function openAddModal() {
        addForm.reset();
        document.getElementById('add-before-preview').innerHTML = '';
        document.getElementById('add-after-preview').innerHTML = '';
        document.getElementById('add-form-error').textContent = '';
        openModal('add-modal');
    }

    if (addTransformationBtn) {
        addTransformationBtn.addEventListener('click', openAddModal);
    }

    document.getElementById('add-before').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const v = validateImageFile(file);
            if (v && v !== 'warning:large') {
                document.getElementById('add-form-error').textContent = v;
                return;
            }
            showImagePreview(document.getElementById('add-before-preview'), file, 'Before preview');
        }
    });

    document.getElementById('add-after').addEventListener('change', function (e) {
        const file = e.target.files[0];
        if (file) {
            const v = validateImageFile(file);
            if (v && v !== 'warning:large') {
                document.getElementById('add-form-error').textContent = v;
                return;
            }
            showImagePreview(document.getElementById('add-after-preview'), file, 'After preview');
        }
    });

    if (addForm) {
        addForm.addEventListener('submit', async function (e) {
            e.preventDefault();
            const errorEl = document.getElementById('add-form-error');
            const submitBtn = document.getElementById('add-submit-btn');
            errorEl.textContent = '';

            const beforeFile = document.getElementById('add-before').files[0];
            const afterFile = document.getElementById('add-after').files[0];

            if (!beforeFile || !afterFile) {
                errorEl.textContent = 'Both before and after images are required.';
                return;
            }

            const beforeValidation = validateImageFile(beforeFile);
            const afterValidation = validateImageFile(afterFile);
            if ((beforeValidation && beforeValidation !== 'warning:large') ||
                (afterValidation && afterValidation !== 'warning:large')) {
                errorEl.textContent = beforeValidation || afterValidation;
                return;
            }

            const originalHTML = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Saving...';

            try {
                const beforeUpload = await uploadImage(beforeFile, 'before-after', 'before');
                const afterUpload = await uploadImage(afterFile, 'before-after', 'after');

                const { error } = await supabaseClient
                    .from('before_after')
                    .insert({
                        title: document.getElementById('add-title').value.trim(),
                        description: document.getElementById('add-description').value.trim(),
                        before_image_url: beforeUpload.url,
                        after_image_url: afterUpload.url,
                        display_order: parseInt(document.getElementById('add-order').value, 10) || 1,
                        is_active: document.getElementById('add-status').value === 'true'
                    });

                if (error) throw error;

                closeModal('add-modal');
                showToast('Transformation added successfully.', 'success');
                loadTransformations();
                updateSummaryCounts();
            } catch (err) {
                console.error('Failed to add transformation:', err);
                errorEl.textContent = 'Failed to add transformation. Please try again.';
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalHTML;
            }
        });
    }

    // =============================================
    // Delete Transformation
    // =============================================
    function openDeleteModal(id) {
        deleteTargetId = id;
        openModal('delete-modal');
    }

    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', async function () {
            if (!deleteTargetId) return;

            const originalHTML = confirmDeleteBtn.innerHTML;
            confirmDeleteBtn.disabled = true;
            confirmDeleteBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin" aria-hidden="true"></i> Deleting...';

            try {
                const { data: item } = await supabaseClient
                    .from('before_after')
                    .select('before_image_url, after_image_url')
                    .eq('id', deleteTargetId)
                    .single();

                const { error } = await supabaseClient
                    .from('before_after')
                    .delete()
                    .eq('id', deleteTargetId);

                if (error) throw error;

                if (item) {
                    if (item.before_image_url.includes('/storage/v1/')) await deleteStorageFile(item.before_image_url);
                    if (item.after_image_url.includes('/storage/v1/')) await deleteStorageFile(item.after_image_url);
                }

                closeModal('delete-modal');
                showToast('Transformation deleted.', 'success');
                deleteTargetId = null;
                loadTransformations();
                updateSummaryCounts();
            } catch (err) {
                console.error('Failed to delete:', err);
                showToast('Failed to delete transformation.', 'error');
            } finally {
                confirmDeleteBtn.disabled = false;
                confirmDeleteBtn.innerHTML = originalHTML;
            }
        });
    }

    // =============================================
    // Modals
    // =============================================
    function openModal(id) {
        const modal = document.getElementById(id);
        modal.hidden = false;
        requestAnimationFrame(function () {
            modal.classList.add('open');
        });
        document.body.style.overflow = 'hidden';
    }

    function closeModal(id) {
        const modal = document.getElementById(id);
        modal.classList.remove('open');
        setTimeout(function () {
            modal.hidden = true;
        }, 350);
        document.body.style.overflow = '';
    }

    document.querySelectorAll('[data-close-modal]').forEach(function (btn) {
        btn.addEventListener('click', function () {
            closeModal(btn.dataset.closeModal);
        });
    });

    document.querySelectorAll('.modal-overlay').forEach(function (overlay) {
        overlay.addEventListener('click', function (e) {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay.open').forEach(function (modal) {
                closeModal(modal.id);
            });
            adminSidebar.classList.remove('open');
        }
    });

    // =============================================
    // Dashboard Summary
    // =============================================
    async function updateSummaryCounts() {
        try {
            const [servicesRes, transformsRes] = await Promise.all([
                supabaseClient.from('services').select('id', { count: 'exact', head: true }),
                supabaseClient.from('before_after').select('id', { count: 'exact', head: true })
            ]);

            summaryServices.textContent = servicesRes.count ?? '—';
            summaryTransformations.textContent = transformsRes.count ?? '—';
        } catch (err) {
            console.error('Failed to update summary:', err);
        }
    }

    function loadDashboardData() {
        updateSummaryCounts();
    }

    // =============================================
    // Utilities
    // =============================================
    function escapeHtml(str) {
        const div = document.createElement('div');
        div.textContent = str || '';
        return div.innerHTML;
    }

    function escapeAttr(str) {
        return (str || '').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    // =============================================
    // Init
    // =============================================
    checkSession();

})();
