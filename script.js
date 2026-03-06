// --- GLOBAL CHATBOT CONTROLS (defined outside DOMContentLoaded so onclick attributes can call them) ---
window.openChat = function () {
    const win = document.getElementById('ai-chat-window');
    const fab = document.getElementById('ai-chat-toggle');
    if (win) win.classList.add('active');
    if (fab) { fab.style.transform = 'scale(0) rotate(-90deg)'; fab.style.opacity = '0'; }
};
window.closeChat = function () {
    const win = document.getElementById('ai-chat-window');
    const fab = document.getElementById('ai-chat-toggle');
    if (win) win.classList.remove('active');
    if (fab) { fab.style.transform = 'scale(1) rotate(0)'; fab.style.opacity = '1'; }
};
window.dismissChat = function (e) {
    if (e) e.stopPropagation();
    const wrapper = document.querySelector('.ai-chat-wrapper');
    const win = document.getElementById('ai-chat-window');
    if (wrapper) wrapper.style.display = 'none';
    if (win) win.classList.remove('active');
};

document.addEventListener('DOMContentLoaded', () => {

    console.log("Black Mango Portal v1.10 | Milestone Release: Dynamic Designer Notes & Step Audits");
    // --- Elements ---
    let activeStyleId = null;
    let activeSizes = {};
    let editActiveSizes = {};
    const splashScreen = document.getElementById('splash-screen');
    const mainApp = document.getElementById('main-app');
    const bgOverlay = document.querySelector('.background-overlay');

    const loginCard = document.getElementById('login-card');
    const dashboardCard = document.getElementById('dashboard-card');

    const step1Form = document.getElementById('step1-form');
    const step2Form = document.getElementById('step2-form');
    const errorMsg = document.getElementById('error-message');

    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePwdBtn = document.getElementById('toggle-pwd');

    const backBtn = document.getElementById('back-to-step1');
    const displayUsername = document.getElementById('display-username');

    const deptSelect = document.getElementById('department');
    const roleSelect = document.getElementById('role');
    const fullnameInput = document.getElementById('fullname');

    // --- State ---
    let currentUser = null; // 'admin' or 'staff'

    // --- Splash Screen & Initial Load ---
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        bgOverlay.classList.add('loaded');

        setTimeout(() => {
            splashScreen.style.display = 'none';
            // Only show login if no active session (launchDashboard handles the other case)
            let _sess = null;
            try { _sess = JSON.parse(localStorage.getItem('bm_session')); } catch (e) { localStorage.removeItem('bm_session'); }
            if (!_sess) {
                mainApp.style.display = 'flex';
            }
        }, 300);
    }, 2000);




    // --- Input Focus Styling ---
    // Helper to highlight icons when input is focused
    const inputs = document.querySelectorAll('.input-group input, .input-group select');
    inputs.forEach(input => {
        input.addEventListener('focus', function () {
            this.parentElement.classList.add('focused');
        });
        input.addEventListener('blur', function () {
            this.parentElement.classList.remove('focused');
        });
    });

    // --- Password Toggle ---
    if (togglePwdBtn && passwordInput) {
        togglePwdBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);
            togglePwdBtn.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
        });
    }

    // --- Step 1 Submit (Basic Auth) ---
    if (step1Form) {
        step1Form.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = usernameInput.value.trim().toLowerCase();
            const pwd = passwordInput.value;

            // Dummy validation logic
            if (user === 'admin' && pwd === 'admin123') {
                // Master Admin Login - Bypass Step 2
                errorMsg.style.display = 'none';
                currentUser = 'admin';
                launchDashboard('admin', 'Master Admin', 'System Administrator');
            } else if (user === 'staff' && pwd === 'staff123') {
                // Regular Staff Login - Proceed to Step 2
                errorMsg.style.display = 'none';
                currentUser = 'staff';

                // UI Transition
                displayUsername.textContent = user;
                step1Form.classList.remove('active', 'slide-in-left');
                step1Form.classList.add('slide-out-left');

                setTimeout(() => {
                    step2Form.classList.remove('slide-out-right');
                    step2Form.classList.add('active', 'slide-in-right');
                }, 400); // Wait for slide out animation
            } else {
                // Error
                errorMsg.style.display = 'block';
                // Shake effect
                loginCard.style.transform = 'translateX(-10px)';
                setTimeout(() => {
                    loginCard.style.transform = 'translateX(10px)';
                    setTimeout(() => {
                        loginCard.style.transform = 'translateX(-10px)';
                        setTimeout(() => { loginCard.style.transform = 'translateX(0)'; }, 100);
                    }, 100);
                }, 100);
            }
        });
    }

    // --- Go Back to Step 1 ---
    if (backBtn && step1Form && step2Form) {
        backBtn.addEventListener('click', () => {
            step2Form.classList.remove('active', 'slide-in-right');
            step1Form.classList.remove('slide-out-left');

            step2Form.style.display = 'none';
            step1Form.classList.add('slide-in-left');

            // Reset step 1 state
            setTimeout(() => {
                step1Form.classList.remove('slide-in-left');
                step1Form.classList.add('active');
                step2Form.style.display = '';
            }, 400);
        });
    }

    // --- Step 2 Submit (Role Auth) ---
    if (step2Form) {
        step2Form.addEventListener('submit', (e) => {
            e.preventDefault();
            const dept = deptSelect.value; // Use the value (e.g. "Design", "Factory") so it matches template team names for RBAC
            const role = roleSelect.options[roleSelect.selectedIndex].text;
            const name = fullnameInput.value.trim();

            // fullRole format: "Manager / Department Head - Design" — the dept part is matched against template teams
            launchDashboard('staff', name, `${role} - ${dept}`);
        });
    }

    // --- Dashboard Launch & Workspace Logic ---
    const svgPlaceholder = (icon, title) => 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800"><rect width="600" height="800" fill="#F3F4F6"/><text x="50%" y="50%" font-family="sans-serif" font-size="80" fill="#D1D5DB" dominant-baseline="middle" text-anchor="middle">${icon}</text><text x="50%" y="60%" font-family="sans-serif" font-size="24" font-weight="600" fill="#9CA3AF" dominant-baseline="middle" text-anchor="middle">${title}</text></svg>`);

    const getCoverHtml = (style, isDetail = false) => {
        const fallbackImg = svgPlaceholder('👗', 'Style Pending');
        const imgUrl = style.image || fallbackImg;

        return `
            <div class="${isDetail ? 'detail-image-wrapper' : 'style-image-wrapper'}" style="background-image: url('${imgUrl}')">
                <img src="${imgUrl}" class="style-image" alt="Style Image">
            </div>
        `;
    };

    // Use relative path for API so it works both locally and on Render
    const API_BASE_URL = '/api';
    let deliveriesData = [];
    let stylesData = [];
    let materialsData = [];

    async function fetchDeliveries() {
        try {
            const response = await fetch(`${API_BASE_URL}/deliveries`);
            deliveriesData = await response.json();

            // --- LEGACY MIGRATION HOOK ---
            // If the database is empty, see if we have old data in localStorage to recover!
            if (deliveriesData.length === 0 && localStorage.getItem('bm_deliveries')) {
                const legacyDeliveries = JSON.parse(localStorage.getItem('bm_deliveries') || "[]");
                const legacyStyles = JSON.parse(localStorage.getItem('bm_styles') || "[]");

                if (legacyDeliveries.length > 0) {
                    console.log('Migrating legacy data to backend API...');
                    for (const del of legacyDeliveries) {
                        // Create delivery
                        const delRes = await fetch(`${API_BASE_URL}/deliveries`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: del.name,
                                season: del.season,
                                createdDate: del.createdDate || new Date().toISOString(),
                                items: 0 // Creating styles sequentially below will trigger the backend to self-increment this count naturally!
                            })
                        });
                        const newDel = await delRes.json();

                        // Create associated styles mapped to new auto-increment ID
                        const associatedStyles = legacyStyles.filter(s => s.deliveryId === del.id);
                        for (const style of associatedStyles) {
                            await fetch(`${API_BASE_URL}/styles`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    deliveryId: newDel.id, // mapped to the new database primary key
                                    no: style.no,
                                    desc: style.desc,
                                    color: style.color || "Standard",
                                    category: style.category,
                                    sizes: style.sizes || { XS: 0, S: 0, M: style.qty || 0, L: 0, XL: 0, XXL: 0 },
                                    qty: style.qty,
                                    status: style.status,
                                    orderDate: style.orderDate,
                                    trackerStep: style.trackerStep || 0,
                                    deliveryDate: style.deliveryDate,
                                    image: style.image || "",
                                    createdDate: style.createdDate || new Date().toISOString(),
                                    designRejections: style.designRejections || 0
                                })
                            });
                        }
                    }

                    // Cleanup legacy
                    localStorage.removeItem('bm_deliveries');
                    localStorage.removeItem('bm_styles');

                    // Refetch the now-populated database
                    const refreshedResponse = await fetch(`${API_BASE_URL}/deliveries`);
                    deliveriesData = await refreshedResponse.json();
                }
            }

            renderDeliveries();
            if (typeof updateAdminDashboardStats === 'function') updateAdminDashboardStats();

            // Build Unified Notifications whenever we refresh the global DB wrapper!
            await fetchNotifications();
        } catch (error) {
            console.error('Failed to fetch deliveries:', error);
            // Gracefully handle backend down
            deliveriesGrid.innerHTML = '<p style="color: #EF4444; grid-column: 1/-1;">Error connecting to database. Is the Flask server running?</p>';
        }
    }

    async function fetchStyles(deliveryId) {
        try {
            const response = await fetch(`${API_BASE_URL}/styles?deliveryId=${deliveryId}`);
            stylesData = await response.json();

            // Map JSON structures back if necessary
            stylesData = stylesData.map(s => {
                if (!s.sizes) s.sizes = { XS: 0, S: 0, M: s.qty || 0, L: 0, XL: 0, XXL: 0 };
                return s;
            });

            renderStyles(deliveryId);
        } catch (error) {
            console.error('Failed to fetch styles:', error);
        }
    }

    let notificationsData = [];
    let allStylesData = [];
    let trackingTemplates = [];

    async function fetchTemplates() {
        try {
            const response = await fetch(`${API_BASE_URL}/templates`);
            trackingTemplates = await response.json();

            if (typeof renderTemplatesGrid === 'function') renderTemplatesGrid();
            if (typeof populateTemplatesDropdown === 'function') populateTemplatesDropdown();
            if (typeof updateAdminDashboardStats === 'function') updateAdminDashboardStats();
        } catch (error) {
            console.error('Failed to fetch tracking templates:', error);
        }
    }

    async function fetchMaterials() {
        try {
            const response = await fetch(`${API_BASE_URL}/materials`);
            materialsData = await response.json();
            renderMaterials();
        } catch (error) {
            console.error('Failed to fetch materials:', error);
        }
    }

    function renderMaterials() {
        const materialsGrid = document.getElementById('materials-grid');
        const searchTerm = (document.getElementById('search-materials')?.value || '').toLowerCase();
        const typeFilter = document.getElementById('filter-material-type')?.value || 'all';

        if (!materialsGrid) return;

        let filtered = materialsData.filter(m =>
            (m.name.toLowerCase().includes(searchTerm) ||
                (m.supplier && m.supplier.toLowerCase().includes(searchTerm)) ||
                (m.color && m.color.toLowerCase().includes(searchTerm))) &&
            (typeFilter === 'all' || m.type === typeFilter)
        );

        materialsGrid.innerHTML = '';

        if (filtered.length === 0) {
            materialsGrid.innerHTML = '<p style="color: #6B7280; grid-column: 1/-1; text-align: center; padding: 2rem;">No materials found.</p>';
            return;
        }

        filtered.forEach(m => {
            const card = document.createElement('div');
            card.className = 'library-card';

            const materialIcons = {
                'Fabric': 'fa-scroll',
                'Trim': 'fa-scissors',
                'Hardware': 'fa-nut-can',
                'Thread': 'fa-spaghetti-monster-fly',
                'Packaging': 'fa-box-open',
                'Button': 'fa-circle-dot',
                'Zipper': 'fa-file-zipper'
            };

            const icon = materialIcons[m.type] || 'fa-box-archive';

            card.innerHTML = `
                <div class="lib-actions">
                    <button class="lib-btn btn-view-usage" title="View Production Progress" data-id="${m.id}"><i class="fa-solid fa-chart-line"></i></button>
                    <button class="lib-btn btn-edit-material" title="Edit material"><i class="fa-solid fa-pen"></i></button>
                    <button class="lib-btn delete btn-delete-material" title="Delete material"><i class="fa-solid fa-trash"></i></button>
                </div>
                <div class="lib-swatch-view">
                    <div class="lib-type-badge">${m.type}</div>
                    <div class="lib-swatch-texture" style="background-image: url('https://www.transparenttextures.com/patterns/fabric-plaid.png');"></div>
                    <i class="fa-solid ${icon} lib-swatch-icon"></i>
                </div>
                <div class="lib-body">
                    <div class="lib-name">${m.name}</div>
                    <div class="lib-supplier">
                        <i class="fa-solid fa-industry"></i> ${m.supplier || 'N/A'}
                    </div>
                    <div class="lib-color-row" style="justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="lib-color-preview" style="background-color: ${m.color || '#ccc'};"></div>
                            <span>${m.color || 'Standard'}</span>
                        </div>
                        <div class="usage-badge">
                            <i class="fa-solid fa-layer-group"></i> ${m.usageCount || 0} Styles
                        </div>
                    </div>
                </div>
            `;

            // Handlers
            card.querySelector('.btn-view-usage').addEventListener('click', (e) => {
                e.stopPropagation();
                openMaterialUsageDetails(m);
            });
            card.querySelector('.btn-delete-material').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteMaterial(m.id);
            });
            card.querySelector('.btn-edit-material').addEventListener('click', (e) => {
                e.stopPropagation();
                openEditMaterialModal(m);
            });

            materialsGrid.appendChild(card);
        });
    }

    function openEditMaterialModal(material) {
        document.getElementById('material-modal-title').textContent = "Edit Material";
        document.getElementById('material-id').value = material.id;
        document.getElementById('material-name').value = material.name;
        document.getElementById('material-type').value = material.type;
        document.getElementById('material-supplier').value = material.supplier || "";
        document.getElementById('material-color').value = material.color || "";
        document.getElementById('material-notes').value = material.notes || "";
        document.getElementById('modal-add-material').classList.add('active');
    }

    async function deleteMaterial(id) {
        if (!confirm('Are you sure you want to delete this material?')) return;
        try {
            await fetch(`${API_BASE_URL} /materials/${id} `, { method: 'DELETE' });
            fetchMaterials();
        } catch (error) {
            console.error('Failed to delete material:', error);
        }
    }

    async function fetchNotifications() {
        try {
            const response = await fetch(`${API_BASE_URL}/styles`);
            allStylesData = await response.json();

            notificationsData = [];

            deliveriesData.forEach(d => {
                notificationsData.push({
                    type: 'delivery',
                    title: 'New Delivery Reference Added',
                    desc: `Folder "${d.name}" was created.`,
                    time: new Date(d.createdDate),
                    iconClass: 'delivery',
                    iconHtml: '<i class="fa-solid fa-folder"></i>',
                    refId: d.id
                });
            });

            allStylesData.forEach(s => {
                const parentDelivery = deliveriesData.find(d => d.id === s.deliveryId);
                const folderName = parentDelivery ? parentDelivery.name : 'Unknown Folder';

                notificationsData.push({
                    type: 'style',
                    title: 'New Style Added',
                    desc: `Style ${s.no} was added to ${folderName}.`,
                    time: new Date(s.createdDate),
                    iconClass: 'style',
                    iconHtml: '<i class="fa-solid fa-shirt"></i>',
                    refId: s.id
                });
            });

            notificationsData.sort((a, b) => b.time - a.time);

            renderNotificationsDropdown();
            renderNotificationsFullView();
        } catch (error) {
            console.error('Failed to fetch notifications:', error);
        }
    }

    function timeAgo(date) {
        const seconds = Math.floor((new Date() - date) / 1000);
        let interval = seconds / 31536000;
        if (interval > 1) return Math.floor(interval) + " years ago";
        interval = seconds / 2592000;
        if (interval > 1) return Math.floor(interval) + " months ago";
        interval = seconds / 86400;
        if (interval > 1) return Math.floor(interval) + " days ago";
        if (interval >= 1) return "1 day ago";
        interval = seconds / 3600;
        if (interval > 1) return Math.floor(interval) + " hours ago";
        interval = seconds / 60;
        if (interval > 1) return Math.floor(interval) + " minutes ago";
        if (seconds < 10) return "Just now";
        return Math.floor(seconds) + " seconds ago";
    }

    function renderNotificationsDropdown() {
        const miniList = document.getElementById('notifications-list-mini');
        const badge = document.getElementById('notification-badge');
        if (!miniList) return;

        miniList.innerHTML = '';

        if (notificationsData.length === 0) {
            badge.style.display = 'none';
            miniList.innerHTML = '<div class="notifications-empty">No recent activity</div>';
            return;
        }

        badge.style.display = 'block';

        const topNotifs = notificationsData.slice(0, 5);
        topNotifs.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div class="notification-icon ${n.iconClass}">${n.iconHtml}</div>
                <div class="notification-content">
                    <div class="notification-title">${n.title}</div>
                    <div class="notification-desc">${n.desc}</div>
                    <div class="notification-time">${timeAgo(n.time)}</div>
                </div>
            `;
            miniList.appendChild(item);
        });
    }

    function renderNotificationsFullView() {
        const fullViewList = document.getElementById('notifications-timeline-full');
        if (!fullViewList) return;

        fullViewList.innerHTML = '';

        if (notificationsData.length === 0) {
            fullViewList.innerHTML = '<div class="notifications-empty" style="font-size: 1.1rem; padding: 4rem;">No activity history recorded yet.</div>';
            return;
        }

        notificationsData.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notification-item';
            item.innerHTML = `
                <div class="notification-icon ${n.iconClass}">${n.iconHtml}</div>
                <div class="notification-content">
                    <div class="notification-title" style="font-size: 1.05rem;">${n.title}</div>
                    <div class="notification-desc" style="font-size: 0.95rem;">${n.desc}</div>
                    <div class="notification-time" style="font-size: 0.85rem;">${timeAgo(n.time)}</div>
                </div>
            `;
            fullViewList.appendChild(item);
        });
    }

    function saveData() {
        // No-op: Overwritten by database implementation
    }

    let activeDeliveryId = null;

    // --- Persisted Login Check ---
    let activeSession = null;
    try { activeSession = JSON.parse(localStorage.getItem('bm_session')); } catch (e) { localStorage.removeItem('bm_session'); }
    // Validate session has required fields — reject incomplete/corrupt sessions
    if (activeSession && (!activeSession.userType || typeof activeSession.userType !== 'string')) {
        localStorage.removeItem('bm_session');
        activeSession = null;
    }
    if (activeSession) {
        currentUser = activeSession.userType;
        launchDashboard(activeSession.userType, activeSession.name || 'User', activeSession.fullRole || '', true);
    } else if (!loginCard) {
        currentUser = 'staff';
        launchDashboard('staff', 'Demo User', 'Staff Member', false);
    }

    function launchDashboard(userType, name, fullRole, isRestoring = false) {
        if (!isRestoring) {
            localStorage.setItem('bm_session', JSON.stringify({ userType, name, fullRole }));
        }

        if (loginCard) {
            loginCard.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
            loginCard.style.opacity = '0';
            loginCard.style.transform = 'scale(0.95)';
        }

        if (bgOverlay) {
            bgOverlay.style.transition = 'opacity 0.3s ease';
            bgOverlay.style.opacity = '0';
        }

        setTimeout(() => {
            if (loginCard) loginCard.style.display = 'none';
            if (bgOverlay) bgOverlay.style.display = 'none';
            if (mainApp) mainApp.style.display = 'none';

            const safeName = name || 'User';
            const safeRole = fullRole || '';
            document.getElementById('nav-name').textContent = safeName;
            document.getElementById('nav-role').textContent = safeRole;
            document.getElementById('nav-avatar').textContent = safeName.charAt(0).toUpperCase();

            dashboardCard.style.display = 'flex';
            dashboardCard.style.opacity = '0';

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

            const staffNav = document.getElementById('nav-staff-links');
            const teamNav = document.getElementById('nav-team-link');

            if (userType === 'admin') {
                document.getElementById('view-admin-dashboard').classList.add('active');
                document.getElementById('page-title').textContent = "Admin Control Center";
                if (staffNav) staffNav.style.display = 'none';
                if (teamNav) teamNav.style.display = 'flex';
                const adminHomeNav = document.getElementById('nav-admin-home');
                if (adminHomeNav) adminHomeNav.style.display = 'flex';
                const toolbar = document.querySelector('#view-deliveries .section-toolbar');
                if (toolbar) toolbar.style.display = 'none';
                Promise.all([fetchTemplates(), fetchMaterials()]).then(() => fetchDeliveries());
            } else {
                document.getElementById('view-deliveries').classList.add('active');
                document.getElementById('page-title').textContent = "Delivery References";
                if (staffNav) staffNav.style.display = 'block';
                if (teamNav) teamNav.style.display = 'none';
                Promise.all([fetchTemplates(), fetchMaterials()]).then(() => fetchDeliveries());
            }

            setTimeout(() => {
                dashboardCard.style.transition = 'opacity 0.4s ease';
                dashboardCard.style.opacity = '1';
                const chatWrapper = document.querySelector('.ai-chat-wrapper');
                if (chatWrapper) chatWrapper.style.display = 'flex';
            }, 50);

        }, 200);
    }

    // --- Workspace Rendering Logic ---
    const deliveriesGrid = document.getElementById('deliveries-grid');
    const stylesGrid = document.getElementById('styles-grid');
    const viewDeliveries = document.getElementById('view-deliveries');
    const viewStyles = document.getElementById('view-styles');
    const pageTitle = document.getElementById('page-title');
    const currentDeliveryName = document.getElementById('current-delivery-name');

    // --- Admin Dashboard Live Metrics & Card Navigation ---
    function updateAdminDashboardStats() {
        const statDeliveries = document.getElementById('admin-stat-deliveries');
        const statStyles = document.getElementById('admin-stat-styles');
        const statProcessing = document.getElementById('admin-stat-processing');
        const statFinished = document.getElementById('admin-stat-finished');
        const statTemplates = document.getElementById('admin-stat-templates');

        if (statDeliveries) statDeliveries.textContent = deliveriesData.length;
        if (statTemplates) statTemplates.textContent = trackingTemplates.length;

        // Count all styles across all deliveries
        let totalStyles = 0, totalProcessing = 0, totalFinished = 0;
        deliveriesData.forEach(del => {
            const delStyles = stylesData.filter(s => s.deliveryId === del.id);
            totalStyles += delStyles.length;
            totalProcessing += delStyles.filter(s => s.status === 'processing').length;
            totalFinished += delStyles.filter(s => s.status === 'finished').length;
        });

        if (statStyles) statStyles.textContent = totalStyles;
        if (statProcessing) statProcessing.textContent = totalProcessing;
        if (statFinished) statFinished.textContent = totalFinished;
    }

    // Wire up admin dashboard Quick Access cards
    const adminNavDeliveries = document.getElementById('admin-nav-deliveries');
    if (adminNavDeliveries) {
        adminNavDeliveries.addEventListener('click', () => {
            document.getElementById('nav-deliveries')?.click();
        });
    }

    const adminNavTemplates = document.getElementById('admin-nav-templates');
    if (adminNavTemplates) {
        adminNavTemplates.addEventListener('click', () => {
            document.getElementById('nav-templates')?.click();
        });
    }

    const adminNavLibraries = document.getElementById('admin-nav-libraries');
    if (adminNavLibraries) {
        adminNavLibraries.addEventListener('click', () => {
            document.getElementById('nav-libraries')?.click();
        });
    }

    const adminNavReports = document.getElementById('admin-nav-reports');
    if (adminNavReports) {
        adminNavReports.addEventListener('click', () => {
            document.getElementById('nav-reports')?.click();
        });
    }



    function renderDeliveries() {
        const searchTerm = (document.getElementById('search-deliveries')?.value || '').toLowerCase();
        const sortOrder = document.getElementById('sort-deliveries')?.value || 'newest';

        let filtered = deliveriesData.filter(del =>
            del.name.toLowerCase().includes(searchTerm) ||
            del.season.toLowerCase().includes(searchTerm)
        );

        filtered.sort((a, b) => {
            const dateA = new Date(a.createdDate).getTime();
            const dateB = new Date(b.createdDate).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        deliveriesGrid.innerHTML = '';
        if (filtered.length === 0) {
            deliveriesGrid.innerHTML = '<p style="color: #6B7280; grid-column: 1/-1;">No deliveries found matching your search.</p>';
            return;
        }

        filtered.forEach(del => {
            const card = document.createElement('div');
            card.className = 'folder-card';

            const dateObj = new Date(del.createdDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            card.innerHTML = `
                <button class="folder-options-btn"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                <div class="folder-dropdown">
                    <button class="folder-dropdown-item btn-act-rename"><i class="fa-solid fa-pen"></i> Rename Folder</button>
                    <button class="folder-dropdown-item btn-act-btn-duplicate"><i class="fa-regular fa-copy"></i> Duplicate</button>
                    <div class="folder-dropdown-divider"></div>
                    <button class="folder-dropdown-item text-danger btn-act-delete"><i class="fa-solid fa-trash-can"></i> Delete</button>
                </div>
                <div class="folder-icon"><i class="fa-regular fa-folder-open"></i></div>
                <h3>${del.name}</h3>
                <p>Season: ${del.season}</p>
                <div class="folder-meta" style="flex-direction: column; align-items: flex-start; gap: 0.8rem; border-top: 1px solid #F3F4F6; padding-top: 0.8rem; margin-top: 0.8rem;">
                    <span style="font-size: 0.75rem; color: #9CA3AF;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> Created ${formattedDate}</span>
                    <div style="display: flex; justify-content: space-between; width: 100%; align-items: center;">
                        <span>${del.items} Styles</span>
                        <i class="fa-solid fa-chevron-right"></i>
                    </div>
                </div>
            `;

            // Toggle dropdown
            const btnOptions = card.querySelector('.folder-options-btn');
            const dropdown = card.querySelector('.folder-dropdown');

            btnOptions.addEventListener('click', (e) => {
                e.stopPropagation();
                // Close other open dropdowns first
                document.querySelectorAll('.folder-dropdown.active').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                dropdown.classList.toggle('active');
            });

            // Handle clicking outside
            document.addEventListener('click', (e) => {
                if (dropdown.classList.contains('active') && !btnOptions.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });

            // Actions
            card.querySelector('.btn-act-rename').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                openRenameModal(del.id);
            });

            card.querySelector('.btn-act-btn-duplicate').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                duplicateDelivery(del.id);
            });

            card.querySelector('.btn-act-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                openDeleteModal(del.id);
            });

            card.addEventListener('click', () => openDelivery(del));
            deliveriesGrid.appendChild(card);
        });
    }

    function renderStyles(deliveryId) {
        const searchTerm = (document.getElementById('search-styles')?.value || '').toLowerCase();
        const sortOrder = document.getElementById('sort-styles')?.value || 'newest';

        let filteredStyles = stylesData.filter(s => s.deliveryId === deliveryId);

        filteredStyles = filteredStyles.filter(style =>
            style.no.toLowerCase().includes(searchTerm) ||
            style.desc.toLowerCase().includes(searchTerm) ||
            style.category.toLowerCase().includes(searchTerm)
        );

        filteredStyles.sort((a, b) => {
            const dateA = new Date(a.createdDate).getTime();
            const dateB = new Date(b.createdDate).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        stylesGrid.innerHTML = '';

        if (filteredStyles.length === 0) {
            stylesGrid.innerHTML = '<p style="color: #6B7280; grid-column: 1/-1;">No styles found matching your criteria.</p>';
            return;
        }

        filteredStyles.forEach(style => {
            const card = document.createElement('div');
            card.className = 'style-card';

            const dateObj = new Date(style.createdDate);
            const formattedDate = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            // Calculate Health
            const health = getStyleHealth(style);

            // Calculate Tracker Step & Status for List View Extra Details
            const template = getStyleTemplate(style);
            const steps = JSON.parse(template.steps || '[]');
            const currentStepName = (steps && steps[style.trackerStep]) ? steps[style.trackerStep].name : 'Completed';
            const statusText = style.status === 'finished' ? 'Finished' : 'Processing';
            const statusClass = style.status === 'finished' ? 'status-finished' : 'status-processing';

            card.innerHTML = `
                <div class="health-badge ${health.class}">
                    <i class="fa-solid ${health.icon}"></i> ${health.label}
                </div>
                ${style.hasMaterials ? '<div class="spec-ready-badge" title="Material Specification (BOM) Ready"><i class="fa-solid fa-file-circle-check"></i> Spec Ready</div>' : ''}
                ${getCoverHtml(style, false)}
                <div class="style-info">
                    <div class="style-category">${style.category}</div>
                    <div class="style-no">${style.no}</div>
                    <div class="style-desc">${style.desc}</div>
                    <div class="style-step-indicator" title="Current Step: ${currentStepName}">
                        <i class="fa-solid fa-bars-progress" style="margin-right: 6px; color: var(--color-primary);"></i>
                        <span style="font-size: 0.70rem; text-transform: uppercase; margin-right: 4px; color: var(--color-text-muted); font-weight: 600;">Step:</span> 
                        <span style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${currentStepName}</span>
                    </div>
                    <div class="style-meta" style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.8rem; padding-top: 0.5rem; border-top: 1px solid #F3F4F6;">
                        <span style="font-size: 0.75rem; color: #9CA3AF;"><i class="fa-regular fa-calendar" style="margin-right: 4px;"></i> Added ${formattedDate}</span>
                        <div style="position: relative; display: flex; align-items: center;">
                            <button class="folder-options-btn style-options-btn" style="position: relative; top: 0; right: 0; width: 28px; height: 28px; padding: 0; margin: -4px;"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                            <div class="folder-dropdown style-dropdown" style="top: auto; bottom: 100%; right: 0; margin-bottom: 0.5rem;">
                                <button class="folder-dropdown-item btn-act-btn-duplicate"><i class="fa-regular fa-copy"></i> Duplicate</button>
                                <div class="folder-dropdown-divider"></div>
                                <button class="folder-dropdown-item text-danger btn-act-delete"><i class="fa-solid fa-trash-can"></i> Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="list-view-status">
                    <div class="list-step-info" title="${currentStepName}">
                        <span class="step-label">Step</span>
                        <span class="step-val">${currentStepName}</span>
                    </div>
                    <div class="status-badge ${statusClass} list-status-badge">${statusText}</div>
                </div>
            `;

            // Toggle dropdown
            const btnOptions = card.querySelector('.folder-options-btn');
            const dropdown = card.querySelector('.folder-dropdown');

            btnOptions.addEventListener('click', (e) => {
                e.stopPropagation();
                document.querySelectorAll('.folder-dropdown.active').forEach(d => {
                    if (d !== dropdown) d.classList.remove('active');
                });
                dropdown.classList.toggle('active');
            });

            // Handle clicking outside
            document.addEventListener('click', (e) => {
                if (dropdown && dropdown.classList.contains('active') && !btnOptions.contains(e.target) && !dropdown.contains(e.target)) {
                    dropdown.classList.remove('active');
                }
            });

            // Actions
            card.querySelector('.btn-act-btn-duplicate').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                duplicateStyle(style.id);
            });

            card.querySelector('.btn-act-delete').addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.classList.remove('active');
                openDeleteStyleModal(style.id);
            });

            card.addEventListener('click', () => openStyleDetail(style));
            stylesGrid.appendChild(card);
        });
    }

    function openDelivery(delivery) {
        activeDeliveryId = delivery.id;
        currentDeliveryName.textContent = delivery.name;
        document.getElementById('back-to-styles-from-detail').textContent = delivery.name;
        pageTitle.textContent = "Styles Library";

        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        viewStyles.classList.add('active');

        fetchStyles(delivery.id);
    }

    function openStyleDetail(style) {
        if (!style) return;
        activeStyleId = style.id;
        const detailNo = document.getElementById('detail-style-no');
        if (detailNo) detailNo.textContent = style.no;
        if (pageTitle) pageTitle.textContent = "Style Details";

        const deliveryItem = deliveriesData.find(d => d.id === style.deliveryId);
        const deliveryName = deliveryItem ? deliveryItem.name : 'Unknown';

        // Pick a robust SVG placeholder if no image
        const fallbackImg = svgPlaceholder('👗', 'Style Pending');
        const imgUrl = style.image || fallbackImg;
        const isFinished = style.status === 'finished';
        const actionBtn = isFinished
            ? `<button class="btn-primary" id="btn-view-tracker" style="border-radius: 8px; font-weight: 500; font-size: 0.85rem; padding: 0 1.2rem; height: 36px; display: inline-flex; align-items: center; justify-content: center;"><i class="fa-solid fa-satellite-dish" style="margin-right: 6px;"></i> View Completed Tracker</button>`
            : `<button class="btn-primary" id="btn-live-tracker" style="border-radius: 8px; font-weight: 500; font-size: 0.85rem; padding: 0 1.2rem; height: 36px; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.25); border: none;"><i class="fa-solid fa-satellite-dish" style="margin-right: 6px;"></i> Live Tracker</button>`;

        const statusClass = isFinished ? 'status-finished' : 'status-processing';
        const statusText = isFinished ? 'Finished' : 'Under Processing';

        const deliveryDateStr = isFinished && style.deliveryDate ? style.deliveryDate : 'Pending...';

        const sizeRowsHtml = Object.entries(style.sizes || {})
            .filter(([key, val]) => val > 0)
            .map(([key, val]) => `<div class="size-row"><span>${key}:</span> <strong>${val}</strong></div>`)
            .join('') || '<div class="size-row"><span>N/A</span></div>';

        const detailContainer = document.querySelector('#view-style-detail .style-detail-container');
        detailContainer.innerHTML = `
            ${getCoverHtml(style, true)}
            <div class="detail-info-middle" style="flex: 1; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <div class="detail-header" style="margin-bottom: 0.75rem; border: none; padding: 0; display: flex; justify-content: space-between; align-items: flex-start;">
                        <div class="detail-title-group">
                            <div class="detail-category" style="font-size: 0.75rem; color: var(--color-primary); text-transform: uppercase; letter-spacing: 1px; font-weight: 700; margin-bottom: 0.25rem;">${style.category}</div>
                            <h2 style="font-size: 1.5rem; margin: 0 0 0.2rem 0; color: var(--color-text-main); font-family: var(--font-heading);">${style.desc}</h2>
                            <div class="detail-no" style="font-size: 1rem; color: var(--color-text-muted);">${style.no}</div>
                        </div>
                        <div class="status-badge ${statusClass}" style="padding: 0.35rem 0.8rem; font-size: 0.75rem;">${statusText}</div>
                    </div>
                    
                    <div class="detail-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(110px, 1fr)); gap: 1rem; margin-top: 1rem; margin-bottom: 1.5rem;">
                        <div class="detail-item">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Delivery</div>
                            <div style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-main);">${deliveryName}</div>
                        </div>
                        <div class="detail-item">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Color</div>
                            <div style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-main);">${style.color || 'Standard'}</div>
                        </div>
                        <div class="detail-item qty-hover-container">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Quantity</div>
                            <div class="qty-interactive" style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-main); cursor: pointer;">${style.qty} pcs <i class="fa-solid fa-circle-info" style="color: var(--color-text-muted); font-size: 0.8rem; margin-left:2px;"></i></div>
                            <div class="size-tooltip-bubble">
                                <div class="rb-header"><i class="fa-solid fa-chart-pie"></i> Size Breakdown</div>
                                <div class="rb-body">
                                    ${sizeRowsHtml}
                                </div>
                            </div>
                        </div>
                        <div class="detail-item">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Ordered</div>
                            <div style="font-size: 0.9rem; font-weight: 500; color: var(--color-text-main);">${style.orderDate}</div>
                        </div>
                        ${isFinished && style.deliveryDate ? `
                        <div class="detail-item">
                            <div style="font-size: 0.75rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Delivered</div>
                            <div style="font-size: 0.9rem; font-weight: 500; color: #10B981;">${style.deliveryDate}</div>
                        </div>` : ''}
                    </div>
                </div>

                <div style="display: flex; justify-content: space-between; align-items: center; border-top: 1px solid var(--color-border-light); padding-top: 1.25rem; margin-top: auto;">
                    <div style="display: flex; gap: 1rem; align-items: stretch; width: 100%; max-width: 450px;">
                        <div style="flex: 1; display: flex;">
                            ${actionBtn.replace('class="btn-primary"', 'class="btn-primary" style="width: 100%; border-radius: 8px; font-weight: 600; font-size: 0.9rem; padding: 0.75rem 0; height: 100%; margin: 0; display: inline-flex; align-items: center; justify-content: center; background: linear-gradient(135deg, var(--color-primary), var(--color-primary-dark)); box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15); border: none; box-sizing: border-box;"')}
                        </div>
                        <div style="flex: 1; display: flex;">
                            <button id="btn-edit-style" style="width: 100%; border-radius: 8px; font-weight: 600; font-size: 0.9rem; padding: 0.75rem 0; height: 100%; margin: 0; background: var(--color-bg-panel); color: var(--color-text-main); border: 1px solid var(--color-border); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); box-sizing: border-box;" onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 10px 15px -3px rgba(0,0,0,0.1), 0 0 0 3px var(--color-primary-light)'; this.style.borderColor='var(--color-primary)'; this.style.color='var(--color-primary)';" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 6px -1px rgba(0,0,0,0.05)'; this.style.borderColor='var(--color-border)'; this.style.color='var(--color-text-main)';"><i class="fa-solid fa-pen-to-square" style="margin-right: 8px; opacity: 0.8;"></i> Edit Specification</button>
                        </div>
                    </div>
                    ${style.lastEditedBy && style.lastEditedAt ? `
                    <div style="font-size: 0.75rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.4rem; background: var(--color-bg-hover); padding: 0.35rem 0.75rem; border-radius: 20px;">
                        <i class="fa-solid fa-clock-rotate-left" style="color: var(--color-primary);"></i>
                        <span>Last Updated By: <strong style="color: var(--color-text-main); font-weight: 600;">${style.lastEditedBy}</strong></span>
                    </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Load Manual BOM for this style
        const detailBomTbody = document.getElementById('detail-bom-manual-tbody');
        const detailNoBomMsg = document.getElementById('detail-no-bom-msg');
        if (detailBomTbody) detailBomTbody.innerHTML = '';

        const bomItems = typeof style.bomData === 'string' ? JSON.parse(style.bomData || "[]") : (style.bomData || []);

        if (bomItems.length > 0) {
            if (detailNoBomMsg) detailNoBomMsg.style.display = 'none';
            bomItems.forEach((item, idx) => {
                const tr = addBOMRow('detail-bom-manual-tbody', 'detail-no-bom-msg', item);
                if (tr) {
                    tr.dataset.styleId = style.id;
                    tr.dataset.bomIndex = idx;
                }
            });
        }
        else {
            if (detailNoBomMsg) detailNoBomMsg.style.display = 'block';
        }

        // We bypass the old fetchStyleMaterials as we are moving to manual BOM
        // fetchStyleMaterials(style.id);

        // Listeners for the dynamic action buttons — use onclick to REPLACE any previous listener
        // (addEventListener stacks listeners and causes wrong buttons to fire)
        const trackerBtn = document.getElementById('btn-live-tracker');
        if (trackerBtn) {
            trackerBtn.onclick = () => openTracker(style);
        }

        const viewTrackerBtn = document.getElementById('btn-view-tracker');
        if (viewTrackerBtn) {
            viewTrackerBtn.onclick = () => openTracker(style);
        }

        const editBtn = document.getElementById('btn-edit-style');
        if (editBtn) {
            editBtn.onclick = () => {
                // reset modal state first
                if (typeof window.resetEditStyleForm === 'function') window.resetEditStyleForm();

                // Populate the edit modal with current style data
                document.getElementById('edit-style-id').value = style.id;
                document.getElementById('edit-style-no').value = style.no;
                document.getElementById('edit-style-desc').value = style.desc;
                document.getElementById('edit-style-category').value = style.category;
                document.getElementById('edit-style-status').value = style.status;
                document.getElementById('edit-style-order-date').value = style.orderDate || '';
                document.getElementById('edit-style-due-date').value = style.dueDate || '';

                // Trigger date calculations for edit preview
                const editTrackingTemplateSelect = document.getElementById('edit-style-tracking-template');
                if (editTrackingTemplateSelect && style.trackingTemplateId) {
                    editTrackingTemplateSelect.value = style.trackingTemplateId;
                }
                setTimeout(() => calculatePreviewDates(true), 0); // push to microtask to ensure DOM is ready

                // Color Population
                const editColorHidden = document.getElementById('edit-style-color-hidden');
                const editCustomColorInput = document.getElementById('edit-custom-color-input');
                const editColorSwatches = document.querySelectorAll('#modal-edit-style .color-swatch');

                if (editColorHidden) editColorHidden.value = style.color || '';

                let foundSwatch = false;
                editColorSwatches.forEach(swatch => {
                    if (swatch.getAttribute('data-color') === style.color) {
                        swatch.classList.add('active');
                        foundSwatch = true;
                    }
                });

                if (!foundSwatch && style.color && editCustomColorInput) {
                    editCustomColorInput.value = style.color;
                }

                // Size Population
                const editSizeChipsContainer = document.getElementById('edit-size-chips');
                const editSelectedSizesContainer = document.getElementById('edit-selected-sizes-container');
                const editNoSizesMsg = document.getElementById('edit-no-sizes-msg');
                const editQtyInput = document.getElementById('edit-style-qty');

                const sz = style.sizes || {};

                Object.keys(sz).forEach(sizeName => {
                    const qty = sz[sizeName];
                    if (qty !== undefined) {
                        // Find or create chip
                        let chip = editSizeChipsContainer.querySelector(`.size-chip[data-size="${sizeName}"]`);
                        if (!chip) {
                            // Create custom chip if not exists
                            chip = document.createElement('button');
                            chip.type = 'button';
                            chip.className = 'size-chip';
                            chip.setAttribute('data-size', sizeName);
                            chip.textContent = sizeName;
                            const wrapper = document.getElementById('edit-custom-size-wrapper');
                            wrapper.insertBefore(chip, document.getElementById('edit-btn-custom-size'));
                        }

                        chip.classList.add('active');

                        // Create input node
                        editActiveSizes[sizeName] = qty;
                        const div = document.createElement('div');
                        div.className = 'dynamic-size-block';
                        div.setAttribute('data-size-ref', sizeName);
                        div.innerHTML = `
                            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.5rem; text-align: center; font-weight: 700;">${sizeName}</div>
                            <input type="number" class="dynamic-size-qty" placeholder="0" min="0" value="${qty}" style="width: 100%; text-align: center; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--color-border-light); background: var(--color-bg-dark); color: var(--color-text-main);">
                        `;
                        const input = div.querySelector('input');
                        input.addEventListener('input', (e) => {
                            editActiveSizes[sizeName] = parseInt(e.target.value) || 0;
                            let total = 0;
                            editSelectedSizesContainer.querySelectorAll('.dynamic-size-qty').forEach(i => total += parseInt(i.value) || 0);
                            if (editQtyInput) editQtyInput.value = total;
                        });

                        if (editNoSizesMsg) editNoSizesMsg.style.display = 'none';
                        editSelectedSizesContainer.appendChild(div);
                    }
                });

                if (editQtyInput) editQtyInput.value = style.qty || 0;

                // Tracking template dropdown
                const editTemplateSelect = document.getElementById('edit-style-tracking-template');
                if (editTemplateSelect) {
                    editTemplateSelect.innerHTML = '<option value="" disabled>Select Tracking Template</option>';
                    trackingTemplates.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = t.name;
                        if (t.id == style.trackingTemplateId) opt.selected = true;
                        editTemplateSelect.appendChild(opt);
                    });
                }

                // Image Preview
                const editImagePreview = document.getElementById('edit-image-preview');
                const editUploadPlaceholder = document.getElementById('edit-upload-placeholder');
                const editPreviewContainer = document.getElementById('edit-image-preview-container');

                if (style.image && editImagePreview) {
                    editImagePreview.src = style.image;
                    if (editUploadPlaceholder) editUploadPlaceholder.style.display = 'none';
                    if (editPreviewContainer) editPreviewContainer.style.display = 'block';
                }

                // BOM Population
                const editBomTbody = document.getElementById('edit-bom-manual-tbody');
                const editNoBomMsg = document.getElementById('edit-no-bom-msg');
                if (editBomTbody) editBomTbody.innerHTML = '';

                if (style.bomData && Array.isArray(style.bomData) && style.bomData.length > 0) {
                    if (editNoBomMsg) editNoBomMsg.style.display = 'none';
                    style.bomData.forEach(item => {
                        addBOMRow('edit-bom-manual-tbody', 'edit-no-bom-msg', item);
                    });
                } else {
                    if (editNoBomMsg) editNoBomMsg.style.display = 'block';
                }

                // Audit trail remark
                const auditDiv = document.getElementById('edit-style-audit-remark');
                const auditText = document.getElementById('edit-style-audit-text');
                if (auditDiv && auditText) {
                    if (style.lastEditedBy && style.lastEditedAt) {
                        const editDate = new Date(style.lastEditedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                        auditText.textContent = `Last edited on ${editDate} by ${style.lastEditedBy}`;
                        auditDiv.style.display = 'block';
                    } else {
                        auditDiv.style.display = 'none';
                    }
                }

                document.getElementById('modal-edit-style').classList.add('active');
            };
        }

        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.getElementById('view-style-detail').classList.add('active');
    }

    function goHome() {
        activeDeliveryId = null;
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));

        if (currentUser === 'admin') {
            pageTitle.textContent = "Admin Control Center";
            document.getElementById('view-admin-dashboard').classList.add('active');

            const toolbar = document.querySelector('#view-deliveries .section-toolbar');
            if (toolbar) toolbar.style.display = 'none';
        } else {
            const navDel = document.getElementById('nav-deliveries');
            if (navDel) navDel.classList.add('active');

            pageTitle.textContent = "Delivery References";

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            viewDeliveries.classList.add('active');

            const toolbar = document.querySelector('#view-deliveries .section-toolbar');
            if (toolbar) toolbar.style.display = 'flex';

            fetchDeliveries(); // Ensure up to date from database
        }

        // Show AI Helper Chatbot if it was hidden (reset visibility on home)
        const chatWrapper = document.querySelector('.ai-chat-wrapper');
        if (chatWrapper) chatWrapper.style.display = 'flex';
    }

    function goBackToStyles() {
        if (activeDeliveryId) {
            pageTitle.textContent = "Styles Library";
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            viewStyles.classList.add('active');

            const toolbar = document.querySelector('#view-styles .section-toolbar');
            if (toolbar) toolbar.style.display = 'flex';
        } else {
            pageTitle.textContent = "Delivery References";
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            viewDeliveries.classList.add('active');

            const toolbar = document.querySelector('#view-deliveries .section-toolbar');
            if (toolbar) toolbar.style.display = 'flex';
        }
    }

    // --- Live Tracker Logistics Logic ---
    const trackingSteps = [
        "Order Received",
        "Passed to Design Team",
        "Design Approved",
        "Given to Factory",
        "Factory Started Manufacturing",
        "Order Created by Factory",
        "Received in Warehouse",
        "Dispatched from Warehouse",
        "On the Way",
        "Received by Buyer"
    ];

    const modalLiveTracker = document.getElementById('modal-live-tracker');
    const timelineContainer = document.getElementById('tracker-timeline-container');
    const btnTrackerPrev = document.getElementById('btn-tracker-prev');
    const btnTrackerNext = document.getElementById('btn-tracker-next');
    const btnCloseTracker = document.getElementById('btn-close-tracker');

    // Header elements
    const trackerStyleName = document.getElementById('tracker-style-name');
    const trackerStyleNo = document.getElementById('tracker-style-no');

    let activeTrackerStyle = null;

    function getStyleTemplate(style) {
        if (!style.trackingTemplateId) return trackingTemplates[0] || { steps: JSON.stringify([]) };
        return trackingTemplates.find(t => t.id === style.trackingTemplateId) || trackingTemplates[0] || { steps: JSON.stringify([]) };
    }

    function calculateTimelineData(style) {
        let steps;
        if (style.trackingSteps) {
            steps = typeof style.trackingSteps === 'string' ? JSON.parse(style.trackingSteps) : style.trackingSteps;
        } else {
            const template = getStyleTemplate(style);
            steps = JSON.parse(template.steps || "[]");
        }
        const orderDate = new Date(style.orderDate);
        const actualDates = typeof style.actualCompletionDates === 'string' ? JSON.parse(style.actualCompletionDates || "{}") : (style.actualCompletionDates || {});

        let timeline = [];
        let cumulativeDelay = 0;

        steps.forEach((step, index) => {
            // Original target date: orderDate + cumulative duration of steps up to this one
            let originalDuration = 0;
            for (let i = 0; i <= index; i++) originalDuration += steps[i].duration;
            const originalTargetDate = new Date(orderDate.getTime() + (originalDuration * 24 * 60 * 60 * 1000));

            // Adjusted target date: original target + cumulative delay from previous steps
            const adjustedTargetDate = new Date(originalTargetDate.getTime() + (cumulativeDelay * 24 * 60 * 60 * 1000));

            let completionObj = actualDates[index];
            let completionDate = null;
            let completionUser = null;
            let completionRole = null;

            if (completionObj) {
                if (typeof completionObj === 'string') {
                    // Legacy Support: simple date string
                    completionDate = new Date(completionObj);
                } else {
                    // New Format: { date, user, role }
                    completionDate = new Date(completionObj.date);
                    completionUser = completionObj.user;
                    completionRole = completionObj.role;
                }
            }

            let stepDelay = 0;
            let status = 'pending'; // pending, completed, delayed, late

            if (completionDate) {
                // How many days after target was it completed? (Negative means early)
                stepDelay = Math.ceil((completionDate - adjustedTargetDate) / (24 * 60 * 60 * 1000));
                cumulativeDelay += stepDelay;
                status = 'completed';
            } else if (index < style.trackerStep) {
                // Completed but no date recorded (legacy or edge case)
                status = 'completed';
            } else if (index === style.trackerStep) {
                status = 'active';
                // Check if currently late
                const today = new Date();
                if (today > adjustedTargetDate) {
                    stepDelay = Math.ceil((today - adjustedTargetDate) / (24 * 60 * 60 * 1000));
                }
            }

            timeline.push({
                ...step,
                index,
                originalTargetDate,
                adjustedTargetDate,
                completionDate,
                completionUser,
                completionRole,
                delay: stepDelay,
                cumulativeDelayAtThisStep: cumulativeDelay,
                status
            });
        });

        return timeline;
    }

    function renderTimeline(style) {
        timelineContainer.innerHTML = '';
        const timelineData = calculateTimelineData(style);
        const currentStep = style.trackerStep;

        // OPTIMIZATION: Calculate this ONCE rather than O(N^2) times inside the loop
        const hasApprovalStepInTemplate = timelineData.some(step => step.type === 'approval');
        const hasDesignStepInTemplate = hasApprovalStepInTemplate || timelineData.some(step =>
            step.team?.toLowerCase().includes("design") ||
            step.name.toLowerCase().includes("design") ||
            step.name.toLowerCase().includes("artwork") ||
            step.name.toLowerCase().includes("approval")
        );

        // OPTIMIZATION: Use a DocumentFragment to avoid DOM thrashing layer-by-layer
        const fragment = document.createDocumentFragment();
        let targetScrollElement = null;

        timelineData.forEach((data, index) => {
            const isCompleted = data.status === 'completed';
            const isActive = data.status === 'active';
            const isFinalCompleted = isActive && index === timelineData.length - 1 && style.status === 'finished';

            let classList = "tracker-step";
            if (isCompleted || isFinalCompleted) classList += " completed";
            else if (isActive) classList += " active";

            if (data.delay > 0) classList += " delayed";

            let timestampHtml = '';
            let rejectionHtml = '';
            let rippleHtml = '';

            const formatDateTime = (date) => {
                if (!date) return 'N/A';
                return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' at ' +
                    date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            };

            const targetTimeStr = formatDateTime(data.adjustedTargetDate);
            const actualTimeStr = data.completionDate ? formatDateTime(data.completionDate) : null;

            if (isCompleted || isFinalCompleted) {
                timestampHtml = `
                    <div class="step-timing-clean">
                        <div class="timing-row completed">
                            <i class="fa-solid fa-circle-check"></i> 
                            <span>Done on: <strong>${actualTimeStr}</strong></span>
                        </div>
                        <div class="timing-row target">
                            <i class="fa-regular fa-clock"></i> 
                            <span>Target was: ${targetTimeStr}</span>
                        </div>
                    </div>
                `;

                if (data.completionUser && data.completionRole) {
                    timestampHtml += `
                    <div class="audit-badge-clean" style="margin-top: 0.5rem; color: #059669; font-size: 0.75rem; background: rgba(16, 185, 129, 0.05); padding: 0.3rem 0.6rem; border-radius: 4px; display: inline-block;">
                        <i class="fa-solid fa-user-check" style="margin-right: 0.3rem;"></i>
                        <span>Marked done by <strong>${data.completionUser}</strong> (${data.completionRole})</span>
                    </div>
                    `;
                }
            } else if (isActive) {
                timestampHtml = `
                    <div class="step-timing-clean">
                        <div class="timing-row active">
                            <i class="fa-solid fa-spinner fa-spin"></i> 
                            <span>Currently Processing...</span>
                        </div>
                        <div class="timing-row target">
                            <i class="fa-regular fa-calendar"></i> 
                            <span>Target: <strong>${targetTimeStr}</strong></span>
                        </div>
                    </div>
                `;
            } else {
                timestampHtml = `
                    <div class="step-timing-clean">
                        <div class="timing-row pending">
                            <i class="fa-regular fa-hourglass-half"></i> 
                            <span>Scheduled for: ${targetTimeStr}</span>
                        </div>
                    </div>
                `;
            }

            // Delay/Early Note
            let delayNote = '';
            if (data.delay > 0) {
                const delayText = isCompleted ? `${data.delay} day delay` : `Currently ${data.delay} days behind`;
                delayNote = `<div class="delay-note-clean"><i class="fa-solid fa-triangle-exclamation"></i> ${delayText}</div>`;
            } else if (data.delay < 0 && isCompleted) {
                const earlyText = `Finished ${Math.abs(data.delay)} days early`;
                delayNote = `<div class="delay-note-clean success" style="color: #059669; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15); padding: 0.4rem 0.6rem; border-radius: 6px; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap;"><i class="fa-solid fa-bolt"></i> ${earlyText}</div>`;
            }

            // Ripple Effect / Catch-up indicator
            if (data.cumulativeDelayAtThisStep > 0 && !isCompleted && !isFinalCompleted) {
                const originalStr = data.originalTargetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                rippleHtml = `<div class="ripple-warning-clean"><i class="fa-solid fa-wave-square"></i> Shifted from ${originalStr}</div>`;
            } else if (data.cumulativeDelayAtThisStep <= 0 && isCompleted && index > 0 && timelineData[index - 1].cumulativeDelayAtThisStep > 0) {
                // Just caught up!
                rippleHtml = `<div class="ripple-warning-clean caught-up" style="color: #059669; background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.15);"><i class="fa-solid fa-check-double"></i> Back on track!</div>`;
            }

            // 1. Determine if this step is an "Approval" step
            const isApprovalStep = data.type === 'approval' ||
                (!timelineData.some(s => s.type === 'approval') &&
                    (data.team?.toLowerCase().includes("design") || data.name.toLowerCase().includes("approval") || (!hasDesignStepInTemplate && index === 0)));

            if (isApprovalStep && style.designRejections > 0) {
                rejectionHtml = `<div class="rejection-badge"><div class="rb-header"><i class="fa-solid fa-message"></i> Designer Note</div><div class="rb-body">Modified <strong>${style.designRejections} time(s)</strong>.</div></div>`;
            }

            const div = document.createElement('div');
            div.className = classList;
            div.innerHTML = `
                <div class="step-circle"></div>
                <div class="step-content-clean">
                    <div class="step-header-clean">
                        <span class="step-title-clean">${data.name}</span>
                    </div>
                    ${rejectionHtml}
                    ${timestampHtml}
                    ${delayNote}
                    ${rippleHtml}
                </div>
            `;
            fragment.appendChild(div);

            // --- INJECT TRANSACTION SUB-TIMELINE ---
            const isTransactionStep = data.type === 'transaction';
            const subType = data.subType || 'bom'; // Default to bom for legacy support

            if (isTransactionStep) {
                const transactionWrapper = document.createElement('div');
                transactionWrapper.className = `transaction-wrapper-${subType}`;
                transactionWrapper.style.margin = '0.75rem 0 1.25rem 2.5rem';

                const toggleBtn = document.createElement('button');
                toggleBtn.className = 'btn-text btn-expand-transaction';
                toggleBtn.style.cssText = `
                    font-size: 0.75rem; 
                    font-weight: 600; 
                    color: var(--color-primary); 
                    display: flex; 
                    align-items: center; 
                    gap: 0.4rem; 
                    padding: 0.4rem 0.8rem; 
                    background: var(--color-bg-hover); 
                    border-radius: 6px; 
                    border: 1px solid var(--color-border-light);
                    cursor: pointer;
                    margin-bottom: 0.5rem;
                `;

                const subContainer = document.createElement('div');
                subContainer.className = 'transaction-sub-container';
                subContainer.style.cssText = `
                    display: none;
                    padding: 1.25rem;
                    background: var(--color-bg-hover);
                    border-left: 3px solid var(--color-border-light);
                    border-radius: 0 12px 12px 0;
                    position: relative;
                `;

                const labelMap = {
                    'bom': 'Materials',
                    'test': 'Lab Testing',
                    'washing': 'Washing/Treatment'
                };
                const displayLabel = labelMap[subType] || 'Sub-Tracking';

                toggleBtn.innerHTML = `<i class="fa-solid fa-location-arrow" style="color: var(--color-primary); margin-right: 0.5rem; transform: rotate(45deg);"></i> Track ${displayLabel} <i class="fa-solid fa-chevron-down" style="margin-left: 0.5rem; font-size: 0.8rem; opacity: 0.7;"></i>`;

                toggleBtn.addEventListener('click', () => {
                    const isHidden = subContainer.style.display === 'none';
                    subContainer.style.display = isHidden ? 'block' : 'none';
                    toggleBtn.innerHTML = isHidden
                        ? `<i class="fa-solid fa-location-arrow" style="color: var(--color-primary); margin-right: 0.5rem; transform: rotate(45deg);"></i> Hide ${displayLabel} Tracking <i class="fa-solid fa-chevron-up" style="margin-left: 0.5rem; font-size: 0.8rem; opacity: 0.7;"></i>`
                        : `<i class="fa-solid fa-location-arrow" style="color: var(--color-primary); margin-right: 0.5rem; transform: rotate(45deg);"></i> Track ${displayLabel} <i class="fa-solid fa-chevron-down" style="margin-left: 0.5rem; font-size: 0.8rem; opacity: 0.7;"></i>`;
                });

                if (subType === 'bom') {
                    const bomItems = typeof style.bomData === 'string' ? JSON.parse(style.bomData || "[]") : (style.bomData || []);
                    if (bomItems.length > 0) {
                        let bomHtml = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
                        bomItems.forEach((bomItem, bIdx) => {
                            if (!bomItem) return;
                            const currentStatus = (bomItem.status || '').trim().toLowerCase();
                            const isBomApproved = currentStatus === 'approved';
                            const itemTitle = `<strong>${bomItem.category}</strong>: ${bomItem.description} (${bomItem.color})`;

                            if (!isBomApproved) {
                                bomHtml += `
                                    <div class="bom-nested-item pending" style="padding: 0.75rem; background: var(--color-bg-panel); border: 1px solid var(--color-border-light); border-radius: 8px;">
                                        <div style="font-size: 0.85rem; margin-bottom: 0.4rem; color: var(--color-text-main);">${itemTitle}</div>
                                        <div style="font-size: 0.75rem; color: #D97706; display: flex; align-items: center; gap: 0.3rem; padding: 0.3rem 0.6rem; background: #FFFBEB; border-radius: 4px; border: 1px solid #FDE68A; width: fit-content;">
                                            <i class="fa-solid fa-lock" style="font-size: 0.7rem;"></i> Waiting for Approval
                                        </div>
                                    </div>`;
                            } else {
                                const actualDates = typeof bomItem.actualDates === 'string' ? JSON.parse(bomItem.actualDates || "{}") : (bomItem.actualDates || {});
                                const bSteps = [
                                    { name: "Sourcing Price / Supplier Approval", duration: 2 },
                                    { name: "PO Creation", duration: 2 },
                                    { name: "PPO Receive", duration: 2 },
                                    { name: "In-house", duration: 5 }
                                ];
                                let bActiveIdx = -1;
                                bSteps.forEach((s, idx) => {
                                    const cDateObj = actualDates[idx + 1] || actualDates[idx];
                                    if (!cDateObj && bActiveIdx === -1) bActiveIdx = idx;
                                });

                                let miniTimelineHtml = `<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; margin-top: 1.25rem; align-items: center; position: relative;">`;
                                miniTimelineHtml += `<div style="position: absolute; top: 12px; left: 10px; right: 10px; height: 2px; background: var(--color-border-light); z-index: 0;"></div>`;

                                bSteps.forEach((bStep, sIdx) => {
                                    let bStatusClass = 'tracker-mini-step pending';
                                    let bIcon = '<i class="fa-regular fa-circle"></i>';
                                    const cDateObj = actualDates[sIdx + 1] || actualDates[sIdx];
                                    if (cDateObj) {
                                        bStatusClass = 'tracker-mini-step completed';
                                        bIcon = '<i class="fa-solid fa-circle-check"></i>';
                                    } else if (sIdx === bActiveIdx) {
                                        bStatusClass = 'tracker-mini-step active';
                                        bIcon = '<i class="fa-solid fa-spinner fa-spin"></i>';
                                    }
                                    miniTimelineHtml += `
                                        <div class="${bStatusClass}" style="font-size: 0.8rem; padding: 0.45rem 0.75rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; position: relative; z-index: 1; background: var(--color-bg-panel); border: 1px solid var(--color-border-light); box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                            ${bIcon} ${bStep.name}
                                        </div>`;
                                    if (sIdx < bSteps.length - 1) {
                                        const arrowColor = cDateObj ? '#10B981' : 'var(--color-border-light)';
                                        miniTimelineHtml += `
                                            <div style="display: flex; align-items: center; justify-content: center; width: 24px; position: relative; z-index: 1;">
                                                <i class="fa-solid fa-chevron-right" style="color: ${arrowColor}; font-size: 0.75rem; filter: drop-shadow(0 1px 1px rgba(0,0,0,0.05));"></i>
                                                <i class="fa-solid fa-chevron-right" style="color: ${arrowColor}; font-size: 0.75rem; margin-left: -6px; opacity: 0.4;"></i>
                                            </div>`;
                                    }
                                });
                                miniTimelineHtml += `</div>`;

                                const isActiveMaterial = bActiveIdx !== -1 && bActiveIdx < bSteps.length;
                                bomHtml += `
                                    <div class="bom-nested-item active" style="padding: 1.5rem; background: var(--color-bg-panel); border: 1px solid var(--color-border-light); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); margin-bottom: 0.75rem; position: relative; ${isActiveMaterial ? 'border-left: 4px solid var(--color-primary);' : ''}">
                                        ${isActiveMaterial ? `<i class="fa-solid fa-arrow-right" style="position: absolute; left: -22px; top: 1.6rem; color: var(--color-primary); font-size: 1rem; filter: drop-shadow(0 0 4px rgba(212,175,55,0.4));"></i>` : ''}
                                        <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem; margin-bottom: 1.25rem; padding-bottom: 0.75rem; border-bottom: 1px dashed var(--color-border-light); flex-wrap: wrap;">
                                            <div style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); flex: 1; min-width: 200px; line-height: 1.4;">
                                                ${itemTitle}
                                            </div>
                                            <span style="font-size: 0.65rem; color: #065F46; background: #D1FAE5; padding: 0.25rem 0.75rem; border-radius: 999px; font-weight: 800; border: 1px solid #A7F3D0; white-space: nowrap; height: fit-content; text-transform: uppercase; letter-spacing: 0.05em;"><i class="fa-solid fa-check"></i> Approved</span>
                                        </div>
                                        ${miniTimelineHtml}
                                    </div>`;
                            }
                        });
                        bomHtml += `</div>`;
                        subContainer.innerHTML = bomHtml;
                    } else {
                        subContainer.innerHTML = `<div style="padding: 1rem; text-align: center; color: var(--color-text-muted); font-size: 0.85rem;"><i class="fa-solid fa-info-circle" style="margin-right: 0.5rem;"></i> No BOM items defined in style specification yet.</div>`;
                    }
                } else {
                    // Placeholder for TEST or WASHING
                    const testSteps = subType === 'test'
                        ? ["Lab Dip Submission", "Client FeedBack", "Bulk Test Received", "Test Report Approved"]
                        : ["Sample Sent for Wash", "Shade Band Approval", "Bulk Washing Started", "Washing Approved"];

                    let testHtml = `<div style="display: flex; flex-direction: column; gap: 1rem;">`;
                    testHtml += `<div class="nested-item active" style="padding: 1.5rem; background: var(--color-bg-panel); border: 1px solid var(--color-border-light); border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); border-left: 4px solid var(--color-primary);">`;
                    testHtml += `<div style="font-size: 0.95rem; font-weight: 700; color: var(--color-text-main); margin-bottom: 1.25rem;">${displayLabel} Status</div>`;
                    testHtml += `<div style="display: flex; gap: 0.75rem; flex-wrap: wrap; align-items: center; position: relative;">`;
                    testHtml += `<div style="position: absolute; top: 12px; left: 10px; right: 10px; height: 2px; background: var(--color-border-light); z-index: 0;"></div>`;

                    testSteps.forEach((sName, sIdx) => {
                        const isFirst = sIdx === 0;
                        testHtml += `
                            <div class="tracker-mini-step ${isFirst ? 'active' : 'pending'}" style="font-size: 0.8rem; padding: 0.45rem 0.75rem; border-radius: 20px; display: inline-flex; align-items: center; gap: 0.4rem; white-space: nowrap; position: relative; z-index: 1; background: var(--color-bg-panel); border: 1px solid var(--color-border-light); box-shadow: 0 1px 2px rgba(0,0,0,0.05);">
                                ${isFirst ? '<i class="fa-solid fa-spinner fa-spin"></i>' : '<i class="fa-regular fa-circle"></i>'} ${sName}
                            </div>`;
                        if (sIdx < testSteps.length - 1) {
                            testHtml += `
                                <div style="display: flex; align-items: center; justify-content: center; width: 24px; position: relative; z-index: 1;">
                                    <i class="fa-solid fa-chevron-right" style="color: var(--color-border-light); font-size: 0.75rem;"></i>
                                </div>`;
                        }
                    });

                    testHtml += `</div></div></div>`;
                    subContainer.innerHTML = testHtml;
                }

                transactionWrapper.appendChild(toggleBtn);
                transactionWrapper.appendChild(subContainer);
                fragment.appendChild(transactionWrapper);
            }
            // --- END BOM INJECTION ---

            if (isActive) {
                targetScrollElement = div;
            }
        }); // Restore missing closing bracket

        // Append all at once to avoid layout thrashing
        timelineContainer.appendChild(fragment);

        if (targetScrollElement) {
            // Use requestAnimationFrame for smoother tracking after paint
            requestAnimationFrame(() => {
                setTimeout(() => targetScrollElement.scrollIntoView({ behavior: 'smooth', block: 'center' }), 50);
            });
        }

        // --- Role-Based Access Control (RBAC) ---
        const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');
        const userType = sessionData.userType;
        const fullRole = sessionData.fullRole || 'Unknown';

        let canInteract = false;
        if (userType === 'admin') {
            canInteract = true;
        } else if (timelineData[currentStep] && timelineData[currentStep].team) {
            // Intelligent String Match: check if ANY of the required teams are included in the user's full role
            const requiredTeams = timelineData[currentStep].team.split(',').map(t => t.trim().toLowerCase()).filter(Boolean);
            const userRoleTitle = fullRole.toLowerCase();

            canInteract = requiredTeams.some(team => userRoleTitle.includes(team));
        }

        // We no longer set btn.disabled = true for RBAC, because a disabled button swallows all click 
        // events, preventing us from showing a custom toast. We only disable if we are strictly at the edges.
        btnTrackerPrev.disabled = currentStep === 0;
        btnTrackerNext.disabled = currentStep >= timelineData.length - 1 && style.status === 'finished';

        btnTrackerPrev.dataset.unauthorized = !canInteract ? "true" : "false";
        btnTrackerNext.dataset.unauthorized = !canInteract ? "true" : "false";

        btnTrackerPrev.dataset.requiredTeam = timelineData[currentStep]?.team || 'N/A';
        btnTrackerNext.dataset.requiredTeam = timelineData[currentStep]?.team || 'N/A';

        btnTrackerPrev.style.opacity = btnTrackerPrev.disabled || !canInteract ? "0.5" : "1";
        btnTrackerNext.style.opacity = btnTrackerNext.disabled || !canInteract ? "0.5" : "1";

        btnTrackerPrev.style.cursor = !canInteract ? "not-allowed" : "";
        btnTrackerNext.style.cursor = !canInteract ? "not-allowed" : "";
    }

    function getStyleHealth(style) {
        const timeline = calculateTimelineData(style);

        // Final health is determined by the cumulative delay at the CURRENT point in the timeline
        const currentData = timeline[style.trackerStep] || timeline[timeline.length - 1];
        const currentCumulativeDelay = currentData ? currentData.cumulativeDelayAtThisStep : 0;

        const isLateNow = currentCumulativeDelay > 0;

        if (style.status === 'finished') {
            return isLateNow ? { class: 'health-delayed', label: 'Delivered (Late)', icon: 'fa-clock' }
                : { class: 'health-ontime', label: 'Delivered (On Time)', icon: 'fa-check-double' };
        }

        if (isLateNow) {
            return { class: 'health-delayed', label: 'Delayed', icon: 'fa-triangle-exclamation' };
        }

        return { class: 'health-ontime', label: 'On Track', icon: 'fa-check' };
    }

    async function openTracker(style) {
        activeTrackerStyle = style;
        document.getElementById('tracker-style-name').textContent = style.desc;
        document.getElementById('tracker-style-no').textContent = `${style.no} • Qty: ${style.qty}`;
        document.getElementById('modal-live-tracker').classList.add('active');

        // Show BOM indicator if style has materials
        const bomIndicator = document.getElementById('tracker-bom-indicator');
        const materialSpecs = document.getElementById('tracker-material-specs');
        const trackerMaterialsList = document.getElementById('tracker-materials-list');

        trackerMaterialsList.innerHTML = '';
        materialSpecs.style.display = 'none';
        bomIndicator.style.display = 'none';

        try {
            const resp = await fetch(`${API_BASE_URL}/styles/${style.id}/materials`);
            const materials = await resp.json();

            if (materials.length > 0) {
                bomIndicator.style.display = 'flex';
                materialSpecs.style.display = 'block';

                materials.forEach(m => {
                    const chip = document.createElement('div');
                    chip.className = 'tracker-chip';
                    chip.innerHTML = `
                        <div class="usage-label">${m.usage}</div>
                        <div class="material-name">${m.name}</div>
                    `;
                    trackerMaterialsList.appendChild(chip);
                });
            }
        } catch (err) {
            console.error('Error fetching tracker materials:', err);
        }

        const styleTemplate = getStyleTemplate(style);
        const styleSteps = JSON.parse(styleTemplate.steps || "[]");

        // Ensure finished styles show all steps as completed
        if (style.status === 'finished' && style.trackerStep < styleSteps.length - 1) {
            style.trackerStep = styleSteps.length - 1;
            saveData();
        }

        renderTimeline(style);
        renderGanttChart(style);
        renderCPMChart(style);

        modalLiveTracker.classList.add('active');
    }

    // Tracker View Switching Logic
    document.querySelectorAll('.btn-tracker-view').forEach(btn => {
        btn.addEventListener('click', () => {
            const view = btn.dataset.view;

            // Toggle buttons
            document.querySelectorAll('.btn-tracker-view').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Toggle containers
            document.querySelectorAll('.tracker-view-container').forEach(c => {
                c.style.display = 'none';
                c.classList.remove('active');
            });
            const target = document.getElementById(`tracker-${view}-container`);
            target.style.display = 'block';
            target.classList.add('active');
        });
    });

    function getStepDates(style, steps) {
        const baseDate = new Date(style.orderDate || new Date());
        let currentDate = new Date(baseDate);

        return steps.map((step, index) => {
            const start = new Date(currentDate);
            const duration = parseInt(step.duration || 1);
            currentDate.setDate(currentDate.getDate() + duration);
            const end = new Date(currentDate);

            return {
                ...step,
                startDate: start,
                endDate: end,
                duration: duration
            };
        });
    }

    // Fullscreen Toggle Logic
    const btnTrackerFullscreen = document.getElementById('btn-tracker-fullscreen');
    const trackerModalContent = modalLiveTracker.querySelector('.modal-content');

    if (btnTrackerFullscreen) {
        btnTrackerFullscreen.addEventListener('click', () => {
            trackerModalContent.classList.toggle('tracker-fullscreen');
            const icon = btnTrackerFullscreen.querySelector('i');
            if (trackerModalContent.classList.contains('tracker-fullscreen')) {
                icon.classList.replace('fa-expand', 'fa-compress');
                btnTrackerFullscreen.style.background = '#111827';
                btnTrackerFullscreen.style.color = '#fff';
            } else {
                icon.classList.replace('fa-compress', 'fa-expand');
                btnTrackerFullscreen.style.background = '#F3F4F6';
                btnTrackerFullscreen.style.color = '#4B5563';
            }

            // Re-render charts to adjust to new width if needed
            renderGanttChart(activeTrackerStyle);
            renderCPMChart(activeTrackerStyle);
        });
    }

    function renderGanttChart(style) {
        const container = document.getElementById('tracker-gantt-container');
        const template = getStyleTemplate(style);
        const steps = JSON.parse(template.steps || "[]");
        const steppedData = getStepDates(style, steps);

        if (steps.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6B7280;">No steps defined for this template.</div>';
            return;
        }

        // Calculate total range for scaling
        const totalDuration = steppedData.reduce((sum, s) => sum + s.duration, 0);
        const barHeight = 42;

        let html = `<div class="gantt-wrapper">
            <div class="gantt-header">
                <div style="width: 200px;"></div>
                <div class="gantt-axis-label" style="flex:${totalDuration}">Project Timeline Schedule (${totalDuration} Days Total)</div>
            </div>
            <div style="position: relative; padding-bottom: 100px;">
                <div class="gantt-grid-lines">
                    ${Array(totalDuration + 1).fill(0).map(() => `<div class="gantt-grid-line"></div>`).join('')}
                </div>`;

        steppedData.forEach((step, index) => {
            let statusClass = 'pending';
            if (index < style.trackerStep) statusClass = 'completed';
            else if (index === style.trackerStep && style.status !== 'finished') statusClass = 'active';
            else if (style.status === 'finished') statusClass = 'completed';

            const startOffset = steppedData.slice(0, index).reduce((sum, s) => sum + s.duration, 0);

            html += `
                <div class="gantt-row">
                    <div class="gantt-step-name">${step.name}</div>
                    <div class="gantt-track">
                        <div class="gantt-bar ${statusClass}" 
                             style="left: ${(startOffset / totalDuration) * 100}%; 
                                    width: ${(step.duration / totalDuration) * 100}%;
                                    justify-content: center;
                                    ${statusClass === 'active' ? `background: var(--color-primary); color: #000; font-weight: 800; border: 2px solid #000; box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);` : ''}">
                            <span style="display: flex; align-items: center; gap: 4px;">
                                <i class="fa-solid ${statusClass === 'completed' ? 'fa-check-circle' : 'fa-clock'}" style="opacity: 0.7;"></i>
                                ${step.duration} Days
                            </span>
                        </div>
                    </div>
                </div>`;
        });

        html += `</div></div>`;
        container.innerHTML = html;
    }

    function renderCPMChart(style) {
        const container = document.getElementById('tracker-cpm-container');
        const template = getStyleTemplate(style);
        const steps = JSON.parse(template.steps || "[]");

        if (steps.length === 0) {
            container.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6B7280;">No steps defined for this template.</div>';
            return;
        }

        let html = `<div style="display: flex; flex-direction: column; align-items: center; gap: 3.5rem; padding: 2rem 0 100px 0;">`;

        steps.forEach((step, index) => {
            let statusClass = 'pending';
            let statusIcon = '<i class="fa-regular fa-circle" style="color: #D1D5DB; font-size: 1.2rem;"></i>';
            let activeStyles = '';

            if (index < style.trackerStep) {
                statusClass = 'completed';
                statusIcon = '<i class="fa-solid fa-circle-check" style="color: #10B981; font-size: 1.2rem;"></i>';
            } else if (index === style.trackerStep && style.status !== 'finished') {
                statusClass = 'active';
                statusIcon = '<i class="fa-solid fa-spinner fa-spin" style="color: var(--color-primary); font-size: 1.2rem;"></i>';
                activeStyles = 'background: #F5F3FF; border-color: var(--color-primary); transform: scale(1.05); z-index: 10;';
            } else if (style.status === 'finished') {
                statusClass = 'completed';
                statusIcon = '<i class="fa-solid fa-circle-check" style="color: #10B981; font-size: 1.2rem;"></i>';
            }

            html += `
                <div class="cpm-node ${statusClass}" style="position: relative; ${activeStyles}">
                    <div class="node-meta" style="margin-bottom: 8px;">
                        <span style="font-weight: 800; color: #9CA3AF;">STEP ${index + 1}</span>
                        ${statusIcon}
                    </div>
                    <div class="node-step" style="margin-bottom: 12px; line-height: 1.4;">${step.name}</div>
                    
                    <div style="display: flex; gap: 8px; flex-wrap: wrap;">
                        <div class="node-team" style="font-weight: 700; color: #374151;">${step.team}</div>
                        <div class="node-team" style="background: #ECFDF5; color: #065F46; font-weight: 700;">
                            <i class="fa-regular fa-clock" style="margin-right: 4px;"></i>${step.duration}d
                        </div>
                    </div>
                    
                    ${index < steps.length - 1 ? `
                        <div style="position: absolute; bottom: -3.5rem; left: 50%; transform: translateX(-50%); color: #D1D5DB; font-size: 2rem; opacity: 0.6;">
                            <i class="fa-solid fa-arrow-down"></i>
                        </div>
                    ` : ''}
                </div>`;
        });

        html += `</div>`;
        container.innerHTML = html;
    }

    if (btnCloseTracker) {
        btnCloseTracker.addEventListener('click', () => {
            modalLiveTracker.classList.remove('active');
        });
    }

    const modalDesignApproval = document.getElementById('modal-design-approval');
    const btnApproveDesign = document.getElementById('btn-approve-design');
    const btnRejectDesign = document.getElementById('btn-reject-design');
    const btnCancelApproval = document.getElementById('btn-cancel-approval');

    const modalConfirmNext = document.getElementById('modal-confirm-next');
    const btnConfirmNextYes = document.getElementById('btn-confirm-next-yes');
    const btnConfirmNextNo = document.getElementById('btn-confirm-next-no');
    const confirmNextStepName = document.getElementById('confirm-next-step-name');

    const modalConfirmRevert = document.getElementById('modal-confirm-revert');
    const btnConfirmRevertYes = document.getElementById('btn-confirm-revert-yes');
    const btnConfirmRevertNo = document.getElementById('btn-confirm-revert-no');
    const confirmRevertStepName = document.getElementById('confirm-revert-step-name');

    // BOM Status Confirmation
    const modalConfirmBOMStatus = document.getElementById('modal-confirm-bom-status');
    const btnConfirmBOMStatusYes = document.getElementById('btn-confirm-bom-status-yes');
    const btnConfirmBOMStatusNo = document.getElementById('btn-confirm-bom-status-no');

    // BOM Item Step Confirmation
    const modalConfirmBOMStep = document.getElementById('modal-confirm-bom-step');
    const btnConfirmBOMStepYes = document.getElementById('btn-confirm-bom-step-yes');
    const btnConfirmBOMStepNo = document.getElementById('btn-confirm-bom-step-no');

    // BOM Item Step Revert
    const modalRevertBOMStep = document.getElementById('modal-revert-bom-step');
    const btnRevertBOMStepYes = document.getElementById('btn-revert-bom-step-yes');
    const btnRevertBOMStepNo = document.getElementById('btn-revert-bom-step-no');

    let pendingStatusChange = null;
    let pendingBOMStepChange = null; // { tr, stepIdx, action: 'done' | 'revert' }

    if (btnCancelApproval) {
        btnCancelApproval.addEventListener('click', () => {
            modalDesignApproval.classList.remove('active');
        });
    }

    if (btnConfirmNextNo) {
        btnConfirmNextNo.addEventListener('click', () => {
            modalConfirmNext.classList.remove('active');
        });
    }

    if (btnConfirmBOMStatusNo) {
        btnConfirmBOMStatusNo.addEventListener('click', () => {
            modalConfirmBOMStatus.classList.remove('active');
            pendingStatusChange = null;
        });
    }

    if (btnConfirmBOMStatusYes) {
        btnConfirmBOMStatusYes.addEventListener('click', () => {
            if (pendingStatusChange) {
                const { badge, newStatus, tbodyId, description } = pendingStatusChange;
                const tr = badge.closest('tr');

                badge.textContent = newStatus;
                badge.className = `bom-status-badge status-${newStatus.toLowerCase()}`;

                // Track approval date
                if (newStatus === 'Approved') {
                    tr.dataset.approvalDate = new Date().toISOString();
                    // Ensure tracker starts at step 1 if it was at step 0
                    if (!tr.dataset.trackerStep || tr.dataset.trackerStep === "0") {
                        tr.dataset.trackerStep = "1";
                    }

                    // Add Track button if it doesn't exist
                    const actionDiv = tr.querySelector('td:last-child div') || tr.querySelectorAll('td')[9].querySelector('div');
                    if (actionDiv && !actionDiv.querySelector('.btn-bom-track')) {
                        const trackBtn = document.createElement('button');
                        trackBtn.type = 'button';
                        trackBtn.className = 'btn-bom-action btn-bom-track';
                        trackBtn.title = 'Track Item';
                        trackBtn.style.cssText = 'background: var(--color-primary-light); border: 1px solid var(--color-primary); color: var(--color-primary); cursor: pointer; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;';
                        trackBtn.innerHTML = '<i class="fa-solid fa-location-dot" style="font-size: 0.85rem;"></i>';
                        actionDiv.insertBefore(trackBtn, actionDiv.firstChild);

                        // Attach the track listener
                        trackBtn.addEventListener('click', (e) => {
                            e.stopPropagation();
                            openBOMItemTracker(tr);
                        });
                    }
                } else {
                    delete tr.dataset.approvalDate;
                    const trackBtn = tr.querySelector('.btn-bom-track');
                    if (trackBtn) trackBtn.remove();
                }

                if (tbodyId === 'detail-bom-manual-tbody' && typeof window.autoSaveBOM === 'function') {
                    window.autoSaveBOM();
                }
                modalConfirmBOMStatus.classList.remove('active');
                pendingStatusChange = null;
            }
        });
    }

    // Mark Done Confirmation
    if (btnConfirmBOMStepNo) {
        btnConfirmBOMStepNo.onclick = () => {
            modalConfirmBOMStep.classList.remove('active');
            pendingBOMStepChange = null;
        };
    }
    if (btnConfirmBOMStepYes) {
        btnConfirmBOMStepYes.onclick = () => {
            if (pendingBOMStepChange && pendingBOMStepChange.action === 'done') {
                const { tr, stepIdx } = pendingBOMStepChange;
                const actualDates = JSON.parse(tr.dataset.actualDates || "{}");
                const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');

                actualDates[stepIdx] = {
                    date: new Date().toISOString(),
                    user: sessionData.name || 'System',
                    role: sessionData.fullRole || 'User'
                };

                tr.dataset.actualDates = JSON.stringify(actualDates);
                tr.dataset.trackerStep = stepIdx + 1;

                renderBOMItemTimeline(tr);
                if (typeof window.autoSaveBOM === 'function') window.autoSaveBOM();

                modalConfirmBOMStep.classList.remove('active');
                pendingBOMStepChange = null;
            }
        };
    }

    // Revert Confirmation
    if (btnRevertBOMStepNo) {
        btnRevertBOMStepNo.onclick = () => {
            modalRevertBOMStep.classList.remove('active');
            pendingBOMStepChange = null;
        };
    }
    if (btnRevertBOMStepYes) {
        btnRevertBOMStepYes.onclick = () => {
            if (pendingBOMStepChange && pendingBOMStepChange.action === 'revert') {
                const { tr, stepIdx } = pendingBOMStepChange;
                const actualDates = JSON.parse(tr.dataset.actualDates || "{}");

                delete actualDates[stepIdx];
                tr.dataset.actualDates = JSON.stringify(actualDates);
                tr.dataset.trackerStep = stepIdx;

                renderBOMItemTimeline(tr);
                if (typeof window.autoSaveBOM === 'function') window.autoSaveBOM();

                modalRevertBOMStep.classList.remove('active');
                pendingBOMStepChange = null;
            }
        };
    }

    if (btnConfirmRevertNo) {
        btnConfirmRevertNo.addEventListener('click', () => {
            modalConfirmRevert.classList.remove('active');
        });
    }

    window.revertBOMStep = async function (styleId, bomIndex) {
        try {
            const resp = await fetch(`${API_BASE_URL}/styles/${styleId}`);
            const style = await resp.json();
            if (!style.bomData) return;

            const bomData = typeof style.bomData === 'string' ? JSON.parse(style.bomData) : style.bomData;
            const bomItem = bomData[bomIndex];
            if (!bomItem) return;

            const actualDates = typeof bomItem.actualDates === 'string' ? JSON.parse(bomItem.actualDates || "{}") : (bomItem.actualDates || {});

            // Find the last completed step
            let lastIdx = -1;
            for (let i = 3; i >= 0; i--) {
                if (actualDates[i + 1] || actualDates[i]) {
                    lastIdx = i;
                    break;
                }
            }

            if (lastIdx !== -1) {
                // Remove the date for this step
                delete actualDates[lastIdx + 1];
                delete actualDates[lastIdx];

                bomItem.actualDates = JSON.stringify(actualDates);

                await fetch(`${API_BASE_URL}/styles/${styleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bomData })
                });

                showToast(`Reverted ${bomItem.description} to previous step.`, "success");

                const updatedResp = await fetch(`${API_BASE_URL}/styles/${styleId}`);
                const updatedStyle = await updatedResp.json();
                activeTrackerStyle = updatedStyle;
                renderTimeline(updatedStyle);
                if (activeStyleId === styleId) openStyleDetail(updatedStyle);

                // Refresh the BOM details popup if it's open
                const activeBOMRow = document.querySelector(`.bom-row[data-style-id="${styleId}"][data-bom-index="${bomIndex}"]`);
                if (activeBOMRow) {
                    activeBOMRow.dataset.actualDates = JSON.stringify(actualDates);
                    renderBOMItemTimeline(activeBOMRow);
                }
            }
        } catch (error) {
            console.error('Error reverting BOM step:', error);
            showToast('Failed to revert BOM step.', 'error');
        }
    };

    // Helper to advance timeline
    // --- Advance BOM Step Logic (called from onclick in Live Tracker) ---
    window.advanceBOMStep = async function (styleId, bomIndex) {
        try {
            // 1. Fetch the latest style data to ensure we have current BOM
            const resp = await fetch(`${API_BASE_URL}/styles/${styleId}`);
            const style = await resp.json();
            if (!style.bomData) return;

            const bomData = typeof style.bomData === 'string' ? JSON.parse(style.bomData) : style.bomData;
            const bomItem = bomData[bomIndex];
            if (!bomItem) return;

            const actualDates = typeof bomItem.actualDates === 'string' ? JSON.parse(bomItem.actualDates || "{}") : (bomItem.actualDates || {});

            // 4 main steps (indices 0, 1, 2, 3)
            const bSteps = ["Sourcing", "PO", "PPO", "In-house"];
            let nextStepIdx = -1;

            for (let i = 0; i < 4; i++) {
                if (!actualDates[i + 1] && !actualDates[i]) { // check both legacy and current indices
                    nextStepIdx = i;
                    break;
                }
            }

            if (nextStepIdx !== -1) {
                const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');
                actualDates[nextStepIdx] = {
                    date: new Date().toISOString(),
                    user: sessionData.name || 'System',
                    role: sessionData.fullRole || 'User'
                };

                bomItem.actualDates = JSON.stringify(actualDates);

                // If it's the last step "In-house", mark the item as fully received in some way if needed
                // For now we just update the dates.

                // 2. Persist back to the style
                await fetch(`${API_BASE_URL}/styles/${styleId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ bomData })
                });

                showToast(`Advanced ${bomItem.description} to next step.`, "success");

                // Refetch and re-render the tracker
                const updatedResp = await fetch(`${API_BASE_URL}/styles/${styleId}`);
                const updatedStyle = await updatedResp.json();
                activeTrackerStyle = updatedStyle; // Update active style in memory
                renderTimeline(updatedStyle);
                if (activeStyleId === styleId) openStyleDetail(updatedStyle);

                // Refresh the BOM details popup if it's open
                const activeBOMRow = document.querySelector(`.bom-row[data-style-id="${styleId}"][data-bom-index="${bomIndex}"]`);
                if (activeBOMRow) {
                    activeBOMRow.dataset.actualDates = JSON.stringify(actualDates);
                    renderBOMItemTimeline(activeBOMRow);
                }
            }
        } catch (error) {
            console.error('Error advancing BOM step:', error);
            showToast('Failed to update BOM step.', 'error');
        }
    };

    async function advanceTimeline() {
        const template = getStyleTemplate(activeTrackerStyle);
        const steps = JSON.parse(template.steps || "[]");

        if (activeTrackerStyle.trackerStep < steps.length - 1 || (activeTrackerStyle.trackerStep === steps.length - 1 && activeTrackerStyle.status !== 'finished')) {
            const currentIndex = activeTrackerStyle.trackerStep;

            // Record completion date and user data for the CURRENT step being finished
            let actualDates = typeof activeTrackerStyle.actualCompletionDates === 'string' ? JSON.parse(activeTrackerStyle.actualCompletionDates || "{}") : (activeTrackerStyle.actualCompletionDates || {});

            const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');
            actualDates[currentIndex] = {
                date: new Date().toISOString(),
                user: sessionData.name || 'System',
                role: sessionData.fullRole || 'Unknown Role'
            };

            activeTrackerStyle.actualCompletionDates = JSON.stringify(actualDates);

            // Move to next step or finish
            if (activeTrackerStyle.trackerStep < steps.length - 1) {
                activeTrackerStyle.trackerStep++;
            } else {
                activeTrackerStyle.status = 'finished';
                activeTrackerStyle.deliveryDate = new Date().toISOString().split('T')[0];
            }

            try {
                // Persist to backend
                await fetch(`${API_BASE_URL}/styles/${activeTrackerStyle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trackerStep: activeTrackerStyle.trackerStep,
                        status: activeTrackerStyle.status,
                        deliveryDate: activeTrackerStyle.deliveryDate,
                        actualCompletionDates: activeTrackerStyle.actualCompletionDates
                    })
                });

                renderTimeline(activeTrackerStyle);
                openStyleDetail(activeTrackerStyle); // Refresh background view state
                if (activeDeliveryId) fetchStyles(activeDeliveryId); // Refresh grid
            } catch (error) {
                console.error('Failed to advance timeline:', error);
                alert('Connection error: Timeline progress not saved.');
            }
        }
    }

    // Helper to revert timeline
    async function revertTimeline() {
        if (activeTrackerStyle.trackerStep > 0 || activeTrackerStyle.status === 'finished') {

            if (activeTrackerStyle.status === 'finished') {
                activeTrackerStyle.status = 'processing';
                activeTrackerStyle.deliveryDate = null;
            } else {
                activeTrackerStyle.trackerStep--;
            }

            // Remove completion date for the new current step (since we're basically un-doing it)
            let actualDates = typeof activeTrackerStyle.actualCompletionDates === 'string' ? JSON.parse(activeTrackerStyle.actualCompletionDates || "{}") : (activeTrackerStyle.actualCompletionDates || {});
            delete actualDates[activeTrackerStyle.trackerStep];
            activeTrackerStyle.actualCompletionDates = JSON.stringify(actualDates);

            try {
                // Persist to backend
                await fetch(`${API_BASE_URL}/styles/${activeTrackerStyle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        trackerStep: activeTrackerStyle.trackerStep,
                        status: activeTrackerStyle.status,
                        deliveryDate: activeTrackerStyle.deliveryDate,
                        actualCompletionDates: activeTrackerStyle.actualCompletionDates
                    })
                });

                renderTimeline(activeTrackerStyle);
                openStyleDetail(activeTrackerStyle); // Refresh background view state
                if (activeDeliveryId) fetchStyles(activeDeliveryId); // Refresh grid
            } catch (error) {
                console.error('Failed to revert timeline:', error);
            }
        }
    }

    if (btnApproveDesign) {
        btnApproveDesign.addEventListener('click', () => {
            modalDesignApproval.classList.remove('active');
            advanceTimeline();
        });
    }

    if (btnRejectDesign) {
        btnRejectDesign.addEventListener('click', async () => {
            modalDesignApproval.classList.remove('active');
            // Rejected: Increment counter and stay on current step
            if (!activeTrackerStyle.designRejections) activeTrackerStyle.designRejections = 0;
            activeTrackerStyle.designRejections++;

            try {
                // Persist to backend database immediately so the badge doesn't disappear on refresh
                await fetch(`${API_BASE_URL}/styles/${activeTrackerStyle.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        designRejections: activeTrackerStyle.designRejections
                    })
                });

                renderTimeline(activeTrackerStyle);
                if (activeDeliveryId) fetchStyles(activeDeliveryId); // Refresh grid
            } catch (error) {
                console.error('Failed to save design rejection:', error);
                alert('Connection error: Note not saved.');
            }
        });
    }

    if (btnConfirmNextYes) {
        btnConfirmNextYes.addEventListener('click', () => {
            modalConfirmNext.classList.remove('active');
            advanceTimeline();
        });
    }

    if (btnConfirmRevertYes) {
        btnConfirmRevertYes.addEventListener('click', () => {
            modalConfirmRevert.classList.remove('active');
            revertTimeline();
        });
    }

    btnTrackerNext.addEventListener('click', () => {
        if (!activeTrackerStyle) return;

        // Premium RBAC Toast Interception
        if (btnTrackerNext.dataset.unauthorized === "true") {
            const teams = btnTrackerNext.dataset.requiredTeam.split(',').map(t => t.trim()).filter(Boolean);
            const teamDisplay = teams.length > 1 ? `<strong>${teams.join(', ')}</strong> teams` : `<strong>${teams[0]}</strong> team`;
            showToast(`Unauthorized: Only the ${teamDisplay} can mark this done.`, "error");
            return;
        }

        const template = getStyleTemplate(activeTrackerStyle);
        const steps = JSON.parse(template.steps || "[]");

        // Activity Type Interception
        const nextStepIndex = activeTrackerStyle.trackerStep + 1;
        if (nextStepIndex < steps.length) {
            const nextStep = steps[nextStepIndex];

            // 1. Explicit Approval Type
            if (nextStep.type === 'approval') {
                modalDesignApproval.classList.add('active');
                return;
            }

            // 2. Legacy Fallback (if no steps in template have an explicit 'approval' type)
            const hasExplicitApproval = steps.some(s => s.type === 'approval');
            if (!hasExplicitApproval) {
                const isLegacyDesign = nextStep.team?.toLowerCase().includes("design") ||
                    nextStep.name.toLowerCase().includes("design") ||
                    nextStep.name.toLowerCase().includes("artwork") ||
                    nextStep.name.toLowerCase().includes("approval");
                if (isLegacyDesign) {
                    modalDesignApproval.classList.add('active');
                    return;
                }
            }
        }

        // General Confirmation for all other steps
        if (nextStepIndex < steps.length) {
            confirmNextStepName.textContent = steps[nextStepIndex].name;
            modalConfirmNext.classList.add('active');
        } else {
            advanceTimeline(); // It's finished
        }
    });

    btnTrackerPrev.addEventListener('click', () => {
        if (!activeTrackerStyle) return;

        // Premium RBAC Toast Interception
        if (btnTrackerPrev.dataset.unauthorized === "true") {
            const teams = btnTrackerPrev.dataset.requiredTeam.split(',').map(t => t.trim()).filter(Boolean);
            const teamDisplay = teams.length > 1 ? `<strong>${teams.join(', ')}</strong> teams` : `<strong>${teams[0]}</strong> team`;
            showToast(`Unauthorized: Only the ${teamDisplay} can revert this step.`, "error");
            return;
        }

        if (activeTrackerStyle.trackerStep > 0 || activeTrackerStyle.status === 'finished') {
            const template = getStyleTemplate(activeTrackerStyle);
            const steps = JSON.parse(template.steps || "[]");
            const currentStepName = steps[activeTrackerStyle.trackerStep] ? steps[activeTrackerStyle.trackerStep].name : "the previous step";

            confirmRevertStepName.textContent = currentStepName;
            modalConfirmRevert.classList.add('active');
        }
    });
    document.getElementById('back-to-deliveries').addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
    });

    document.getElementById('back-to-deliveries-from-detail').addEventListener('click', (e) => {
        e.preventDefault();
        goHome();
    });

    document.getElementById('btn-back-to-styles').addEventListener('click', () => {
        goBackToStyles();
    });

    document.getElementById('back-to-styles-from-detail').addEventListener('click', (e) => {
        e.preventDefault();
        goBackToStyles();
    });

    document.getElementById('home-logo').addEventListener('click', () => {
        goHome();
    });

    // --- Placeholder "Coming Soon" Nav Links ---
    function showComingSoon(title, activeLinkId, fromStyleDetails = false) {
        document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));

        if (activeLinkId) {
            const link = document.getElementById(activeLinkId);
            if (link) link.classList.add('active');
        }

        document.getElementById('page-title').textContent = title;
        document.getElementById('view-coming-soon').classList.add('active');

        // Toggle Go Back Button
        const backToolbar = document.getElementById('coming-soon-toolbar');
        if (backToolbar) {
            backToolbar.style.display = fromStyleDetails ? 'flex' : 'none';
        }

        // Hide main toolbar
        const toolbar = document.querySelector('#view-deliveries .section-toolbar');
        if (toolbar) toolbar.style.display = 'none';
    }

    const btnBackComingSoon = document.getElementById('btn-back-from-coming-soon');
    if (btnBackComingSoon) {
        btnBackComingSoon.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-style-detail').classList.add('active');
            document.getElementById('page-title').textContent = "Style Details";
        });
    }

    const navLibraries = document.getElementById('nav-libraries');
    if (navLibraries) {
        navLibraries.addEventListener('click', (e) => {
            e.preventDefault();
            activeDeliveryId = null;
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navLibraries.classList.add('active');
            document.getElementById('view-libraries').classList.add('active');
            document.getElementById('page-title').textContent = "Global Materials Library";
            fetchMaterials();
        });
    }

    // --- Materials Search & Filter ---
    document.getElementById('search-materials')?.addEventListener('input', renderMaterials);
    document.getElementById('filter-material-type')?.addEventListener('change', renderMaterials);

    // --- Add Material Modal ---
    const btnAddMaterial = document.getElementById('btn-add-material');
    const modalMaterial = document.getElementById('modal-add-material');
    const formMaterial = document.getElementById('form-material');

    if (btnAddMaterial) {
        btnAddMaterial.addEventListener('click', () => {
            document.getElementById('material-modal-title').textContent = "Add New Material";
            formMaterial.reset();
            document.getElementById('material-id').value = "";
            modalMaterial.classList.add('active');
        });
    }

    if (formMaterial) {
        formMaterial.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('material-id').value;
            const data = {
                name: document.getElementById('material-name').value,
                type: document.getElementById('material-type').value,
                supplier: document.getElementById('material-supplier').value,
                color: document.getElementById('material-color').value,
                notes: document.getElementById('material-notes').value,
                createdDate: new Date().toISOString()
            };

            try {
                if (id) {
                    await fetch(`${API_BASE_URL}/materials/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                } else {
                    await fetch(`${API_BASE_URL}/materials`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(data)
                    });
                }
                modalMaterial.classList.remove('active');
                fetchMaterials();
            } catch (error) {
                console.error('Failed to save material:', error);
            }
        });
    }

    const navReports = document.getElementById('nav-reports');
    if (navReports) {
        navReports.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navReports.classList.add('active');

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-reports').classList.add('active');
            document.getElementById('page-title').textContent = "Analytics Dashboard";

            if (typeof renderReportsDashboard === 'function') renderReportsDashboard();
        });
    }

    // --- Recycle Bin Logic ---
    const navRecycle = document.getElementById('nav-recycle');
    if (navRecycle) {
        navRecycle.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navRecycle.classList.add('active');

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-recycle').classList.add('active');
            document.getElementById('page-title').textContent = "Recycle Bin";

            fetchRecycleBin();
        });
    }

    let recycleBinData = [];

    async function fetchRecycleBin() {
        try {
            const response = await fetch(`${API_BASE_URL}/recycle-bin`);
            recycleBinData = await response.json();
            renderRecycleBin();
        } catch (error) {
            console.error('Failed to fetch recycle bin:', error);
            showToast('Error loading recycle bin', 'error');
        }
    }

    function renderRecycleBin() {
        const tbody = document.getElementById('recycle-tbody');
        const emptyMsg = document.getElementById('recycle-empty-msg');
        const table = document.getElementById('recycle-table');
        const typeFilter = document.getElementById('filter-recycle-type')?.value || 'all';

        if (!tbody || !emptyMsg || !table) return;

        let filteredData = recycleBinData;
        if (typeFilter !== 'all') {
            filteredData = recycleBinData.filter(item => item.type === typeFilter);
        }

        tbody.innerHTML = '';

        if (filteredData.length === 0) {
            table.style.display = 'none';
            emptyMsg.style.display = 'block';
            return;
        }

        table.style.display = 'table';
        emptyMsg.style.display = 'none';

        filteredData.forEach(item => {
            const tr = document.createElement('tr');

            const dateStr = item.deletedAt ? new Date(item.deletedAt).toLocaleDateString(undefined, {
                year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
            }) : 'Unknown Date';

            tr.innerHTML = `
                <td style="padding: 1rem; font-weight: 500;">
                    ${item.name}
                </td>
                <td style="padding: 1rem;">
                    <span class="recycle-type-badge type-${item.type}">${item.type}</span>
                </td>
                <td style="padding: 1rem; color: var(--color-text-muted); font-size: 0.85rem;">
                    ${dateStr}
                </td>
                <td style="padding: 1rem; text-align: right; white-space: nowrap;">
                    <button class="recycle-restore-btn" data-id="${item.id}" data-type="${item.type}" title="Restore">
                        <i class="fa-solid fa-arrow-rotate-left"></i> Restore
                    </button>
                    <button class="recycle-delete-btn" data-id="${item.id}" data-type="${item.type}" title="Delete Permanently">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            const restoreBtn = tr.querySelector('.recycle-restore-btn');
            const deleteBtn = tr.querySelector('.recycle-delete-btn');

            restoreBtn.addEventListener('click', async () => {
                try {
                    await fetch(`${API_BASE_URL}/recycle-bin/restore`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: item.type, id: item.id })
                    });
                    showToast(`${item.type} restored successfully!`, 'success');
                    fetchRecycleBin();
                    // Background refresh main data
                    fetchDeliveries();
                    if (activeDeliveryId) fetchStyles(activeDeliveryId);
                    fetchMaterials();
                    fetchTemplates();
                } catch (err) {
                    showToast('Failed to restore item', 'error');
                }
            });

            deleteBtn.addEventListener('click', async () => {
                if (!confirm(`Are you sure you want to permanently delete this ${item.type}? This action cannot be undone.`)) return;
                try {
                    await fetch(`${API_BASE_URL}/recycle-bin/empty`, {
                        method: 'DELETE',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ type: item.type, id: item.id })
                    });
                    showToast(`${item.type} permanently deleted`, 'success');
                    fetchRecycleBin();
                } catch (err) {
                    showToast('Failed to delete item', 'error');
                }
            });

            tbody.appendChild(tr);
        });
    }

    const filterRecycleType = document.getElementById('filter-recycle-type');
    if (filterRecycleType) {
        filterRecycleType.addEventListener('change', renderRecycleBin);
    }

    const btnEmptyRecycle = document.getElementById('btn-empty-recycle');
    if (btnEmptyRecycle) {
        btnEmptyRecycle.addEventListener('click', async () => {
            if (recycleBinData.length === 0) {
                showToast("Recycle bin is already empty.", 'error');
                return;
            }
            if (!confirm("Are you sure you want to permanently delete ALL items in the recycle bin? This action cannot be undone!")) return;

            try {
                await fetch(`${API_BASE_URL}/recycle-bin/empty`, {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({}) // Empties all
                });
                showToast("Recycle bin emptied.", 'success');
                fetchRecycleBin();
            } catch (err) {
                showToast('Failed to empty recycle bin', 'error');
            }
        });
    }

    let statusChartInstance = null;
    let categoryChartInstance = null;
    let delayChartInstance = null;

    window.renderReportsDashboard = async function () {
        try {
            // Re-fetch all styles globally to ensure charts are always 100% current
            const response = await fetch(`${API_BASE_URL}/styles`);
            allStylesData = await response.json();

            // Fix sizes structure if missing
            allStylesData = allStylesData.map(s => {
                if (!s.sizes) s.sizes = { XS: 0, S: 0, M: s.qty || 0, L: 0, XL: 0, XXL: 0 };
                return s;
            });

            const totalCount = allStylesData.length;
            const finishedCount = allStylesData.filter(s => s.status === 'finished').length;
            const processingCount = totalCount - finishedCount;

            const stylesAtRiskCount = allStylesData.filter(s => {
                const health = getStyleHealth(s);
                return health.class === 'health-delayed' && s.status !== 'finished';
            }).length;

            document.getElementById('report-total-styles').textContent = totalCount;
            document.getElementById('report-total-finished').textContent = finishedCount;
            document.getElementById('report-total-processing').textContent = processingCount;
            document.getElementById('report-total-at-risk').textContent = stylesAtRiskCount;

            // Prepare Data for Category Bar Chart (volume by item count, not just style count, so we aggregate qty)
            const categoryData = {};
            allStylesData.forEach(s => {
                const cat = s.category || 'Other';
                if (!categoryData[cat]) categoryData[cat] = 0;
                categoryData[cat] += (parseInt(s.qty) || 0);
            });

            // Bottleneck Analysis Data
            const stepDelays = {};
            allStylesData.forEach(s => {
                const timeline = calculateTimelineData(s);
                timeline.forEach(data => {
                    if (!stepDelays[data.name]) stepDelays[data.name] = { totalDelay: 0, count: 0 };
                    if (data.delay > 0) {
                        stepDelays[data.name].totalDelay += data.delay;
                    }
                    stepDelays[data.name].count++;
                });
            });

            const delayBarLabels = Object.keys(stepDelays);
            const delayBarData = delayBarLabels.map(name => {
                const d = stepDelays[name];
                return d.count > 0 ? (d.totalDelay / d.count).toFixed(1) : 0;
            });

            // Destroy previous chart instances
            if (statusChartInstance) statusChartInstance.destroy();
            if (categoryChartInstance) categoryChartInstance.destroy();
            if (delayChartInstance) delayChartInstance.destroy();

            // 1. Doughnut Chart
            const ctxStatus = document.getElementById('chart-status-doughnut').getContext('2d');
            statusChartInstance = new Chart(ctxStatus, {
                type: 'doughnut',
                data: {
                    labels: ['Finished Items', 'Processing Items'],
                    datasets: [{
                        data: [finishedCount, processingCount],
                        backgroundColor: ['#10B981', '#3B82F6'],
                        hoverOffset: 4,
                        borderWidth: 0
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    cutout: '70%',
                    plugins: {
                        legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } }
                    }
                }
            });

            // 2. Bar Chart
            const ctxCat = document.getElementById('chart-category-bar').getContext('2d');
            categoryChartInstance = new Chart(ctxCat, {
                type: 'bar',
                data: {
                    labels: Object.keys(categoryData),
                    datasets: [{
                        label: 'Purchased Units',
                        data: Object.values(categoryData),
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderRadius: 6,
                        barThickness: 'flex',
                        maxBarThickness: 45
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#F3F4F6' }, border: { display: false } },
                        x: { grid: { display: false }, border: { display: false } }
                    },
                    plugins: {
                        legend: { display: false }
                    }
                }
            });

            // 3. Delay Bar Chart
            const ctxDelay = document.getElementById('chart-delay-bar').getContext('2d');
            delayChartInstance = new Chart(ctxDelay, {
                type: 'bar',
                data: {
                    labels: delayBarLabels,
                    datasets: [{
                        label: 'Avg. Days Delay',
                        data: delayBarData,
                        backgroundColor: (context) => {
                            const val = context.dataset.data[context.dataIndex];
                            return val > 2 ? 'rgba(239, 68, 68, 0.8)' : 'rgba(245, 158, 11, 0.8)';
                        },
                        borderRadius: 6
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y', // Horizontal bars for bottleneck
                    scales: {
                        x: { beginAtZero: true, title: { display: true, text: 'Avg. Days Late' } },
                        y: { grid: { display: false } }
                    },
                    plugins: { legend: { display: false } }
                }
            });

        } catch (error) {
            console.error('Failed to load reports dashboard data:', error);
        }
    };

    const navAdminHome = document.getElementById('nav-admin-home');
    if (navAdminHome) {
        navAdminHome.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navAdminHome.classList.add('active');
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-admin-dashboard').classList.add('active');
            document.getElementById('page-title').textContent = "Admin Control Center";
            updateAdminDashboardStats();
        });
    }

    const navTemplates = document.getElementById('nav-templates');
    if (navTemplates) {
        navTemplates.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navTemplates.classList.add('active');

            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-templates').classList.add('active');
            document.getElementById('page-title').textContent = "Tracking Templates";

            if (typeof renderTemplatesGrid === 'function') renderTemplatesGrid();
        });
    }

    const navTeam = document.getElementById('nav-team-link');
    if (navTeam) {
        navTeam.addEventListener('click', (e) => {
            e.preventDefault();
            showComingSoon('Team Management', 'nav-team-link');
        });
    }

    // --- Deliveries Nav Link (Go Home) ---
    const navDeliveries = document.getElementById('nav-deliveries');
    if (navDeliveries) {
        navDeliveries.addEventListener('click', (e) => {
            e.preventDefault();
            document.querySelectorAll('.sidebar-nav .nav-item').forEach(n => n.classList.remove('active'));
            navDeliveries.classList.add('active');
            goHome();
        });
    }

    // --- Header Icons ---

    const btnSettings = document.getElementById('btn-header-settings');
    const settingsDropdown = document.getElementById('settings-dropdown');

    if (btnSettings && settingsDropdown) {
        btnSettings.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            settingsDropdown.classList.toggle('active');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (settingsDropdown.classList.contains('active') && !btnSettings.contains(e.target) && !settingsDropdown.contains(e.target)) {
                settingsDropdown.classList.remove('active');
            }
        });
    }

    // --- Search & Sort Listeners ---
    const searchDelInput = document.getElementById('search-deliveries');
    const sortDelSelect = document.getElementById('sort-deliveries');
    const searchStylesInput = document.getElementById('search-styles');
    const sortStylesSelect = document.getElementById('sort-styles');

    if (searchDelInput) searchDelInput.addEventListener('input', renderDeliveries);
    if (sortDelSelect) sortDelSelect.addEventListener('change', renderDeliveries);

    if (searchStylesInput) searchStylesInput.addEventListener('input', () => {
        if (activeDeliveryId) renderStyles(activeDeliveryId);
    });
    if (sortStylesSelect) sortStylesSelect.addEventListener('change', () => {
        if (activeDeliveryId) renderStyles(activeDeliveryId);
    });

    // --- Layout Switcher Logic ---
    const layoutDelSelect = document.getElementById('view-layout-deliveries');
    const layoutStylesSelect = document.getElementById('view-layout-styles');

    function applyLayout(grid, layout) {
        grid.classList.remove('layout-tall', 'layout-list');
        if (layout === 'tall') grid.classList.add('layout-tall');
        if (layout === 'list') grid.classList.add('layout-list');
    }

    if (layoutDelSelect) {
        const savedDelLayout = localStorage.getItem('bm_del_layout') || 'tiles';
        layoutDelSelect.value = savedDelLayout;
        applyLayout(deliveriesGrid, savedDelLayout);

        layoutDelSelect.addEventListener('change', (e) => {
            const layout = e.target.value;
            applyLayout(deliveriesGrid, layout);
            localStorage.setItem('bm_del_layout', layout);
        });
    }

    if (layoutStylesSelect) {
        const savedStylesLayout = localStorage.getItem('bm_styles_layout') || 'tiles';
        layoutStylesSelect.value = savedStylesLayout;
        applyLayout(stylesGrid, savedStylesLayout);

        layoutStylesSelect.addEventListener('change', (e) => {
            const layout = e.target.value;
            applyLayout(stylesGrid, layout);
            localStorage.setItem('bm_styles_layout', layout);
        });
    }

    // --- Modals Logic ---
    const modalAddDelivery = document.getElementById('modal-add-delivery');
    const modalAddStyle = document.getElementById('modal-add-style');
    const modalEditStyle = document.getElementById('modal-edit-style');
    const modalRenameDelivery = document.getElementById('modal-rename-delivery');
    const modalConfirmDelete = document.getElementById('modal-confirm-delete');
    const modalConfirmDeleteStyle = document.getElementById('modal-confirm-delete-style');
    const modalAddBOMItem = document.getElementById('modal-add-bom-item');
    const formAddBOMItem = document.getElementById('form-add-bom-item');

    if (!modalAddStyle) console.error("CRITICAL: modal-add-style not found in DOM");
    if (!modalAddBOMItem) console.error("CRITICAL: modal-add-bom-item not found in DOM");

    // --- Action Functions for Folder 3-Dot Menus ---
    window.openRenameModal = (id) => {
        const del = deliveriesData.find(d => d.id === id);
        if (del) {
            document.getElementById('rename-delivery-id').value = id;
            document.getElementById('rename-delivery-name').value = del.name;
            modalRenameDelivery.classList.add('active');
        }
    };

    window.duplicateDelivery = async (id) => {
        const originalDel = deliveriesData.find(d => d.id === id);
        if (!originalDel) return;

        try {
            // Create the new delivery
            const res = await fetch(`${API_BASE_URL}/deliveries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: `${originalDel.name} (Copy)`,
                    season: originalDel.season || '',
                    createdDate: new Date().toISOString(),
                    items: originalDel.items || 0
                })
            });
            const newDelRes = await res.json();
            const newDeliveryId = newDelRes.id;

            // Fetch original styles
            const stylesRes = await fetch(`${API_BASE_URL}/styles?deliveryId=${id}`);
            const originalStyles = await stylesRes.json();

            // Duplicate each style sequentially
            for (const style of originalStyles) {
                const stylePayload = {
                    deliveryId: newDeliveryId,
                    no: style.no,
                    desc: style.desc,
                    color: style.color,
                    category: style.category,
                    sizes: typeof style.sizes === 'string' ? JSON.parse(style.sizes) : style.sizes,
                    qty: style.qty,
                    status: style.status,
                    trackerStep: style.trackerStep,
                    deliveryDate: style.deliveryDate,
                    orderDate: style.orderDate,
                    image: style.image,
                    createdDate: new Date().toISOString(),
                    designRejections: style.designRejections || 0
                };
                await fetch(`${API_BASE_URL}/styles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stylePayload)
                });
            }

            await fetchDeliveries();
        } catch (err) {
            console.error('Error duplicating delivery:', err);
        }
    };

    let deleteTargetId = null;
    window.openDeleteModal = (id) => {
        const del = deliveriesData.find(d => d.id === id);
        if (del) {
            deleteTargetId = id;
            document.getElementById('delete-delivery-name').textContent = del.name;
            modalConfirmDelete.classList.add('active');
        }
    };

    document.getElementById('btn-confirm-delete-yes').addEventListener('click', async () => {
        if (deleteTargetId !== null) {
            try {
                await fetch(`${API_BASE_URL}/deliveries/${deleteTargetId}`, {
                    method: 'DELETE'
                });
                await fetchDeliveries();

                if (activeDeliveryId === deleteTargetId) {
                    goHome();
                }

                modalConfirmDelete.classList.remove('active');
                deleteTargetId = null;
            } catch (err) {
                console.error('Error deleting delivery:', err);
            }
        }
    });

    document.getElementById('form-rename-delivery').addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('rename-delivery-id').value);
        const name = document.getElementById('rename-delivery-name').value;
        const index = deliveriesData.findIndex(d => d.id === id);
        if (index > -1) {
            try {
                await fetch(`${API_BASE_URL}/deliveries/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name })
                });

                await fetchDeliveries();

                if (activeDeliveryId === id) {
                    document.getElementById('current-delivery-name').textContent = name;
                }
            } catch (err) {
                console.error('Error renaming delivery:', err);
            }
        }
        modalRenameDelivery.classList.remove('active');
        e.target.reset();
    });

    window.duplicateStyle = async (id) => {
        const originalStyle = stylesData.find(s => s.id === id);
        if (!originalStyle) return;

        const stylePayload = {
            deliveryId: originalStyle.deliveryId,
            no: `${originalStyle.no}-COPY`,
            desc: originalStyle.desc,
            color: originalStyle.color,
            category: originalStyle.category,
            sizes: typeof originalStyle.sizes === 'string' ? JSON.parse(originalStyle.sizes) : originalStyle.sizes,
            qty: originalStyle.qty,
            status: originalStyle.status,
            trackerStep: originalStyle.trackerStep,
            deliveryDate: originalStyle.deliveryDate,
            orderDate: originalStyle.orderDate,
            image: originalStyle.image,
            createdDate: new Date().toISOString(),
            designRejections: originalStyle.designRejections || 0
        };

        try {
            await fetch(`${API_BASE_URL}/styles`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stylePayload)
            });
            await fetchDeliveries();
            if (activeDeliveryId) await fetchStyles(activeDeliveryId);
        } catch (err) {
            console.error('Error duplicating style:', err);
        }
    };

    let deleteStyleTargetId = null;
    window.openDeleteStyleModal = (id) => {
        const style = stylesData.find(s => s.id === id);
        if (style) {
            deleteStyleTargetId = id;
            document.getElementById('delete-style-name').textContent = style.no;
            modalConfirmDeleteStyle.classList.add('active');
        }
    };

    document.getElementById('btn-confirm-delete-style-yes').addEventListener('click', async () => {
        if (deleteStyleTargetId !== null) {
            try {
                await fetch(`${API_BASE_URL}/styles/${deleteStyleTargetId}`, {
                    method: 'DELETE'
                });
                await fetchDeliveries();
                if (activeDeliveryId) await fetchStyles(activeDeliveryId);

                modalConfirmDeleteStyle.classList.remove('active');
                deleteStyleTargetId = null;
            } catch (err) {
                console.error('Error deleting style:', err);
            }
        }
    });

    document.getElementById('btn-add-delivery').addEventListener('click', () => {
        modalAddDelivery.classList.add('active');
    });

    const sumSizes = (prefix) => {
        // Only used by edit-style form now
        const xs = parseInt(document.getElementById(`${prefix}-size-xs`).value) || 0;
        const s = parseInt(document.getElementById(`${prefix}-size-s`).value) || 0;
        const m = parseInt(document.getElementById(`${prefix}-size-m`).value) || 0;
        const l = parseInt(document.getElementById(`${prefix}-size-l`).value) || 0;
        const xl = parseInt(document.getElementById(`${prefix}-size-xl`).value) || 0;
        const xxl = parseInt(document.getElementById(`${prefix}-size-xxl`).value) || 0;
        document.getElementById(`${prefix}-qty`).value = xs + s + m + l + xl + xxl;
    };

    document.querySelectorAll('.edit-size-input').forEach(input => {
        input.addEventListener('input', () => sumSizes('edit-style'));
    });

    const btnAddStyle = document.getElementById('btn-add-style');
    if (btnAddStyle) {
        btnAddStyle.addEventListener('click', () => {
            if (modalAddStyle) modalAddStyle.classList.add('active');
            else console.error("modalAddStyle is null, cannot open");
        });
    } else {
        console.warn("btn-add-style not found in current view");
    }

    // Close Modals
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            modalAddDelivery.classList.remove('active');

            // Special reset for Add Style Modal
            if (modalAddStyle.classList.contains('active')) {
                const frm = document.getElementById('form-new-style');
                if (frm) frm.reset();
                if (typeof resetAddStyleForm === 'function') resetAddStyleForm();
            }
            modalAddStyle.classList.remove('active');

            if (modalEditStyle) modalEditStyle.classList.remove('active');
            if (modalRenameDelivery) modalRenameDelivery.classList.remove('active');
            if (modalConfirmDelete) modalConfirmDelete.classList.remove('active');
            if (modalConfirmDeleteStyle) modalConfirmDeleteStyle.classList.remove('active');
            if (modalAddBOMItem) modalAddBOMItem.classList.remove('active');
            deleteTargetId = null;
            deleteStyleTargetId = null;
        });
    });

    // --- Add Style Modal UI Logic ---
    const addStyleTabs = document.querySelectorAll('#modal-add-style .tab-btn');
    const btnNextTab = document.getElementById('btn-next-tab');
    const btnPrevTab = document.getElementById('btn-prev-tab');
    const btnSubmitStyle = document.getElementById('btn-submit-style');

    let currentTabIndex = 0;

    function updateTabs(tabIndex) {
        const totalTabs = 4;
        const tabBtns = document.querySelectorAll('#modal-add-style .tab-btn');
        tabBtns.forEach((btn, index) => {
            btn.classList.toggle('active', index === tabIndex);
        });
        // Use each button's data-tab attribute to show the correct content div
        tabBtns.forEach((btn, index) => {
            const contentId = btn.getAttribute('data-tab');
            const content = document.getElementById(contentId);
            if (content) content.classList.toggle('active', index === tabIndex);
        });
        if (btnPrevTab) btnPrevTab.style.display = tabIndex === 0 ? 'none' : 'inline-block';
        if (tabIndex === totalTabs - 1) {
            if (btnNextTab) btnNextTab.style.display = 'none';
            if (btnSubmitStyle) btnSubmitStyle.style.display = 'inline-block';
        } else {
            if (btnNextTab) btnNextTab.style.display = 'inline-block';
            if (btnSubmitStyle) btnSubmitStyle.style.display = 'none';
        }
    }

    addStyleTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            currentTabIndex = index;
            updateTabs(currentTabIndex);
        });
    });

    if (btnNextTab) {
        btnNextTab.addEventListener('click', () => {
            if (currentTabIndex < 3) {
                currentTabIndex++;
                updateTabs(currentTabIndex);
            }
        });
    }

    if (btnPrevTab) {
        btnPrevTab.addEventListener('click', () => {
            if (currentTabIndex > 0) {
                currentTabIndex--;
                updateTabs(currentTabIndex);
            }
        });
    }

    // --- Edit Style Modal UI Logic ---
    const editStyleTabs = document.querySelectorAll('#modal-edit-style .tab-btn');
    const btnEditNextTab = document.getElementById('edit-btn-next-tab');
    const btnEditPrevTab = document.getElementById('edit-btn-prev-tab');
    const btnEditSubmitStyle = document.getElementById('edit-btn-submit-style');

    let currentEditTabIndex = 0;

    function updateEditTabs(tabIndex) {
        const totalTabs = 4;
        const editTabBtns = document.querySelectorAll('#modal-edit-style .tab-btn');
        editTabBtns.forEach((btn, index) => {
            btn.classList.toggle('active', index === tabIndex);
        });
        // Use each button's data-tab attribute to show the correct content div
        editTabBtns.forEach((btn, index) => {
            const contentId = btn.getAttribute('data-tab');
            const content = document.getElementById(contentId);
            if (content) content.classList.toggle('active', index === tabIndex);
        });
        if (btnEditPrevTab) btnEditPrevTab.style.display = tabIndex === 0 ? 'none' : 'inline-block';
        if (tabIndex === totalTabs - 1) {
            if (btnEditNextTab) btnEditNextTab.style.display = 'none';
            if (btnEditSubmitStyle) btnEditSubmitStyle.style.display = 'inline-block';
        } else {
            if (btnEditNextTab) btnEditNextTab.style.display = 'inline-block';
            if (btnEditSubmitStyle) btnEditSubmitStyle.style.display = 'none';
        }
    }

    editStyleTabs.forEach((tab, index) => {
        tab.addEventListener('click', () => {
            currentEditTabIndex = index;
            updateEditTabs(currentEditTabIndex);
        });
    });

    if (btnEditNextTab) {
        btnEditNextTab.addEventListener('click', () => {
            if (currentEditTabIndex < 3) {
                currentEditTabIndex++;
                updateEditTabs(currentEditTabIndex);
            }
        });
    }

    if (btnEditPrevTab) {
        btnEditPrevTab.addEventListener('click', () => {
            if (currentEditTabIndex > 0) {
                currentEditTabIndex--;
                updateEditTabs(currentEditTabIndex);
            }
        });
    }

    // --- Image Drag & Drop Logic ---
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('style-image-file');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');

    const editUploadZone = document.getElementById('edit-upload-zone');
    const editFileInput = document.getElementById('edit-style-image-file');
    const editUploadPlaceholder = document.getElementById('edit-upload-placeholder');
    const editPreviewContainer = document.getElementById('edit-image-preview-container');
    const editImagePreview = document.getElementById('edit-image-preview');
    const editRemoveImageBtn = document.getElementById('edit-remove-image');

    function initImageUpload(zone, input, placeholder, container, preview, removeBtn) {
        if (!zone) return;
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            zone.addEventListener(eventName, () => zone.classList.remove('dragover'));
        });

        zone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                input.files = files;
                handleImageFile(files[0], placeholder, container, preview);
            }
        });

        if (input) {
            input.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    handleImageFile(this.files[0], placeholder, container, preview);
                }
            });
        }

        if (removeBtn) {
            removeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (input) input.value = '';
                container.style.display = 'none';
                placeholder.style.display = 'block';
            });
        }
    }

    function handleImageFile(file, placeholder, container, preview) {
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = e => {
                preview.src = e.target.result;
                placeholder.style.display = 'none';
                container.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    }

    initImageUpload(uploadZone, fileInput, uploadPlaceholder, previewContainer, imagePreview, removeImageBtn);
    initImageUpload(editUploadZone, editFileInput, editUploadPlaceholder, editPreviewContainer, editImagePreview, editRemoveImageBtn);

    // --- Color Tab Interactivity ---
    const colorSwatches = document.querySelectorAll('#modal-add-style .color-swatch');
    const customColorInputH = document.getElementById('custom-color-input');
    const finalColorHidden = document.getElementById('style-color-hidden'); // Fixed ID from style-color

    const editColorSwatches = document.querySelectorAll('#modal-edit-style .color-swatch');
    const editCustomColorInputH = document.getElementById('edit-custom-color-input');
    const editFinalColorHidden = document.getElementById('edit-style-color-hidden');

    function initColorSelection(swatches, input, hidden) {
        if (!swatches.length || !input || !hidden) return;
        swatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                swatches.forEach(s => s.classList.remove('active'));
                swatch.classList.add('active');
                input.value = '';
                hidden.value = swatch.getAttribute('data-color');
            });
        });

        input.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            hidden.value = val;
            if (val.length > 0) {
                swatches.forEach(s => s.classList.remove('active'));
            }
        });
    }

    initColorSelection(colorSwatches, customColorInputH, finalColorHidden);
    initColorSelection(editColorSwatches, editCustomColorInputH, editFinalColorHidden);

    // --- Size Chips Logic ---

    function initSizeChips(containerId, chipsId, qtyInputId, customBtnId, customContainerId, customInputId, addBtnId, activeSizesObj, noMsgId) {
        const container = document.getElementById(containerId);
        const chips = document.getElementById(chipsId);
        const qtyInput = document.getElementById(qtyInputId);
        const customBtn = document.getElementById(customBtnId);
        const customContainer = document.getElementById(customContainerId);
        const customInput = document.getElementById(customInputId);
        const addBtn = document.getElementById(addBtnId);
        const noMsg = document.getElementById(noMsgId);

        if (!container || !chips) return;

        function recalculate() {
            let total = 0;
            container.querySelectorAll('.dynamic-size-qty').forEach(input => {
                total += parseInt(input.value) || 0;
            });
            if (qtyInput) qtyInput.value = total;
        }

        function createNode(size) {
            if (activeSizesObj[size] !== undefined) return;
            activeSizesObj[size] = 0;
            const div = document.createElement('div');
            div.className = 'dynamic-size-block';
            div.setAttribute('data-size-ref', size);
            div.innerHTML = `
                <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.5rem; text-align: center; font-weight: 700;">${size}</div>
                <input type="number" class="dynamic-size-qty" placeholder="0" min="0" style="width: 100%; text-align: center; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--color-border-light); background: var(--color-bg-dark); color: var(--color-text-main);">
            `;
            const input = div.querySelector('input');
            input.addEventListener('input', (e) => {
                activeSizesObj[size] = parseInt(e.target.value) || 0;
                recalculate();
            });
            if (noMsg) noMsg.style.display = 'none';
            container.appendChild(div);
        }

        function removeNode(size) {
            delete activeSizesObj[size];
            const block = container.querySelector(`[data-size-ref="${size}"]`);
            if (block) block.remove();
            if (Object.keys(activeSizesObj).length === 0 && noMsg) noMsg.style.display = 'block';
            recalculate();
        }

        chips.addEventListener('click', (e) => {
            const chip = e.target.closest('.size-chip:not(.custom-size-btn)');
            if (!chip) return;
            const size = chip.getAttribute('data-size');
            chip.classList.toggle('active');
            if (chip.classList.contains('active')) createNode(size);
            else removeNode(size);
        });

        if (customBtn) {
            customBtn.addEventListener('click', () => {
                customContainer.style.display = customContainer.style.display === 'none' ? 'flex' : 'none';
                if (customContainer.style.display === 'flex') customInput.focus();
            });
        }

        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const val = customInput.value.trim().toUpperCase();
                if (val) {
                    const existing = chips.querySelector(`[data-size="${val}"]`);
                    if (existing) {
                        if (!existing.classList.contains('active')) existing.click();
                    } else {
                        const chip = document.createElement('button');
                        chip.type = 'button';
                        chip.className = 'size-chip active';
                        chip.setAttribute('data-size', val);
                        chip.textContent = val;
                        const wrapper = containerId.includes('edit') ? document.getElementById('edit-custom-size-wrapper') : document.getElementById('custom-size-wrapper');
                        wrapper.insertBefore(chip, customBtn);
                        createNode(val);
                    }
                    customInput.value = '';
                    customContainer.style.display = 'none';
                }
            });
        }
    }

    initSizeChips('selected-sizes-container', 'size-chips', 'style-qty', 'btn-custom-size', 'custom-size-container', 'custom-size-input', 'btn-add-custom-size', activeSizes, 'no-sizes-msg');
    initSizeChips('edit-selected-sizes-container', 'edit-size-chips', 'edit-style-qty', 'edit-btn-custom-size', 'edit-custom-size-container', 'edit-custom-size-input', 'edit-btn-add-custom-size', editActiveSizes, 'edit-no-sizes-msg');

    // --- Manual BOM Logic ---
    function addBOMRow(tbodyId, noMsgId, data = null) {
        const tbody = document.getElementById(tbodyId);
        const noMsg = document.getElementById(noMsgId);
        if (!tbody) return;

        if (noMsg) noMsg.style.display = 'none';

        const tr = document.createElement('tr');
        tr.className = 'bom-row';

        // Ensure data is not null for simple property access
        const rowData = data || {
            category: '',
            description: '',
            color: '',
            size: '',
            gsm: '',
            composition: '',
            uom: '',
            consumption: 0,
            creationDate: new Date().toISOString(),
            status: 'Pending',
            trackerStep: 0,
            actualDates: {}
        };

        // Ensure these exist for older data
        if (!rowData.creationDate) rowData.creationDate = new Date().toISOString();
        if (!rowData.status) rowData.status = 'Pending';
        if (rowData.trackerStep === undefined) rowData.trackerStep = 0;
        if (!rowData.actualDates) rowData.actualDates = {};

        // Store data in the row for easier access
        tr.dataset.creationDate = rowData.creationDate;
        if (rowData.approvalDate) tr.dataset.approvalDate = rowData.approvalDate;
        tr.dataset.trackerStep = rowData.trackerStep;
        tr.dataset.actualDates = JSON.stringify(rowData.actualDates);

        let statusIcon = '';
        let stLower = (rowData.status || 'Pending').toLowerCase();
        if (stLower === 'pending') statusIcon = '<i class="fa-regular fa-clock" style="margin-right: 4px;"></i>';
        else if (stLower === 'approved') statusIcon = '<i class="fa-solid fa-check" style="margin-right: 4px;"></i>';
        else if (stLower === 'rejected') statusIcon = '<i class="fa-solid fa-xmark" style="margin-right: 4px;"></i>';

        tr.innerHTML = `
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light); font-weight: 500; color: var(--color-text-main);">${rowData.category || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.description || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.color || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.size || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.gsm || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.composition || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light);">${rowData.uom || ''}</td>
            <td style="padding: 0.75rem; border-bottom: 1px solid var(--color-border-light); font-weight: 600; color: var(--color-primary);">${rowData.consumption || '0'}</td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light); text-align: center; position: relative;">
                <span class="bom-status-badge status-${stLower}" data-status="${rowData.status || 'Pending'}">${statusIcon}${rowData.status || 'Pending'}</span>
            </td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light); text-align: center; white-space: nowrap;">
                <div class="bom-action-group">
                    ${stLower === 'approved' ? `
                        <button type="button" class="btn-bom-action btn-bom-track" title="Track Item" style="background: var(--color-primary-light); border: 1px solid var(--color-primary); color: var(--color-primary); cursor: pointer; padding: 6px; border-radius: 4px; display: flex; align-items: center; justify-content: center; transition: all 0.2s;">
                            <i class="fa-solid fa-location-dot" style="font-size: 0.85rem;"></i>
                        </button>
                    ` : ''}
                    <button type="button" class="btn-bom-action btn-bom-edit edit-btn" title="Edit Item">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button type="button" class="btn-bom-action btn-bom-delete delete-btn" title="Delete Item">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            </td>
        `;

        const trackBtn = tr.querySelector('.btn-bom-track');
        if (trackBtn) {
            trackBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                openBOMItemTracker(tr);
            });
        }

        const statusBadge = tr.querySelector('.bom-status-badge');
        if (statusBadge) {
            statusBadge.addEventListener('click', (e) => {
                e.stopPropagation();

                const statusBadge = e.currentTarget;
                const tr = statusBadge.closest('tr');
                const description = tr.querySelectorAll('td')[1].textContent;
                const currentStatus = statusBadge.dataset.status || statusBadge.textContent.trim();
                const tbodyId = statusBadge.closest('tbody').id;

                const popup = document.createElement('div');
                popup.className = 'bom-status-popup';
                popup.innerHTML = `
                    <button class="status-opt opt-approve"><i class="fa-solid fa-check"></i> Approve</button>
                    <button class="status-opt opt-reject"><i class="fa-solid fa-xmark"></i> Reject</button>
                    <button class="status-opt opt-pending"><i class="fa-solid fa-clock"></i> Pending</button>
                `;

                // Improved positioning: check for viewport boundaries
                const rect = statusBadge.getBoundingClientRect();
                const viewportHeight = window.innerHeight;
                const popupEstimatedHeight = 150; // Approximated height

                let top = rect.bottom + 5;
                if (top + popupEstimatedHeight > viewportHeight) {
                    // Show above the badge if not enough space below
                    top = rect.top - popupEstimatedHeight - 5;
                    if (top < 0) top = 10; // Fallback
                }

                popup.style.top = `${window.scrollY + top}px`;
                popup.style.left = `${window.scrollX + rect.left}px`;
                document.body.appendChild(popup);

                popup.querySelectorAll('.status-opt').forEach(opt => {
                    opt.addEventListener('click', () => {
                        let newStatus = opt.textContent.trim();
                        // Map short labels to full statuses
                        if (newStatus === 'Approve') newStatus = 'Approved';
                        if (newStatus === 'Reject') newStatus = 'Rejected';

                        if (newStatus !== currentStatus) {
                            // Enhancement: Show item description in confirmation modal
                            const modal = document.getElementById('modal-confirm-bom-status');
                            const descEl = document.getElementById('bom-status-confirm-item');
                            const statusEl = document.getElementById('bom-status-confirm-new');

                            if (descEl) descEl.textContent = description;
                            if (statusEl) statusEl.textContent = newStatus;

                            pendingStatusChange = { badge: statusBadge, newStatus, tbodyId, description };
                            if (modal) modal.classList.add('active');
                        }
                        popup.remove();
                    });
                });

                // Close on outside click
                const closePopup = (ev) => {
                    if (!popup.contains(ev.target) && ev.target !== statusBadge) {
                        popup.remove();
                        document.removeEventListener('click', closePopup);
                    }
                };
                setTimeout(() => document.addEventListener('click', closePopup), 0);
            });
        }

        const editBtn = tr.querySelector('.btn-bom-edit');
        if (editBtn) {
            editBtn.addEventListener('click', (e) => {
                e.stopPropagation();

                const tds = tr.querySelectorAll('td');
                document.getElementById('bom-item-category').value = tds[0].textContent || 'Fabric';
                document.getElementById('bom-item-desc').value = tds[1].textContent || '';
                document.getElementById('bom-item-color').value = tds[2].textContent || '';
                document.getElementById('bom-item-size').value = tds[3].textContent || '';
                document.getElementById('bom-item-gsm').value = tds[4].textContent || '';
                document.getElementById('bom-item-composition').value = tds[5].textContent || '';
                document.getElementById('bom-item-uom').value = tds[6].textContent || 'Meters';
                document.getElementById('bom-item-cons').value = tds[7].textContent || '';

                window.editingBOMRow = tr;

                const modalAddBOMItem = document.getElementById('modal-add-bom-item');
                if (modalAddBOMItem) {
                    const title = modalAddBOMItem.querySelector('.modal-header h3');
                    if (title) title.textContent = 'Edit BOM Specification Item';
                    modalAddBOMItem.classList.add('active');
                }
            });
        }

        tr.querySelector('.btn-bom-delete').addEventListener('click', (e) => {
            e.stopPropagation();
            tr.remove();
            if (tbody.children.length === 0 && noMsg) noMsg.style.display = 'block';

            // Auto-save if this is the Live Tracker modal table
            if (tbodyId === 'detail-bom-manual-tbody' && typeof window.autoSaveBOM === 'function') {
                window.autoSaveBOM();
            }
        });

        tbody.appendChild(tr);
        return tr;
    }

    function getBOMData(tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody) return [];
        const rows = tbody.querySelectorAll('.bom-row');
        const data = [];
        rows.forEach(row => {
            const tds = row.querySelectorAll('td');
            data.push({
                category: tds[0].textContent,
                description: tds[1].textContent,
                color: tds[2].textContent,
                size: tds[3].textContent,
                gsm: tds[4].textContent,
                composition: tds[5].textContent,
                uom: tds[6].textContent,
                consumption: parseFloat(tds[7].textContent) || 0,
                status: tds[8].querySelector('.bom-status-badge')
                    ? (tds[8].querySelector('.bom-status-badge').dataset.status || tds[8].querySelector('.bom-status-badge').textContent.trim())
                    : 'Pending',
                creationDate: row.dataset.creationDate,
                approvalDate: row.dataset.approvalDate,
                trackerStep: parseInt(row.dataset.trackerStep) || 0,
                actualDates: row.dataset.actualDates ? JSON.parse(row.dataset.actualDates) : {}
            });
        });
        return data;
    }

    // --- BOM Item Tracker Logic ---
    function openBOMItemTracker(tr) {
        const modal = document.getElementById('modal-bom-item-tracker');
        const title = document.getElementById('bom-tracker-title');
        const subtitle = document.getElementById('bom-tracker-subtitle');
        const tds = tr.querySelectorAll('td');

        if (title) title.textContent = `${tds[1].textContent} Tracking`;
        if (subtitle) subtitle.textContent = `Category: ${tds[0].textContent} | Approved Material`;

        renderBOMItemTimeline(tr);
        if (modal) modal.classList.add('active');
    }

    function renderBOMItemTimeline(tr) {
        const container = document.getElementById('bom-tracker-timeline-container');
        if (!container) return;

        container.innerHTML = '';
        const styleId = tr.dataset.styleId;
        const bomIndex = tr.dataset.bomIndex;
        const actualDates = JSON.parse(tr.dataset.actualDates || "{}");

        const steps = [
            { name: "Sourcing", duration: 2 },
            { name: "PO Creation", duration: 2 },
            { name: "PPO Receive", duration: 2 },
            { name: "In-house", duration: 5 }
        ];

        let activeIdx = -1;
        let lastCompletedIdx = -1;
        steps.forEach((s, idx) => {
            const isDone = actualDates[idx + 1] || actualDates[idx];
            if (isDone) {
                lastCompletedIdx = idx;
            } else if (activeIdx === -1) {
                activeIdx = idx;
            }
        });

        const isAllDone = activeIdx === -1;
        const currentStepName = isAllDone ? "Fully Received" : steps[activeIdx].name;

        // Progress percentage for the line (0, 33, 66, 100)
        let progressPct = 0;
        if (isAllDone) progressPct = 100;
        else if (lastCompletedIdx !== -1) {
            progressPct = ((lastCompletedIdx + 1) / (steps.length - 1)) * 100;
            if (progressPct > 100) progressPct = 100;
        }

        // Create Line Tracker HTML
        let nodesHtml = '';
        steps.forEach((s, idx) => {
            const isDone = actualDates[idx + 1] || actualDates[idx];
            const isActive = idx === activeIdx;

            let nodeColor = '#E5E7EB';
            let nodeIcon = 'fa-circle';
            let iconColor = '#9CA3AF';

            if (isDone) {
                nodeColor = '#10B981';
                nodeIcon = 'fa-circle-check';
                iconColor = '#fff';
            } else if (isActive) {
                nodeColor = '#3B82F6';
                nodeIcon = 'fa-spinner fa-spin';
                iconColor = '#fff';
            }

            nodesHtml += `
                <div style="position: relative; z-index: 3; display: flex; flex-direction: column; align-items: center; width: 60px;">
                    <div style="width: 24px; height: 24px; border-radius: 50%; background: ${nodeColor}; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 0 4px var(--color-bg-panel); color: ${iconColor}; font-size: 0.8rem; margin-bottom: 0.5rem;">
                        <i class="fa-solid ${nodeIcon}"></i>
                    </div>
                    <span style="font-size: 0.65rem; font-weight: 700; text-align: center; color: ${isActive ? 'var(--color-primary)' : 'var(--color-text-muted)'}; line-height: 1.1; display: block; width: 80px;">${s.name}</span>
                </div>
            `;
        });

        const lineViewHtml = `
            <div class="bom-line-tracker" style="position: relative; display: flex; justify-content: space-between; align-items: flex-start; margin: 1.5rem 0 2.5rem 0; padding: 0 10px;">
                <div style="position: absolute; top: 12px; left: 40px; right: 40px; height: 4px; background: #E5E7EB; z-index: 1; border-radius: 10px;"></div>
                <div style="position: absolute; top: 12px; left: 40px; width: calc(${progressPct}% - 80px); height: 4px; background: #10B981; z-index: 2; transition: width 0.6s cubic-bezier(0.34, 1.56, 0.64, 1); border-radius: 10px;">
                    <!-- Animated flow arrow tip for the green line -->
                    <div style="position: absolute; right: -8px; top: -6px; width: 16px; height: 16px; background: #10B981; clip-path: polygon(0 0, 100% 50%, 0 100%, 30% 50%);"></div>
                </div>
                ${nodesHtml}
            </div>
        `;

        const buttonsHtml = `
            <div style="display: flex; gap: 0.75rem; margin-top: 1.5rem;">
                ${lastCompletedIdx !== -1 ? `
                    <button class="btn-text" onclick="revertBOMStep(${styleId}, ${bomIndex})" style="flex: 1; border: 1px solid #FDE68A; color: #92400E; background: #FFFBEB; border-radius: 8px; padding: 0.75rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s ease;">
                        <i class="fa-solid fa-arrow-rotate-left"></i> Go back
                    </button>
                ` : ''}
                ${!isAllDone ? `
                    <button class="btn-primary" onclick="advanceBOMStep(${styleId}, ${bomIndex})" style="flex: 1; background: var(--color-primary); border-radius: 8px; padding: 0.75rem; font-size: 0.85rem; font-weight: 600; display: flex; align-items: center; justify-content: center; gap: 0.4rem; transition: all 0.2s ease;">
                        <i class="fa-solid fa-forward"></i> Move to next step
                    </button>
                ` : ''}
            </div>
        `;

        container.innerHTML = `
            <div style="background: var(--color-bg-panel); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--color-border-light); box-shadow: 0 4px 12px rgba(0,0,0,0.03);">
                <div style="font-size: 0.7rem; color: var(--color-text-muted); margin-bottom: 2rem; text-transform: uppercase; font-weight: 700; letter-spacing: 0.1em; display: flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-route"></i> Material Journey
                </div>
                ${lineViewHtml}
                <div style="margin-top: 1rem; padding-top: 1.5rem; border-top: 1px dashed var(--color-border-light);">
                    <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.25rem;">Current Status</div>
                    <div style="font-size: 1.1rem; font-weight: 800; color: var(--color-text-main);">${currentStepName}</div>
                </div>
                ${buttonsHtml}
            </div>
        `;
    }

    const btnAddBOMItem = document.getElementById('btn-add-bom-item');
    if (btnAddBOMItem) btnAddBOMItem.addEventListener('click', () => addBOMRow('bom-manual-tbody', 'no-bom-msg'));

    const btnEditAddBOMItem = document.getElementById('edit-btn-add-bom-item');
    if (btnEditAddBOMItem) btnEditAddBOMItem.addEventListener('click', () => addBOMRow('edit-bom-manual-tbody', 'edit-no-bom-msg'));

    // Reset Form hook called when closing modal
    // --- BOM Interactivity for Style Detail View ---
    const btnDetailAddBomItem = document.getElementById('detail-btn-add-bom-item');

    if (btnDetailAddBomItem && modalAddBOMItem) {
        btnDetailAddBomItem.addEventListener('click', () => {
            if (formAddBOMItem) formAddBOMItem.reset();
            window.editingBOMRow = null;
            const title = modalAddBOMItem.querySelector('.modal-header h3');
            if (title) title.textContent = 'Add BOM Specification Item';
            modalAddBOMItem.classList.add('active');
        });
    }



    if (formAddBOMItem) {
        formAddBOMItem.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newItem = {
                category: document.getElementById('bom-item-category').value,
                description: document.getElementById('bom-item-desc').value.trim(),
                color: document.getElementById('bom-item-color').value.trim(),
                size: document.getElementById('bom-item-size').value.trim(),
                gsm: document.getElementById('bom-item-gsm').value.trim(),
                composition: document.getElementById('bom-item-composition').value.trim(),
                uom: document.getElementById('bom-item-uom').value,
                consumption: parseFloat(document.getElementById('bom-item-cons').value) || 0
            };

            // Auto-save new material to Library if not found
            const val = newItem.description.toLowerCase();
            const exists = (typeof materialsData !== 'undefined' ? materialsData : []).some(m => m.name.toLowerCase() === val);

            if (!exists && val) {
                try {
                    const resp = await fetch(`${API_BASE_URL}/materials`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: newItem.description,
                            type: newItem.category,
                            supplier: '', // Default Empty
                            color: newItem.color,
                            notes: 'Auto-added from BOM entry',
                            createdDate: new Date().toISOString()
                        })
                    });
                    if (resp.ok) {
                        // Refresh the global materials array so it knows about the new item immediately
                        if (typeof fetchMaterials === 'function') {
                            fetchMaterials();
                        }
                    }
                } catch (err) {
                    console.error('Failed to auto-save new material to library:', err);
                }
            }

            if (window.editingBOMRow) {
                const tds = window.editingBOMRow.querySelectorAll('td');
                tds[0].textContent = newItem.category;
                tds[1].textContent = newItem.description;
                tds[2].textContent = newItem.color;
                tds[3].textContent = newItem.size;
                tds[4].textContent = newItem.gsm;
                tds[5].textContent = newItem.composition;
                tds[6].textContent = newItem.uom;
                tds[7].textContent = newItem.consumption;

                window.editingBOMRow = null;
                modalAddBOMItem.classList.remove('active');

                if (typeof window.autoSaveBOM === 'function') {
                    window.autoSaveBOM();
                } else {
                    showToast('Item updated in specification list locally', 'success');
                }
            } else {
                addBOMRow('detail-bom-manual-tbody', 'detail-no-bom-msg', newItem);
                modalAddBOMItem.classList.remove('active');

                // Auto-save the BOM on addition
                if (typeof window.autoSaveBOM === 'function') {
                    window.autoSaveBOM();
                } else {
                    showToast('Item added to specification list locally', 'success');
                }
            }
        });
    }

    // --- Global Auto-Save BOM Logic ---
    window.autoSaveBOM = async function () {
        if (!activeStyleId) return;

        const bomData = getBOMData('detail-bom-manual-tbody');

        try {
            const response = await fetch(`${API_BASE_URL}/styles/${activeStyleId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bomData })
            });

            if (response.ok) {
                showToast('BOM updated and automatically saved.', 'success');
                // Directly update the local stylesData with the returned JSON if possible,
                // otherwise we assume the local state is correct as it was just edited.
                const updatedStyle = await response.json();
                const idx = stylesData.findIndex(s => s.id === activeStyleId);
                if (idx !== -1) {
                    stylesData[idx] = updatedStyle;
                }
            } else {
                showToast('Failed to auto-save BOM', 'error');
            }
        } catch (error) {
            console.error('Error auto-saving BOM:', error);
            showToast('Connection error auto-saving BOM', 'error');
        }
    };

    window.resetAddStyleForm = function () {
        const previewContainer = document.getElementById('image-preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const fileInput = document.getElementById('style-image-file');

        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
        if (fileInput) fileInput.value = '';
        activeSizes = {};
        document.querySelectorAll('#modal-add-style .dynamic-size-block').forEach(el => el.remove());
        document.querySelectorAll('#modal-add-style .size-chip.active').forEach(chip => chip.classList.remove('active'));
        const noSizesMsg = document.getElementById('no-sizes-msg');
        if (noSizesMsg) noSizesMsg.style.display = 'block';
        const totalQtyInput = document.getElementById('style-qty');
        if (totalQtyInput) totalQtyInput.value = '';

        // Reset Tracking Template
        const trackingSelect = document.getElementById('style-tracking-template');
        const previewTbody = document.getElementById('tracking-preview-tbody');
        if (previewTbody) previewTbody.innerHTML = '';
        if (trackingSelect) {
            trackingSelect.innerHTML = '<option value="" disabled selected>Select Due Date first...</option>';
            trackingSelect.disabled = true;
        }

        // Reset Color variables
        const finalColorHidden = document.getElementById('style-color-hidden');
        const customColorInputH = document.getElementById('custom-color-input');
        if (finalColorHidden) finalColorHidden.value = '';
        if (customColorInputH) customColorInputH.value = '';
        document.querySelectorAll('#modal-add-style .color-swatch.active').forEach(s => s.classList.remove('active'));

        // Reset BOM
        const bomTbody = document.getElementById('bom-manual-tbody');
        const noBOMMsg = document.getElementById('no-bom-msg');
        if (bomTbody) bomTbody.innerHTML = '';
        if (noBOMMsg) noBOMMsg.style.display = 'block';

        currentTabIndex = 0;
        updateTabs(0);
    };

    window.resetEditStyleForm = function () {
        const previewContainer = document.getElementById('edit-image-preview-container');
        const uploadPlaceholder = document.getElementById('edit-upload-placeholder');
        const fileInput = document.getElementById('edit-style-image-file');

        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
        if (fileInput) fileInput.value = '';
        editActiveSizes = {};
        document.querySelectorAll('#modal-edit-style .dynamic-size-block').forEach(el => el.remove());
        document.querySelectorAll('#modal-edit-style .size-chip.active').forEach(chip => chip.classList.remove('active'));
        const editNoSizesMsg = document.getElementById('edit-no-sizes-msg');
        if (editNoSizesMsg) editNoSizesMsg.style.display = 'block';
        const editQtyInput = document.getElementById('edit-style-qty');
        if (editQtyInput) editQtyInput.value = '';

        // Reset Color variables
        const editFinalColorHidden = document.getElementById('edit-style-color-hidden');
        const editCustomColorInputH = document.getElementById('edit-custom-color-input');
        if (editFinalColorHidden) editFinalColorHidden.value = '';
        if (editCustomColorInputH) editCustomColorInputH.value = '';
        document.querySelectorAll('#modal-edit-style .color-swatch.active').forEach(s => s.classList.remove('active'));

        // Reset BOM
        const editBomTbody = document.getElementById('edit-bom-manual-tbody');
        const editNoBOMMsg = document.getElementById('edit-no-bom-msg');
        if (editBomTbody) editBomTbody.innerHTML = '';
        if (editNoBOMMsg) editNoBOMMsg.style.display = 'block';

        currentEditTabIndex = 0;
        updateEditTabs(0);
    };

    // Prevent native form submit from firing in any scenario
    document.getElementById('form-new-delivery').addEventListener('submit', (e) => e.preventDefault());

    let isAddingDelivery = false;
    document.getElementById('form-new-delivery').querySelector('button[type="submit"]').addEventListener('click', async () => {
        if (isAddingDelivery) return;

        const form = document.getElementById('form-new-delivery');
        const name = document.getElementById('delivery-name').value.trim();
        const season = document.getElementById('delivery-season').value;
        if (!name || !season) { form.reportValidity(); return; }

        isAddingDelivery = true;
        const btnSubmit = form.querySelector('button[type="submit"]');
        const originalText = btnSubmit ? btnSubmit.textContent : '';
        if (btnSubmit) { btnSubmit.disabled = true; btnSubmit.textContent = 'Saving...'; }

        try {
            await fetch(`${API_BASE_URL}/deliveries`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    requestId: crypto.randomUUID(),
                    name,
                    season,
                    createdDate: new Date().toISOString(),
                    items: 0
                })
            });
            await fetchDeliveries();
            modalAddDelivery.classList.remove('active');
            form.reset();
        } catch (err) {
            console.error('Error adding delivery:', err);
        } finally {
            if (btnSubmit) { btnSubmit.disabled = false; btnSubmit.textContent = originalText; }
            isAddingDelivery = false;
        }
    });

    // --- Custom Tracking Steps & Drag-Drop Logic ---
    function extractTrackingStepsFromDOM(tbodyId) {
        const tbody = document.getElementById(tbodyId);
        if (!tbody || tbody.children.length === 0) return null;
        return Array.from(tbody.children).map(tr => {
            const nameInp = tr.querySelector('.custom-step-name');
            const typeSelect = tr.querySelector('.custom-step-type');
            const subtypeSelect = tr.querySelector('.custom-step-subtype');

            // Extract selected teams from the multi-select dropdown
            const checkboxes = tr.querySelectorAll('.multi-select-options input[type="checkbox"]:checked');
            let teamValue = '';
            if (checkboxes.length > 0) {
                teamValue = Array.from(checkboxes).map(c => c.value).join(', ');
            } else {
                const teamInp = tr.querySelector('.custom-step-team');
                teamValue = teamInp ? teamInp.value : (tr.dataset.team || '');
            }

            return {
                name: nameInp ? nameInp.value || 'Custom Step' : tr.dataset.name,
                type: typeSelect ? typeSelect.value : (tr.dataset.type || 'normal'),
                subType: subtypeSelect && typeSelect && typeSelect.value === 'transaction' ? subtypeSelect.value : null,
                team: teamValue,
                duration: parseInt(tr.querySelector('.step-day-input').value) || 0,
                isCustom: tr.dataset.custom === 'true'
            };
        });
    }

    function setupRowDragAndDrop(tr) {
        tr.addEventListener('dragstart', () => {
            tr.classList.add('dragging');
            setTimeout(() => tr.style.opacity = '0.5', 0);
        });
        tr.addEventListener('dragend', () => {
            tr.classList.remove('dragging');
            tr.style.opacity = '1';
            // Re-trigger updateBudget for dates recalculation since order changed
            const dayInput = tr.querySelector('.step-day-input');
            if (dayInput) dayInput.dispatchEvent(new Event('input', { bubbles: true }));
        });
    }

    function setupTableDragAndDrop(tbody) {
        tbody.addEventListener('dragover', e => {
            e.preventDefault();
            const draggingRow = tbody.querySelector('.dragging');
            if (!draggingRow) return;

            const siblings = [...tbody.querySelectorAll('tr:not(.dragging)')];
            const nextSibling = siblings.find(sibling => {
                const box = sibling.getBoundingClientRect();
                const offset = e.clientY - box.top - box.height / 2;
                return offset < 0;
            });

            if (nextSibling) {
                tbody.insertBefore(draggingRow, nextSibling);
            } else {
                tbody.appendChild(draggingRow);
            }
        });
    }

    // Attach drag and drop handlers to the tables
    const newTbody = document.getElementById('tracking-preview-tbody');
    const editTbody = document.getElementById('edit-tracking-preview-tbody');
    if (newTbody) setupTableDragAndDrop(newTbody);
    if (editTbody) setupTableDragAndDrop(editTbody);

    function addCustomTrackingStep(tbody) {
        const tr = document.createElement('tr');
        tr.draggable = true;
        tr.dataset.name = '';
        tr.dataset.type = 'normal';
        tr.dataset.team = '';
        tr.dataset.custom = 'true';

        // Generate multi-select team dropdown
        const teamStr = (tr.dataset.team || "").toString();
        const selectedTeams = teamStr.split(',').map(t => t.trim()).filter(Boolean);
        const allTeams = ["Sales", "Design", "Client", "Production", "Factory", "Logistics", "Management"];
        selectedTeams.forEach(t => { if (t && !allTeams.includes(t)) allTeams.push(t); });

        let checkboxesHtml = '';
        allTeams.forEach(t => {
            const isChecked = selectedTeams.includes(t) ? 'checked' : '';
            checkboxesHtml += `
                <label class="checkbox-option">
                    <input type="checkbox" value="${t}" ${isChecked}>
                    <span>${t}</span>
                </label>
            `;
        });
        const displayString = selectedTeams.length > 0 ? selectedTeams.join(', ') : 'Select Teams...';

        tr.innerHTML = `
            <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-main); font-size: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                    <i class="fa-solid fa-grip-vertical drag-handle" style="cursor: grab; color: #9CA3AF;"></i>
                    <input type="text" class="custom-step-name" placeholder="Step Name" style="flex:1; padding:0.4rem 0.5rem; border:1px solid var(--color-border); border-radius:4px; font-size:0.85rem; background:#fff;">
                </div>
                <div style="display: flex; gap: 0.5rem; padding-left: 1.25rem;">
                    <select class="custom-step-type" style="padding: 0.3rem; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.75rem; color: var(--color-text-main); background: #fff;">
                        <option value="normal">Normal</option>
                        <option value="approval">Approval</option>
                        <option value="transaction">Transaction</option>
                    </select>
                    <select class="custom-step-subtype" style="display: none; padding: 0.3rem; border: 1px dashed var(--color-border); border-radius: 4px; font-size: 0.75rem; color: var(--color-text-main); background: #F9FAFB;">
                        <option value="bom">BOM Tracking</option>
                        <option value="test">Test Tracking</option>
                        <option value="washing">Washing Tracking</option>
                    </select>
                </div>
            </td>
            <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle;">
                <div class="multi-select-container">
                    <div class="multi-select-header" style="background: #fff; border: 1px solid var(--color-border); border-radius: 4px; padding: 0.4rem 0.5rem; font-size: 0.85rem;">
                        <span class="selected-text">${displayString}</span>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: #9CA3AF;"></i>
                    </div>
                    <div class="multi-select-options">
                        ${checkboxesHtml}
                    </div>
                </div>
            </td>
            <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle;">
                <div style="display: flex; align-items: center; gap: 0.4rem;">
                    <input type="number" class="step-day-input" value="0" min="0" style="width: 64px; padding: 0.4rem; background: #fff; border: 1px solid var(--color-border); border-radius: 6px; font-size: 0.85rem; color: #111827; text-align: center;">
                    <span style="font-size: 0.75rem; color: var(--color-text-muted);">days</span>
                </div>
            </td>
            <td class="step-target-date" style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); text-align: right; color: var(--color-primary); font-family: var(--font-mono); font-weight: 500; font-size: 0.82rem; vertical-align: middle;"></td>
            <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); text-align:center; vertical-align: middle;">
                <button type="button" class="btn-remove-custom" style="background:none; border:none; color:#EF4444; cursor:pointer; padding: 0.4rem;" title="Remove Step"><i class="fa-solid fa-trash"></i></button>
            </td>
        `;

        const typeSelect = tr.querySelector('.custom-step-type');
        const subtypeSelect = tr.querySelector('.custom-step-subtype');
        typeSelect.addEventListener('change', () => {
            if (typeSelect.value === 'transaction') {
                subtypeSelect.style.display = 'block';
            } else {
                subtypeSelect.style.display = 'none';
            }
        });

        tr.querySelector('.step-day-input').addEventListener('input', (e) => {
            if (parseInt(e.target.value) < 0) e.target.value = 0;
            // dispatch bubbles for updateBudget triggered by calculatePreviewDates
        });

        tr.querySelector('.btn-remove-custom').addEventListener('click', () => {
            tr.remove();
            const dayInput = newTbody.querySelector('.step-day-input') || editTbody.querySelector('.step-day-input');
            if (dayInput) dayInput.dispatchEvent(new Event('input', { bubbles: true }));
        });

        // Multi-select dropdown logic for this custom row
        const header = tr.querySelector('.multi-select-header');
        const optionsDrawer = tr.querySelector('.multi-select-options');
        const selectedText = tr.querySelector('.selected-text');

        if (header && optionsDrawer) {
            header.addEventListener('click', (e) => {
                document.querySelectorAll('.multi-select-options.active').forEach(el => {
                    if (el !== optionsDrawer) el.classList.remove('active');
                });
                optionsDrawer.classList.toggle('active');
                e.stopPropagation();
            });

            const checkboxesMulti = optionsDrawer.querySelectorAll('input[type="checkbox"]');
            checkboxesMulti.forEach(cb => {
                cb.addEventListener('change', () => {
                    const checked = Array.from(checkboxesMulti).filter(c => c.checked).map(c => c.value);
                    selectedText.textContent = checked.length > 0 ? checked.join(', ') : 'Select Teams...';
                });
            });

            optionsDrawer.addEventListener('click', (e) => e.stopPropagation());
        }

        setupRowDragAndDrop(tr);
        tbody.appendChild(tr);

        // Re-trigger updateBudget to color dates properly
        const lastInput = tr.querySelector('.step-day-input');
        if (lastInput) lastInput.dispatchEvent(new Event('input', { bubbles: true }));
    }

    const btnAddCustomStepNew = document.getElementById('btn-add-custom-step-new');
    const btnAddCustomStepEdit = document.getElementById('btn-add-custom-step-edit');

    if (btnAddCustomStepNew) {
        btnAddCustomStepNew.addEventListener('click', () => {
            if (newTbody) addCustomTrackingStep(newTbody);
        });
    }

    if (btnAddCustomStepEdit) {
        btnAddCustomStepEdit.addEventListener('click', () => {
            if (editTbody) addCustomTrackingStep(editTbody);
        });
    }

    document.getElementById('form-new-style').addEventListener('submit', (e) => {
        e.preventDefault();
        if (!activeDeliveryId) return;

        const btnSubmit = document.getElementById('btn-submit-style');
        if (btnSubmit) {
            btnSubmit.disabled = true;
            btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.5rem;"></i> Saving...';
        }

        const no = document.getElementById('style-no').value;
        const desc = document.getElementById('style-desc').value;
        const color = document.getElementById('style-color-hidden').value; // Corrected ID
        const category = document.getElementById('style-category').value;
        const bomData = []; // New style has no BOM data initially

        // Grab dynamic sizes
        const sizes = { ...activeSizes };
        const standardKeys = ["XS", "S", "M", "L", "XL", "XXL"];
        standardKeys.forEach(k => { if (sizes[k] === undefined) sizes[k] = 0; });

        let qty = 0;
        Object.values(sizes).forEach(v => qty += v);

        const status = document.getElementById('style-status').value;
        const orderDate = document.getElementById('style-order-date').value;
        const localFileInput = document.getElementById('style-image-file');

        const dueDate = document.getElementById('style-due-date').value;
        const trackingTemplateId = parseInt(document.getElementById('style-tracking-template').value) || 1;
        const trackingStepsArray = extractTrackingStepsFromDOM('tracking-preview-tbody');

        const saveStyle = async (imageBase64) => {
            const stylePayload = {
                deliveryId: activeDeliveryId,
                no: no,
                desc: desc,
                color: color,
                category: category,
                sizes: sizes,
                qty: qty,
                status: status,
                orderDate: orderDate,
                dueDate: dueDate,
                trackingTemplateId: trackingTemplateId,
                trackingSteps: trackingStepsArray ? JSON.stringify(trackingStepsArray) : null,
                trackerStep: status === 'finished' ? 9 : 0,
                deliveryDate: status === 'finished' ? new Date().toISOString().split('T')[0] : null,
                image: imageBase64 || "",
                createdDate: new Date().toISOString(),
                designRejections: 0,
                bomData: bomData
            };

            try {
                await fetch(`${API_BASE_URL}/styles`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stylePayload)
                });

                await fetchDeliveries(); // Refresh item counts on dashboard memory
                if (activeDeliveryId) await fetchStyles(activeDeliveryId);

                modalAddStyle.classList.remove('active');
                e.target.reset();
                if (typeof resetAddStyleForm === 'function') resetAddStyleForm();
            } catch (err) {
                console.error('Error adding style:', err);
            } finally {
                if (btnSubmit) {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fa-solid fa-check" style="margin-right: 0.5rem;"></i> Save Style';
                }
            }
        };

        if (localFileInput && localFileInput.files && localFileInput.files[0]) {
            const reader = new FileReader();
            reader.onload = function (e) {
                saveStyle(e.target.result);
            };
            reader.readAsDataURL(localFileInput.files[0]);
        } else {
            saveStyle(null);
        }
    });

    const editStyleForm = document.getElementById('form-edit-style');
    if (editStyleForm) {
        editStyleForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const id = parseInt(document.getElementById('edit-style-id').value);
            const styleIndex = stylesData.findIndex(s => s.id === id);

            if (styleIndex > -1) {
                const btnSubmit = e.target.querySelector('button[type="submit"]');
                btnSubmit.disabled = true;
                btnSubmit.innerHTML = '<i class="fa-solid fa-spinner fa-spin" style="margin-right: 0.4rem;"></i>Saving...';

                const oldStatus = stylesData[styleIndex].status;
                const newStatus = document.getElementById('edit-style-status').value;

                const newSizes = { ...editActiveSizes };
                const newQty = parseInt(document.getElementById('edit-style-qty').value) || 0;

                // Handle delivery date / tracker from status change
                let newDeliveryDate = stylesData[styleIndex].deliveryDate;
                let newTrackerStep = stylesData[styleIndex].trackerStep;
                if (oldStatus !== 'finished' && newStatus === 'finished') {
                    newDeliveryDate = new Date().toISOString().split('T')[0];
                    newTrackerStep = 9;
                } else if (newStatus !== 'finished') {
                    newDeliveryDate = null;
                    if (newTrackerStep === 9) newTrackerStep = 0;
                }

                // Handle image: encode new file if selected, otherwise keep existing
                let newImage = stylesData[styleIndex].image;
                const fileInput = document.getElementById('edit-style-image-file');
                if (fileInput && fileInput.files && fileInput.files[0]) {
                    newImage = await new Promise(resolve => {
                        const reader = new FileReader();
                        reader.onload = ev => resolve(ev.target.result);
                        reader.readAsDataURL(fileInput.files[0]);
                    });
                }

                // Get tracking template
                const editTemplateSelect = document.getElementById('edit-style-tracking-template');
                const newTemplateId = editTemplateSelect && editTemplateSelect.value
                    ? parseInt(editTemplateSelect.value)
                    : (stylesData[styleIndex].trackingTemplateId);

                // Audit trail — grab current user from session
                const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');
                const editorName = sessionData.name || sessionData.fullRole || 'Unknown';
                const editedAt = new Date().toISOString();

                // Capture custom tracking steps if any user modified tracking durations or order
                const trackingStepsArray = extractTrackingStepsFromDOM('edit-tracking-preview-tbody');
                const trackingSteps = trackingStepsArray ? JSON.stringify(trackingStepsArray) : undefined;

                const stylePayload = {
                    no: document.getElementById('edit-style-no').value.trim(),
                    desc: document.getElementById('edit-style-desc').value.trim(),
                    color: document.getElementById('edit-style-color-hidden').value,
                    category: document.getElementById('edit-style-category').value,
                    sizes: newSizes,
                    qty: newQty,
                    status: newStatus,
                    trackerStep: newTrackerStep,
                    deliveryDate: newDeliveryDate,
                    orderDate: document.getElementById('edit-style-order-date').value || stylesData[styleIndex].orderDate,
                    dueDate: document.getElementById('edit-style-due-date').value || stylesData[styleIndex].dueDate,
                    trackingTemplateId: newTemplateId,
                    trackingSteps: trackingSteps,
                    image: newImage,
                    lastEditedBy: editorName,
                    lastEditedAt: editedAt,
                    bomData: stylesData[styleIndex].bomData || []
                };

                try {
                    await fetch(`${API_BASE_URL}/styles/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(stylePayload)
                    });

                    if (activeDeliveryId) await fetchStyles(activeDeliveryId);

                    modalEditStyle.classList.remove('active');
                    const updatedStyle = stylesData.find(s => s.id === id);
                    if (updatedStyle) openStyleDetail(updatedStyle);
                } catch (err) {
                    console.error('Error updating style:', err);
                } finally {
                    btnSubmit.disabled = false;
                    btnSubmit.innerHTML = '<i class="fa-solid fa-floppy-disk" style="margin-right: 0.4rem;"></i>Save Changes';
                }
            }
        });
    }

    // --- Notifications Interactivity ---
    const btnHeaderNotifications = document.getElementById('btn-header-notifications');
    const notificationsDropdown = document.getElementById('notifications-dropdown');
    const headerSettingsDropdown = document.getElementById('settings-dropdown');

    if (btnHeaderNotifications && notificationsDropdown) {
        btnHeaderNotifications.addEventListener('click', (e) => {
            e.stopPropagation();
            if (headerSettingsDropdown) headerSettingsDropdown.classList.remove('active');

            notificationsDropdown.classList.toggle('active');
            const badge = document.getElementById('notification-badge');
            if (badge) badge.style.display = 'none'; // clear badge when opened
        });
    }

    document.addEventListener('click', (e) => {
        if (notificationsDropdown && !e.target.closest('#notifications-dropdown-wrapper')) {
            notificationsDropdown.classList.remove('active');
        }

        // Global Modal Close Handler
        if (e.target.closest('.close-modal')) {
            const modal = e.target.closest('.modal-overlay');
            if (modal) {
                modal.classList.remove('active');
            }
        }
    });


    const btnViewAllNotifs = document.getElementById('btn-view-all-notifs');
    if (btnViewAllNotifs) {
        btnViewAllNotifs.addEventListener('click', () => {
            notificationsDropdown.classList.remove('active');
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-notifications').classList.add('active');

            // clear active nav styling gracefully if defined
            const activeFolderNav = document.getElementById('nav-deliveries');
            if (activeFolderNav) activeFolderNav.classList.remove('active');

            // rename header title
            document.getElementById('page-title').textContent = "Activity History";
        });
    }

    const btnBackNotifs = document.getElementById('btn-back-from-notifications');
    if (btnBackNotifs) {
        btnBackNotifs.addEventListener('click', () => {
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));
            document.getElementById('view-deliveries').classList.add('active');
            document.getElementById('page-title').textContent = "Delivery References";
        });
    }

    // --- Theme Switcher Logic ---
    const themeSelectorInline = document.getElementById('theme-selector-inline');

    // Load persisted theme on boot
    const savedTheme = localStorage.getItem('bm_theme') || 'classic';
    document.documentElement.setAttribute('data-theme', savedTheme);

    if (themeSelectorInline) {
        themeSelectorInline.value = savedTheme;

        // Handle dropdown changes
        themeSelectorInline.addEventListener('change', (e) => {
            const selectedTheme = e.target.value;
            document.documentElement.setAttribute('data-theme', selectedTheme);
            localStorage.setItem('bm_theme', selectedTheme);
        });
    }    // --- Tracking Template Logic ---
    window.renderTemplatesGrid = function () {
        const grid = document.getElementById('templates-grid');
        const searchInput = document.getElementById('search-templates');
        if (!grid) return;
        grid.innerHTML = '';

        const searchTerm = (searchInput?.value || '').toLowerCase();
        const filteredTemplates = trackingTemplates.filter(t => t.name.toLowerCase().includes(searchTerm));

        if (filteredTemplates.length === 0) {
            grid.innerHTML = '<p style="color: #6B7280; grid-column: 1/-1;">No tracking templates found matching your search.</p>';
            return;
        }

        filteredTemplates.forEach(t => {
            const steps = typeof t.steps === 'string' ? JSON.parse(t.steps) : t.steps;
            const stepsCount = steps.length;
            const totalDuration = steps.reduce((acc, step) => acc + parseInt(step.duration || 0), 0);

            const card = document.createElement('div');
            card.className = 'template-card';
            card.style.background = '#FFFFFF';
            card.style.border = '1px solid #E5E7EB';
            card.style.borderRadius = '8px';
            card.style.boxShadow = '0 1px 3px rgba(0,0,0,0.05)';
            card.style.position = 'relative';
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            card.style.overflow = 'hidden';
            card.innerHTML = `
                <div style="padding: 1.5rem; flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
                        <h3 style="margin: 0; font-family: var(--font-heading); font-size: 1.15rem; font-weight: 600; color: #111827;">${t.name}</h3>
                        ${t.id === 1 ? '<span style="background: #F3F4F6; color: #4B5563; font-size: 0.7rem; padding: 2px 6px; border-radius: 4px; font-weight: 600; letter-spacing: 0.5px;">DEFAULT</span>' : ''}
                    </div>
                    <p style="color: #6B7280; font-size: 0.9rem; margin: 0; display: flex; align-items: center; gap: 0.5rem;">
                        <span style="display: flex; align-items: center; gap: 0.35rem;"><i class="fa-solid fa-list-check" style="color: #9CA3AF;"></i> ${stepsCount} Steps</span>
                        <span style="color: #D1D5DB;">•</span>
                        <span style="display: flex; align-items: center; gap: 0.35rem;"><i class="fa-regular fa-clock" style="color: #9CA3AF;"></i> ~${totalDuration} Days Total</span>
                    </p>
                </div>
                <div style="padding: 1rem 1.5rem; background: #F9FAFB; border-top: 1px solid #E5E7EB; display: flex; justify-content: flex-end; gap: 1rem;">
                    <button class="btn-text btn-edit-template" data-id="${t.id}" style="color: #4B5563; font-size: 0.85rem; padding: 0; height: auto; min-height: 0; font-weight: 500;"><i class="fa-solid fa-pen-to-square" style="margin-right: 0.3rem;"></i> Edit</button>
                    ${t.id !== 1 ? `<button class="btn-text btn-delete-template" data-id="${t.id}" style="color: #EF4444; font-size: 0.85rem; padding: 0; height: auto; min-height: 0; font-weight: 500;"><i class="fa-solid fa-trash" style="margin-right: 0.3rem;"></i> Delete</button>` : ''}
                </div>
            `;
            grid.appendChild(card);
        });

        document.querySelectorAll('.btn-edit-template').forEach(btn => {
            btn.addEventListener('click', (e) => {
                openTemplateModal(parseInt(e.currentTarget.dataset.id));
            });
        });

        document.querySelectorAll('.btn-delete-template').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                if (confirm('Are you sure you want to delete this Tracking Template?')) {
                    await fetch(`${API_BASE_URL}/templates/${e.currentTarget.dataset.id}`, { method: 'DELETE' });
                    await fetchTemplates();
                }
            });
        });
    };

    window.populateTemplatesDropdown = function () {
        const select = document.getElementById('style-tracking-template');
        const dueDate = document.getElementById('style-due-date');
        if (!select) return;

        if (!dueDate || !dueDate.value) {
            select.innerHTML = '<option value="" disabled selected>Select Due Date first...</option>';
            select.disabled = true;
            return;
        }

        // Preserve current selection if it exists
        const currentValue = select.value;

        select.innerHTML = '<option value="" disabled selected>Select Tracking Template</option>';
        trackingTemplates.forEach(t => {
            select.innerHTML += `<option value="${t.id}">${t.name}</option>`;
        });
        select.disabled = false;

        if (currentValue) {
            select.value = currentValue;
        }
    };

    const btnCreateTemplate = document.getElementById('btn-create-template');
    const modalAddTemplate = document.getElementById('modal-add-template');
    const btnAddTemplateStep = document.getElementById('btn-add-template-step');
    const templateStepsTbody = document.getElementById('template-steps-tbody');
    const formTrackingTemplate = document.getElementById('form-tracking-template');

    if (btnCreateTemplate) {
        btnCreateTemplate.addEventListener('click', () => {
            openTemplateModal(null);
        });
    }

    const searchTemplatesInput = document.getElementById('search-templates');
    if (searchTemplatesInput) {
        searchTemplatesInput.addEventListener('input', () => {
            renderTemplatesGrid();
        });
    }

    function openTemplateModal(templateId) {
        document.getElementById('template-id').value = templateId || "";
        document.getElementById('template-name').value = "";
        templateStepsTbody.innerHTML = "";

        if (templateId) {
            const template = trackingTemplates.find(t => t.id === templateId);
            if (template) {
                document.getElementById('template-name').value = template.name;
                const steps = typeof template.steps === 'string' ? JSON.parse(template.steps) : template.steps;
                steps.forEach(s => addStepRow(s.name, s.type || 'normal', s.duration, s.dependency, s.team, s.subType));
            }
        } else {
            // Add a default first step
            addStepRow('Order Received', 'normal', 0, '', 'Sales');
        }

        modalAddTemplate.classList.add('active');
    }

    function addStepRow(name = "", type = "normal", duration = "", dependency = "", team = "") {
        const tr = document.createElement('tr');

        // Handle loading comma-separated strings back into checkboxes safely
        const teamStr = (team || "").toString();
        const selectedTeams = teamStr.split(',').map(t => t.trim()).filter(Boolean);
        const allTeams = ["Sales", "Design", "Client", "Production", "Factory", "Logistics", "Management"];

        // If a team is set that isn't in default list (legacy support), add it
        selectedTeams.forEach(t => {
            if (t && !allTeams.includes(t)) allTeams.push(t);
        });

        let checkboxesHtml = '';
        allTeams.forEach(t => {
            const isChecked = selectedTeams.includes(t) ? 'checked' : '';
            checkboxesHtml += `
                <label class="checkbox-option">
                    <input type="checkbox" value="${t}" ${isChecked}>
                    <span>${t}</span>
                </label>
            `;
        });

        const displayString = selectedTeams.length > 0 ? selectedTeams.join(', ') : 'Select Teams...';

        tr.innerHTML = `
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light);"><input type="text" class="step-name" value="${name}" required style="width: 100%; padding: 0.5rem; background: #FFFFFF; border: 1px solid #D1D5DB; color: #111827; border-radius: 6px;"></td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light);">
                <select class="step-type" style="width: 100%; padding: 0.5rem; background: #FFFFFF; border: 1px solid #D1D5DB; color: #111827; border-radius: 6px;">
                    <option value="normal" ${type === 'normal' ? 'selected' : ''}>Normal</option>
                    <option value="approval" ${type === 'approval' ? 'selected' : ''}>Approval</option>
                    <option value="transaction" ${type === 'transaction' ? 'selected' : ''}>Transaction</option>
                </select>
                <div class="subtype-container" style="margin-top: 0.4rem; ${type === 'transaction' ? '' : 'display: none;'}">
                    <select class="step-subtype" style="width: 100%; padding: 0.4rem; background: #F9FAFB; border: 1px dashed #D1D5DB; color: #374151; border-radius: 6px; font-size: 0.75rem;">
                        <option value="bom" ${arguments[5] === 'bom' ? 'selected' : ''}>BOM Tracking</option>
                        <option value="test" ${arguments[5] === 'test' ? 'selected' : ''}>Test Tracking</option>
                        <option value="washing" ${arguments[5] === 'washing' ? 'selected' : ''}>Washing Tracking</option>
                    </select>
                </div>
            </td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light);"><input type="number" class="step-duration" value="${duration}" required min="0" style="width: 100%; padding: 0.5rem; background: #FFFFFF; border: 1px solid #D1D5DB; color: #111827; border-radius: 6px;"></td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light);"><input type="text" class="step-dependency" value="${dependency}" placeholder="Previous Step" style="width: 100%; padding: 0.5rem; background: #FFFFFF; border: 1px solid #D1D5DB; color: #111827; border-radius: 6px;"></td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light);">
                <div class="multi-select-container">
                    <div class="multi-select-header">
                        <span class="selected-text">${displayString}</span>
                        <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: #9CA3AF;"></i>
                    </div>
                    <div class="multi-select-options">
                        ${checkboxesHtml}
                    </div>
                </div>
            </td>
            <td style="padding: 0.5rem; border-bottom: 1px solid var(--color-border-light); text-align: right;"><button type="button" class="btn-text btn-remove-step" style="color: #EF4444; padding: 0.4rem; border-radius: 6px;"><i class="fa-solid fa-trash"></i></button></td>
        `;

        tr.querySelector('.btn-remove-step').addEventListener('click', () => tr.remove());

        // Handle subtype visibility
        const typeSelect = tr.querySelector('.step-type');
        const subtypeContainer = tr.querySelector('.subtype-container');
        typeSelect.addEventListener('change', () => {
            subtypeContainer.style.display = typeSelect.value === 'transaction' ? 'block' : 'none';
        });

        // Multi-select dropdown logic for this row
        const header = tr.querySelector('.multi-select-header');
        const optionsDrawer = tr.querySelector('.multi-select-options');
        const selectedText = tr.querySelector('.selected-text');

        header.addEventListener('click', (e) => {
            // Close all other dropdowns first
            document.querySelectorAll('.multi-select-options.active').forEach(el => {
                if (el !== optionsDrawer) el.classList.remove('active');
            });
            optionsDrawer.classList.toggle('active');
            e.stopPropagation();
        });

        // Update display text when checkboxes change
        const checkboxes = optionsDrawer.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => {
            cb.addEventListener('change', () => {
                const checked = Array.from(checkboxes).filter(c => c.checked).map(c => c.value);
                selectedText.textContent = checked.length > 0 ? checked.join(', ') : 'Select Teams...';
            });
        });

        // Prevent click inside drawer from closing it
        optionsDrawer.addEventListener('click', (e) => e.stopPropagation());

        templateStepsTbody.appendChild(tr);
    }

    if (btnAddTemplateStep) {
        btnAddTemplateStep.addEventListener('click', () => addStepRow());
    }

    if (formTrackingTemplate) {
        formTrackingTemplate.addEventListener('submit', async (e) => {
            e.preventDefault();
            const id = document.getElementById('template-id').value;
            const name = document.getElementById('template-name').value;

            const steps = Array.from(templateStepsTbody.querySelectorAll('tr')).map(tr => {
                // Determine selected teams from checkboxes
                const checkboxes = tr.querySelectorAll('.multi-select-options input[type="checkbox"]:checked');
                const selectedTeams = Array.from(checkboxes).map(c => c.value).join(', ');

                return {
                    name: tr.querySelector('.step-name').value,
                    type: tr.querySelector('.step-type').value,
                    subType: tr.querySelector('.step-type').value === 'transaction' ? tr.querySelector('.step-subtype').value : null,
                    duration: parseInt(tr.querySelector('.step-duration').value || 0),
                    dependency: tr.querySelector('.step-dependency').value,
                    team: selectedTeams
                };
            });

            const payload = { name, steps };
            const method = id ? 'PUT' : 'POST';
            const url = id ? `${API_BASE_URL}/templates/${id}` : `${API_BASE_URL}/templates`;

            try {
                await fetch(url, {
                    method,
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                modalAddTemplate.classList.remove('active');
                await fetchTemplates(); // Refresh UI
            } catch (error) {
                console.error('Failed to save template', error);
            }
        });
    }

    // --- Dynamic Target Date Calculation ---
    const dueDateInput = document.getElementById('style-due-date');
    const trackingTemplateSelect = document.getElementById('style-tracking-template');
    const orderDateInputTrackingFallback = document.getElementById('style-order-date');

    function calculatePreviewDates(isEdit = false) {
        const previewContainer = document.getElementById(isEdit ? 'edit-tracking-preview-container' : 'tracking-preview-container');
        const previewTbody = document.getElementById(isEdit ? 'edit-tracking-preview-tbody' : 'tracking-preview-tbody');
        const dDateInput = document.getElementById(isEdit ? 'edit-style-due-date' : 'style-due-date');
        const tTemplateSelect = document.getElementById(isEdit ? 'edit-style-tracking-template' : 'style-tracking-template');
        const oDateInputFallback = document.getElementById(isEdit ? 'edit-style-order-date' : 'style-order-date'); // Note: edit style has an order date input

        if (!tTemplateSelect || !tTemplateSelect.value) {
            if (previewContainer) previewContainer.style.display = 'none';
            return;
        }

        const template = trackingTemplates.find(t => t.id == tTemplateSelect.value);
        if (!template) return;

        // Determine base (order) date and due date
        let baseDate = new Date();
        if (oDateInputFallback && oDateInputFallback.value) {
            baseDate = new Date(oDateInputFallback.value);
        }

        // --- NEW LOGIC for EDIT STYLE --- 
        // If editing, use the CURRENT style's steps (if they exist and belong to the selected template) to prepopulate days
        let styleCurrentSteps = null;
        if (isEdit) {
            const editStyleId = document.getElementById('edit-style-id').value;
            const currentStyle = stylesData.find(s => s.id == editStyleId);
            if (currentStyle && currentStyle.trackingTemplate == tTemplateSelect.value) {
                styleCurrentSteps = typeof currentStyle.trackingSteps === 'string' ? JSON.parse(currentStyle.trackingSteps) : currentStyle.trackingSteps;
            }
        }

        const templateSteps = typeof template.steps === 'string' ? JSON.parse(template.steps) : template.steps;
        const totalTemplateDuration = templateSteps.reduce((acc, step) => acc + parseInt(step.duration || 0), 0);

        // Calculate available days window
        let availableDays = totalTemplateDuration; // fallback: use template total
        if (dDateInput && dDateInput.value) {
            const targetDue = new Date(dDateInput.value);
            const diffTime = targetDue - baseDate;
            availableDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        if (previewContainer) previewContainer.style.display = 'block';

        // Check if we should preserve existing rows (i.e. due date change, not template change)
        const currentTemplateId = tTemplateSelect.dataset.lastTemplateId;
        const templateChanged = currentTemplateId !== tTemplateSelect.value;
        tTemplateSelect.dataset.lastTemplateId = tTemplateSelect.value;

        // Extract DOM steps if we are preserving user edits
        let domSteps = null;
        if (!templateChanged && previewTbody.children.length > 0) {
            domSteps = Array.from(previewTbody.children).map(tr => {
                const nameInp = tr.querySelector('.custom-step-name');
                const teamInp = tr.querySelector('.custom-step-team');
                return {
                    name: nameInp ? nameInp.value : tr.dataset.name,
                    type: tr.dataset.type,
                    team: teamInp ? teamInp.value : tr.dataset.team,
                    duration: parseInt(tr.querySelector('.step-day-input').value || 0),
                    isCustom: tr.dataset.custom === 'true'
                };
            });
        }

        // If template changed, reset the table
        if (templateChanged) {
            if (previewTbody) previewTbody.innerHTML = '';
        }

        // Show/update the days budget counter
        let budgetBarId = isEdit ? 'edit-step-days-budget-bar' : 'step-days-budget-bar';
        let budgetBar = document.getElementById(budgetBarId);
        if (!budgetBar) {
            const tableWrapper = previewContainer.querySelector('div');
            budgetBar = document.createElement('div');
            budgetBar.id = budgetBarId;
            budgetBar.style.cssText = 'display:flex; justify-content:space-between; align-items:center; padding: 0.5rem 0.75rem; background: var(--color-bg-dark); border: 1px solid var(--color-border-light); border-bottom: none; border-radius: 8px 8px 0 0; font-size:0.8rem;';
            tableWrapper.prepend(budgetBar);
        }

        function updateBudget() {
            const inputs = previewTbody.querySelectorAll('.step-day-input');
            const used = Array.from(inputs).reduce((s, inp) => s + (parseInt(inp.value) || 0), 0);
            const remaining = availableDays - used;
            budgetBar.innerHTML = `
                <span style="color: var(--color-text-muted);">📅 <strong style="color: var(--color-text-main);">${used}</strong> of <strong style="color: var(--color-primary);">${availableDays}</strong> days used</span>
                <span style="color: ${remaining < 0 ? '#EF4444' : remaining === 0 ? '#10B981' : '#F59E0B'}; font-weight: 600;">
                    ${remaining < 0 ? `⚠ ${Math.abs(remaining)} days over limit!` : remaining === 0 ? '✓ Perfect fit' : `${remaining} days remaining`}
                </span>
            `;
            // Recompute all target dates live
            let rollingDate = new Date(baseDate.getTime());
            previewTbody.querySelectorAll('tr').forEach(tr => {
                const inp = tr.querySelector('.step-day-input');
                const dateCell = tr.querySelector('.step-target-date');
                const days = parseInt(inp?.value) || 0;
                rollingDate.setDate(rollingDate.getDate() + days);
                if (dateCell) {
                    dateCell.textContent = rollingDate.toISOString().split('T')[0];
                    dateCell.style.color = used > availableDays ? '#EF4444' : 'var(--color-primary)';
                }
            });
        }

        // Pre-compute initial proportional allocations (only applied when rebuilding rows)
        let stepsToRender = domSteps || templateSteps;
        let totalRenderDuration = stepsToRender.reduce((s, st) => s + parseInt(st.duration || 0), 0) || totalTemplateDuration;

        const initialDurations = stepsToRender.map((step, index) => {
            if (domSteps) return parseInt(step.duration || 0); // Preserve DOM exactly if not rebuilding

            // First Priority: Existing custom days from style if editing the same template
            if (isEdit && styleCurrentSteps && styleCurrentSteps[index]) {
                return parseInt(styleCurrentSteps[index].duration || 0);
            }

            if (totalTemplateDuration > 0 && availableDays !== null) {
                if (index === templateSteps.length - 1) {
                    const sumSoFar = templateSteps.slice(0, index).reduce((s, s2, i2) => {
                        if (totalTemplateDuration > 0) {
                            return s + Math.round((parseInt(s2.duration || 0) / totalTemplateDuration) * availableDays);
                        }
                        return s + parseInt(s2.duration || 0);
                    }, 0);
                    return Math.max(0, availableDays - sumSoFar);
                }
                return Math.round((parseInt(step.duration || 0) / totalTemplateDuration) * availableDays);
            }
            return parseInt(step.duration || 0);
        });

        if (templateChanged) {
            stepsToRender.forEach((step, index) => {
                const initDays = initialDurations[index];
                const tr = document.createElement('tr');
                tr.draggable = true;
                tr.dataset.name = step.name || '';
                tr.dataset.type = step.type || 'normal';
                tr.dataset.team = step.team || '';
                tr.dataset.custom = step.isCustom ? 'true' : 'false';

                const typeIcons = {
                    'normal': '<i class="fa-solid fa-circle-dot"></i>',
                    'approval': '<i class="fa-solid fa-stamp"></i>',
                    'transaction': '<i class="fa-solid fa-layer-group"></i>'
                };
                const typeLabel = (step.type || 'normal').charAt(0).toUpperCase() + (step.type || 'normal').slice(1);

                let nameArea = step.isCustom ?
                    `<div style="display: flex; flex-direction: column; gap: 0.5rem; width: 100%;">
                        <div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                            <i class="fa-solid fa-grip-vertical drag-handle" style="cursor: grab; color: #9CA3AF;"></i>
                            <input type="text" class="custom-step-name" value="${step.name}" placeholder="Step Name" style="flex:1; padding:0.4rem 0.5rem; border:1px solid var(--color-border); border-radius:4px; font-size:0.85rem; background:#fff;">
                        </div>
                        <div style="display: flex; gap: 0.5rem; padding-left: 1.25rem;">
                            <select class="custom-step-type" style="padding: 0.3rem; border: 1px solid var(--color-border); border-radius: 4px; font-size: 0.75rem; color: var(--color-text-main); background: #fff;">
                                <option value="normal" ${step.type === 'normal' ? 'selected' : ''}>Normal</option>
                                <option value="approval" ${step.type === 'approval' ? 'selected' : ''}>Approval</option>
                                <option value="transaction" ${step.type === 'transaction' ? 'selected' : ''}>Transaction</option>
                            </select>
                            <select class="custom-step-subtype" style="display: ${step.type === 'transaction' ? 'block' : 'none'}; padding: 0.3rem; border: 1px dashed var(--color-border); border-radius: 4px; font-size: 0.75rem; color: var(--color-text-main); background: #F9FAFB;">
                                <option value="bom" ${step.subType === 'bom' ? 'selected' : ''}>BOM Tracking</option>
                                <option value="test" ${step.subType === 'test' ? 'selected' : ''}>Test Tracking</option>
                                <option value="washing" ${step.subType === 'washing' ? 'selected' : ''}>Washing Tracking</option>
                            </select>
                        </div>
                    </div>` :
                    `<div style="display: flex; align-items: center; gap: 0.5rem; width: 100%;">
                        <i class="fa-solid fa-grip-vertical drag-handle" style="cursor: grab; color: #9CA3AF; padding-right: 0.25rem;"></i>
                        <div style="flex: 1;">
                            <div style="font-weight: 500;">${step.name}</div>
                            <div style="font-size: 0.7rem; color: var(--color-text-muted); display: flex; align-items: center; gap: 0.3rem; margin-top: 0.2rem;">
                                ${typeIcons[step.type || 'normal']} ${typeLabel} ${step.subType ? `(${step.subType})` : ''}
                            </div>
                        </div>
                    </div>`;

                // Generate multi-select team dropdown
                const teamStr = (step.team || "").toString();
                const selectedTeams = teamStr.split(',').map(t => t.trim()).filter(Boolean);
                const allTeams = ["Sales", "Design", "Client", "Production", "Factory", "Logistics", "Management"];
                selectedTeams.forEach(t => { if (t && !allTeams.includes(t)) allTeams.push(t); });

                let checkboxesHtml = '';
                allTeams.forEach(t => {
                    const isChecked = selectedTeams.includes(t) ? 'checked' : '';
                    checkboxesHtml += `
                        <label class="checkbox-option">
                            <input type="checkbox" value="${t}" ${isChecked}>
                            <span>${t}</span>
                        </label>
                    `;
                });
                const displayString = selectedTeams.length > 0 ? selectedTeams.join(', ') : 'Select Teams...';

                let teamHtml = step.isCustom ?
                    `<div class="multi-select-container">
                        <div class="multi-select-header" style="background: #fff; border: 1px solid var(--color-border); border-radius: 4px; padding: 0.4rem 0.5rem; font-size: 0.85rem;">
                            <span class="selected-text">${displayString}</span>
                            <i class="fa-solid fa-chevron-down" style="font-size: 0.8rem; color: #9CA3AF;"></i>
                        </div>
                        <div class="multi-select-options">
                            ${checkboxesHtml}
                        </div>
                    </div>` :
                    `<span style="background: var(--color-bg-dark); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--color-border); color: var(--color-text-muted);">${step.team || '—'}</span>`;

                let rmBtn = step.isCustom ?
                    `<button type="button" class="btn-remove-custom" style="background:none; border:none; color:#EF4444; cursor:pointer; padding: 0.4rem;" title="Remove Step"><i class="fa-solid fa-trash"></i></button>` :
                    ``;

                tr.innerHTML = `
                    <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-main); font-size: 0.85rem; vertical-align: top;">
                        ${nameArea}
                    </td>
                    <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle;">
                        ${teamHtml}
                    </td>
                    <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); vertical-align: middle;">
                        <div style="display: flex; align-items: center; gap: 0.4rem;">
                            <input type="number"
                                class="step-day-input"
                                value="${initDays}"
                                min="0"
                                max="${availableDays}"
                                style="width: 64px; padding: 0.4rem; background: #fff; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; color: #111827; text-align: center;"
                            >
                            <span style="font-size: 0.75rem; color: var(--color-text-muted);">days</span>
                        </div>
                    </td>
                    <td class="step-target-date" style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); text-align: right; color: var(--color-primary); font-family: var(--font-mono); font-weight: 500; font-size: 0.82rem; vertical-align: middle;"></td>
                    <td style="padding: 0.8rem 0.75rem; border-bottom: 1px solid var(--color-border-light); text-align:center; vertical-align: middle;">${rmBtn}</td>
                `;

                if (step.isCustom) {
                    const typeSelect = tr.querySelector('.custom-step-type');
                    const subtypeSelect = tr.querySelector('.custom-step-subtype');
                    if (typeSelect && subtypeSelect) {
                        typeSelect.addEventListener('change', () => {
                            if (typeSelect.value === 'transaction') {
                                subtypeSelect.style.display = 'block';
                            } else {
                                subtypeSelect.style.display = 'none';
                            }
                        });
                    }

                    const header = tr.querySelector('.multi-select-header');
                    const optionsDrawer = tr.querySelector('.multi-select-options');
                    const selectedText = tr.querySelector('.selected-text');

                    if (header && optionsDrawer) {
                        header.addEventListener('click', (e) => {
                            document.querySelectorAll('.multi-select-options.active').forEach(el => {
                                if (el !== optionsDrawer) el.classList.remove('active');
                            });
                            optionsDrawer.classList.toggle('active');
                            e.stopPropagation();
                        });

                        const checkboxesMulti = optionsDrawer.querySelectorAll('input[type="checkbox"]');
                        checkboxesMulti.forEach(cb => {
                            cb.addEventListener('change', () => {
                                const checked = Array.from(checkboxesMulti).filter(c => c.checked).map(c => c.value);
                                selectedText.textContent = checked.length > 0 ? checked.join(', ') : 'Select Teams...';
                            });
                        });

                        optionsDrawer.addEventListener('click', (e) => e.stopPropagation());
                    }
                }

                tr.querySelector('.step-day-input').addEventListener('input', (e) => {
                    if (parseInt(e.target.value) < 0) e.target.value = 0;
                    updateBudget();
                });

                if (step.isCustom) {
                    const rmBtnEl = tr.querySelector('.btn-remove-custom');
                    if (rmBtnEl) {
                        rmBtnEl.addEventListener('click', () => {
                            tr.remove();
                            updateBudget();
                        });
                    }
                }

                setupRowDragAndDrop(tr);
                previewTbody.appendChild(tr);
            });
        }

        // Just blindly applying update budget to existing rows if preserved
        if (!templateChanged) {
            previewTbody.querySelectorAll('.step-day-input').forEach(inp => {
                inp.max = availableDays;
            });
        }

        updateBudget();
    }

    // Update headers for BOTH previews
    ['tracking-preview-container', 'edit-tracking-preview-container'].forEach(containerId => {
        const pContainer = document.getElementById(containerId);
        if (pContainer) {
            const previewThead = pContainer.querySelector('thead tr');
            if (previewThead && previewThead.children.length === 3) {
                previewThead.children[2].textContent = 'Days';
                const dateHeader = document.createElement('th');
                dateHeader.style.cssText = 'padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-muted); font-weight: 500;';
                dateHeader.textContent = 'Target Date';
                previewThead.appendChild(dateHeader);
            }
        }
    });

    if (dueDateInput) {
        dueDateInput.addEventListener('change', () => {
            populateTemplatesDropdown();
            calculatePreviewDates(false);
        });
    }
    if (trackingTemplateSelect) trackingTemplateSelect.addEventListener('change', () => calculatePreviewDates(false));
    if (orderDateInputTrackingFallback) orderDateInputTrackingFallback.addEventListener('change', () => calculatePreviewDates(false));

    const editDueDateInput = document.getElementById('edit-style-due-date');
    const editTrackingTemplateSelect = document.getElementById('edit-style-tracking-template');
    const editOrderDateInput = document.getElementById('edit-style-order-date');

    if (editDueDateInput) editDueDateInput.addEventListener('change', () => calculatePreviewDates(true));
    if (editTrackingTemplateSelect) editTrackingTemplateSelect.addEventListener('change', () => calculatePreviewDates(true));
    if (editOrderDateInput) editOrderDateInput.addEventListener('change', () => calculatePreviewDates(true));



    // --- Logout ---
    const handleLogout = () => {
        localStorage.removeItem('bm_session'); // Clear session
        location.reload(); // Reload to return to login screen
    };

    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', handleLogout);

    const headerLogoutBtn = document.getElementById('btn-header-logout');
    if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', handleLogout);
    // --- Style Materials (BOM) Logic ---

    async function openMaterialUsageDetails(material) {
        const modal = document.getElementById('modal-material-usage');
        const nameSpan = document.getElementById('usage-material-name');
        const listDiv = document.getElementById('usage-styles-list');
        const emptyState = document.getElementById('usage-empty-state');

        nameSpan.textContent = material.name;
        listDiv.innerHTML = '';
        emptyState.style.display = 'none';
        modal.classList.add('active');

        try {
            const response = await fetch(`${API_BASE_URL}/materials/${material.id}/styles`);
            const styles = await response.json();

            if (styles.length === 0) {
                emptyState.style.display = 'block';
                return;
            }

            styles.forEach(s => {
                const totalSteps = 10; // Assuming 10 steps in standard tracker
                const progressPct = ((s.trackerStep + 1) / totalSteps) * 100;
                const statusLabel = s.status === 'finished' ? 'Order Complete' : `Processing: Step ${s.trackerStep + 1}`;

                const item = document.createElement('div');
                item.className = 'usage-item';
                item.innerHTML = `
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-weight: 700; font-size: 1rem; color: var(--color-text-main);">${s.no}</div>
                            <div style="font-size: 0.8rem; color: var(--color-text-muted);">${s.desc}</div>
                        </div>
                        <div style="text-align: right;">
                            <div class="usage-label" style="font-size: 0.7rem; font-weight: 700; color: var(--color-primary);">${s.usage}</div>
                            <div style="font-size: 0.8rem; font-weight: 600;">${s.quantity}</div>
                        </div>
                    </div>
                    <div class="usage-step-progress">
                        <div class="usage-step-fill" style="width: ${progressPct}%"></div>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--color-text-muted);">
                        <span>Status: <strong>${statusLabel}</strong></span>
                        <span>Progress: ${Math.round(progressPct)}%</span>
                    </div>
                `;
                listDiv.appendChild(item);
            });
        } catch (error) {
            console.error('Failed to fetch material usage styles:', error);
        }
    }

    const bomSwatchGrid = document.getElementById('bom-swatch-grid');
    const btnOpenMaterialPicker = document.getElementById('btn-open-material-picker');
    const modalPickMaterial = document.getElementById('modal-pick-material');
    const modalAssignDetails = document.getElementById('modal-assign-details');
    const pickerMaterialsList = document.getElementById('picker-materials-list');
    const searchPickerMaterials = document.getElementById('search-picker-materials');
    const formAssignDetails = document.getElementById('form-assign-details');

    const materialIcons = {
        'Fabric': 'fa-scroll',
        'Thread': 'fa-spaghetti-monster-fly', // closest for spool?
        'Button': 'fa-circle-dot',
        'Zipper': 'fa-file-zipper',
        'Lace': 'fa-border-none',
        'Other': 'fa-box'
    };

    async function fetchStyleMaterials(styleId) {
        try {
            const response = await fetch(`${API_BASE_URL}/styles/${styleId}/materials`);
            const materials = await response.json();
            renderBOM(materials);
        } catch (error) {
            console.error('Failed to fetch style materials:', error);
        }
    }

    function renderBOM(materials) {
        bomSwatchGrid.innerHTML = '';
        if (materials.length === 0) {
            bomSwatchGrid.innerHTML = `
                <div style="grid-column: 1/-1; padding: 3rem; text-align: center; border: 2px dashed var(--color-border-light); border-radius: 12px; color: var(--color-text-muted);">
                    <i class="fa-solid fa-layer-group" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.5;"></i>
                    <p>No materials linked to this style yet.</p>
                </div>
            `;
            return;
        }

        materials.forEach(m => {
            const icon = materialIcons[m.type] || 'fa-box';
            const card = document.createElement('div');
            card.className = 'swatch-card';
            card.innerHTML = `
                <button class="btn-remove-assignment" title="Remove material" data-id="${m.id}">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
                <div class="swatch-visual">
                    <i class="fa-solid ${icon}"></i>
                </div>
                <div class="swatch-details">
                    <div class="swatch-usage">${m.usage || 'General Material'}</div>
                    <div class="swatch-name">${m.name}</div>
                    <div class="swatch-meta">${m.color || 'N/A'} • ${m.type}</div>
                    <div class="swatch-qty">${m.quantity || 'Qty N/A'}</div>
                </div>
            `;

            card.querySelector('.btn-remove-assignment').addEventListener('click', (e) => {
                e.stopPropagation();
                removeMaterialFromStyle(m.id, m.styleId);
            });

            bomSwatchGrid.appendChild(card);
        });
    }

    let allPickerMaterials = [];
    btnOpenMaterialPicker.addEventListener('click', () => {
        modalPickMaterial.classList.add('active');
        fetchPickerMaterials();
    });

    async function fetchPickerMaterials() {
        try {
            const response = await fetch(`${API_BASE_URL}/materials`);
            allPickerMaterials = await response.json();
            renderPickerList(allPickerMaterials);
        } catch (error) {
            console.error('Failed to fetch picker materials:', error);
        }
    }

    function renderPickerList(materials) {
        pickerMaterialsList.innerHTML = '';
        if (materials.length === 0) {
            pickerMaterialsList.innerHTML = `
                <div style="padding: 3rem; text-align: center; color: var(--color-text-muted);">
                    <i class="fa-solid fa-ghost" style="font-size: 2rem; margin-bottom: 1rem; opacity: 0.3;"></i>
                    <p>No materials found matching your criteria.</p>
                </div>
            `;
            return;
        }

        materials.forEach(m => {
            const icon = materialIcons[m.type] || 'fa-box-archive';
            const item = document.createElement('div');
            item.className = 'picker-item';
            item.innerHTML = `
                <div class="picker-item-content">
                    <div class="picker-item-icon">
                        <i class="fa-solid ${icon}"></i>
                    </div>
                    <div class="picker-item-info">
                        <h4>${m.name}</h4>
                        <p>${m.type} • ${m.supplier || 'Standard Supplier'} • ${m.color || 'Default'}</p>
                    </div>
                </div>
                <button class="btn-select-picker">Select</button>
            `;
            item.addEventListener('click', () => {
                openAssignmentDetails(m);
            });
            pickerMaterialsList.appendChild(item);
        });
    }

    // Filter Logic
    document.querySelectorAll('.filter-chip').forEach(chip => {
        chip.addEventListener('click', () => {
            document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');

            const type = chip.dataset.type;
            applyPickerFilters(type, searchPickerMaterials.value);
        });
    });

    function applyPickerFilters(type, query) {
        let filtered = allPickerMaterials;

        if (type !== 'all') {
            filtered = filtered.filter(m => m.type === type);
        }

        if (query) {
            const q = query.toLowerCase();
            filtered = filtered.filter(m =>
                m.name.toLowerCase().includes(q) ||
                m.type.toLowerCase().includes(q) ||
                (m.supplier && m.supplier.toLowerCase().includes(q))
            );
        }

        renderPickerList(filtered);
    }

    searchPickerMaterials.addEventListener('input', (e) => {
        const activeChip = document.querySelector('.filter-chip.active');
        const type = activeChip ? activeChip.dataset.type : 'all';
        applyPickerFilters(type, e.target.value);
    });

    function openAssignmentDetails(material) {
        modalPickMaterial.classList.remove('active');
        modalAssignDetails.classList.add('active');
        document.getElementById('assign-material-id').value = material.id;
        document.getElementById('assign-usage').value = '';
        document.getElementById('assign-qty').value = '';
        document.getElementById('assign-usage').focus();
    }

    formAssignDetails.addEventListener('submit', async (e) => {
        e.preventDefault();
        const materialId = document.getElementById('assign-material-id').value;
        const usage = document.getElementById('assign-usage').value;
        const quantity = document.getElementById('assign-qty').value;

        if (!activeStyleId) {
            alert("Error: No active style identified.");
            return;
        }

        try {
            await fetch(`${API_BASE_URL}/styles/${activeStyleId}/materials`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ materialId, usage, quantity })
            });

            modalAssignDetails.classList.remove('active');
            fetchStyleMaterials(activeStyleId);
        } catch (error) {
            console.error('Failed to assign material:', error);
            alert("Failed to link material to style.");
        }
    });

    async function removeMaterialFromStyle(assignmentId, styleId) {
        if (!confirm('Remove this material from the style specification?')) return;
        try {
            const response = await fetch(`${API_BASE_URL}/style-materials/${assignmentId}`, {
                method: 'DELETE'
            });
            if (response.ok) {
                fetchStyleMaterials(styleId);
            }
        } catch (error) {
            console.error('Failed to remove material assignment:', error);
        }
    }

    // Modal Close Logic for BOM Modals
    [modalPickMaterial, modalAssignDetails].forEach(modal => {
        if (!modal) return;
        const closeBtn = modal.querySelector('.close-modal');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                modal.classList.remove('active');
            });
        }
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.classList.remove('active');
        });
    });

    // --- Premium Toast Notification System ---
    function showToast(message, type = 'error') {
        const existingToast = document.querySelector('.toast-notification');
        if (existingToast) existingToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast-notification ${type}`;

        let iconHtml = '<i class="fa-solid fa-circle-info"></i>';
        if (type === 'error') iconHtml = '<i class="fa-solid fa-triangle-exclamation"></i>';
        else if (type === 'success') iconHtml = '<i class="fa-regular fa-circle-check"></i>';

        toast.innerHTML = `
            ${iconHtml}
            <span class="toast-msg">${message}</span>
        `;

        document.body.appendChild(toast);

        // Trigger animation
        setTimeout(() => toast.classList.add('show'), 10);

        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 400); // Wait for transition out
        }, 3500);
    }

    // AI HELPER CHATBOT LOGIC
    const aiChatToggle = document.getElementById('ai-chat-toggle');
    const aiChatWindow = document.getElementById('ai-chat-window');
    const aiChatClose = document.getElementById('ai-chat-close');
    const aiChatInput = document.getElementById('ai-chat-input');
    const aiChatSend = document.getElementById('ai-chat-send');
    const aiChatMessages = document.getElementById('ai-chat-messages');

    if (aiChatToggle && aiChatWindow && aiChatClose && aiChatMessages) {

        const FAQ_RESPONSES = {
            "track": "To track an order, go to the **Styles** section, click on a style, and then click the **Live Tracker** button. You can see the progress in Timeline, Gantt, or CPM views!",
            "cpm": "The **CPM (Critical Path Method)** chart shows the sequence of steps required to finish an order. The active step is highlighted, and you can see the flow of work from start to finish.",
            "add": "To add a new delivery, click the pulsing **'+'** button on the Deliveries page. Fill in the details, and your delivery will be added to the dashboard!",
            "who": "**Black Mango** is a premium fashion tracking and management system designed for speed, clarity, and style. 🥭",
            "default": "I'm still learning! Try clicking one of the common questions below or ask me about tracking, deliveries, or CPM charts."
        };

        aiChatToggle.addEventListener('click', () => {
            aiChatWindow.classList.add('active');
            aiChatToggle.style.transform = 'scale(0) rotate(-90deg)';
            aiChatToggle.style.opacity = '0';
        });

        aiChatClose.addEventListener('click', () => {
            aiChatWindow.classList.remove('active');
            aiChatToggle.style.transform = 'scale(1) rotate(0)';
            aiChatToggle.style.opacity = '1';
        });

        // Dismiss Button
        const chatDismissBtn = document.getElementById('ai-chat-dismiss');
        const chatWrapper = document.querySelector('.ai-chat-wrapper');
        if (chatDismissBtn && chatWrapper) {
            chatDismissBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                chatWrapper.style.display = 'none';
                aiChatWindow.classList.remove('active');
            });
        }

        const appendMessage = (text, sender) => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `msg ${sender}-msg`;
            msgDiv.innerHTML = `<div class="msg-bubble">${text}</div>`;
            aiChatMessages.appendChild(msgDiv);
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
        };

        const showTypingIndicator = () => {
            const indicator = document.createElement('div');
            indicator.className = 'msg bot-msg typing-temp';
            indicator.innerHTML = `
                <div class="msg-bubble">
                    <div class="typing-indicator"><span></span><span></span><span></span></div>
                </div>
            `;
            aiChatMessages.appendChild(indicator);
            aiChatMessages.scrollTop = aiChatMessages.scrollHeight;
            return indicator;
        };

        const botReply = (key) => {
            const indicator = showTypingIndicator();
            const response = FAQ_RESPONSES[key] || FAQ_RESPONSES["default"];
            setTimeout(() => {
                indicator.remove();
                appendMessage(response, 'bot');
            }, 1200);
        };

        const handleChatSend = () => {
            if (!aiChatInput) return;
            const text = aiChatInput.value.trim();
            if (!text) return;

            appendMessage(text, 'user');
            aiChatInput.value = '';

            const lowerText = text.toLowerCase();
            let foundKey = null;
            if (lowerText.includes('track')) foundKey = 'track';
            else if (lowerText.includes('cpm') || lowerText.includes('chart')) foundKey = 'cpm';
            else if (lowerText.includes('add') || lowerText.includes('delivery')) foundKey = 'add';
            else if (lowerText.includes('who') || lowerText.includes('black mango')) foundKey = 'who';

            botReply(foundKey);
        };

        if (aiChatSend) {
            aiChatSend.addEventListener('click', handleChatSend);
        }

        if (aiChatInput) {
            aiChatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') handleChatSend();
            });
        }

        // Quick Question chips
        document.querySelectorAll('.quick-q').forEach(btn => {
            btn.addEventListener('click', () => {
                const q = btn.textContent;
                const key = btn.dataset.q;
                appendMessage(q, 'user');
                botReply(key);
            });
        });

    } // end ai-chatbot guard
}); // end DOMContentLoaded
