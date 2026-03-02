document.addEventListener('DOMContentLoaded', () => {
    console.log("Black Mango Portal v1.10 | Milestone Release: Dynamic Designer Notes & Step Audits");
    // --- Elements ---
    let activeStyleId = null;
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
    // Enforce a strict 2-second splash screen display for an elegant, consistent intro
    setTimeout(() => {
        splashScreen.classList.add('fade-out');
        bgOverlay.classList.add('loaded');

        setTimeout(() => {
            splashScreen.style.display = 'none';
            mainApp.style.display = 'flex';
        }, 300); // 300ms fade transition
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
    togglePwdBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        togglePwdBtn.innerHTML = type === 'password' ? '<i class="fa-regular fa-eye"></i>' : '<i class="fa-regular fa-eye-slash"></i>';
    });

    // --- Step 1 Submit (Basic Auth) ---
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

    // --- Go Back to Step 1 ---
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

    // --- Step 2 Submit (Role Auth) ---
    step2Form.addEventListener('submit', (e) => {
        e.preventDefault();
        const dept = deptSelect.value; // Use the value (e.g. "Design", "Factory") so it matches template team names for RBAC
        const role = roleSelect.options[roleSelect.selectedIndex].text;
        const name = fullnameInput.value.trim();

        // fullRole format: "Manager / Department Head - Design" — the dept part is matched against template teams
        launchDashboard('staff', name, `${role} - ${dept}`);
    });

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

    const currentHost = window.location.hostname || '127.0.0.1';
    const API_BASE_URL = `http://${currentHost}:5000/api`;
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
    const activeSession = JSON.parse(localStorage.getItem('bm_session'));
    if (activeSession) {
        currentUser = activeSession.userType;
        launchDashboard(activeSession.userType, activeSession.name, activeSession.fullRole, true);
    }

    function launchDashboard(userType, name, fullRole, isRestoring = false) {
        if (!isRestoring) {
            localStorage.setItem('bm_session', JSON.stringify({ userType, name, fullRole }));
        }

        // Fast elegant fade out
        loginCard.style.transition = 'opacity 0.2s ease, transform 0.2s ease';
        loginCard.style.opacity = '0';
        loginCard.style.transform = 'scale(0.95)';

        bgOverlay.style.transition = 'opacity 0.3s ease';
        bgOverlay.style.opacity = '0';

        setTimeout(() => {
            // Unload login from rendering tree entirely
            loginCard.style.display = 'none';
            bgOverlay.style.display = 'none';

            // Configure Workspace View
            document.getElementById('nav-name').textContent = name;
            document.getElementById('nav-role').textContent = fullRole;
            document.getElementById('nav-avatar').textContent = name.charAt(0).toUpperCase();

            // Show Workspace Container
            dashboardCard.style.display = 'flex';
            dashboardCard.style.opacity = '0';

            // View Routing based on User Type
            document.querySelectorAll('.view-section').forEach(v => v.classList.remove('active'));

            const staffNav = document.getElementById('nav-staff-links');
            const teamNav = document.getElementById('nav-team-link');

            if (userType === 'admin') {
                document.getElementById('view-admin-dashboard').classList.add('active');
                document.getElementById('page-title').textContent = "Admin Control Center";

                // Show admin-only nav, hide staff-only nav
                if (staffNav) staffNav.style.display = 'none';
                if (teamNav) teamNav.style.display = 'flex';

                const adminHomeNav = document.getElementById('nav-admin-home');
                if (adminHomeNav) adminHomeNav.style.display = 'flex';

                const toolbar = document.querySelector('#view-deliveries .section-toolbar');
                if (toolbar) toolbar.style.display = 'none';

                // Admins also need templates and deliveries loaded for the tracking templates view and admin dashboard stats
                fetchTemplates().then(() => fetchDeliveries());
            } else {
                document.getElementById('view-deliveries').classList.add('active');
                document.getElementById('page-title').textContent = "Delivery References";

                if (staffNav) staffNav.style.display = 'block';
                if (teamNav) teamNav.style.display = 'none';

                fetchTemplates().then(() => fetchDeliveries()); // Dom insertion happens here via api fetch, safely isolated from fade-out
            }

            // Finally fade in the dashboard
            setTimeout(() => {
                dashboardCard.style.transition = 'opacity 0.4s ease';
                dashboardCard.style.opacity = '1';

                // Show AI Helper Chatbot once workspace is ready
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
        activeStyleId = style.id;
        document.getElementById('detail-style-no').textContent = style.no;
        pageTitle.textContent = "Style Details";

        const deliveryItem = deliveriesData.find(d => d.id === style.deliveryId);
        const deliveryName = deliveryItem ? deliveryItem.name : 'Unknown';

        // Pick a robust SVG placeholder if no image
        const fallbackImg = svgPlaceholder('👗', 'Style Pending');
        const imgUrl = style.image || fallbackImg;
        const isFinished = style.status === 'finished';
        const actionBtn = isFinished
            ? `<button class="btn-primary btn-large" id="btn-view-tracker"><i class="fa-solid fa-satellite-dish"></i> View Completed Tracker</button>`
            : `<button class="btn-primary btn-large" id="btn-live-tracker"><i class="fa-solid fa-satellite-dish"></i> Live Tracker</button>`;

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
            <div class="detail-info">
                <div class="detail-header">
                    <div class="detail-title-group">
                        <div class="detail-category">${style.category}</div>
                        <h2>${style.desc}</h2>
                        <div class="detail-no">${style.no}</div>
                    </div>
                    <div class="status-badge ${statusClass}">${statusText}</div>
                </div>
                
                <div class="detail-grid">
                    <div class="detail-item">
                        <div class="detail-label">Delivery Reference</div>
                        <div class="detail-value">${deliveryName}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Fabric Color</div>
                        <div class="detail-value">${style.color || 'Standard'}</div>
                    </div>
                    <div class="detail-item qty-hover-container">
                        <div class="detail-label">Quantity</div>
                        <div class="detail-value qty-interactive">${style.qty} pcs <i class="fa-solid fa-circle-info style-info-icon" style="margin-left: 4px;"></i></div>
                        <div class="size-tooltip-bubble">
                            <div class="rb-header"><i class="fa-solid fa-chart-pie"></i> Size Breakdown</div>
                            <div class="rb-body">
                                ${sizeRowsHtml}
                            </div>
                        </div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date Ordered</div>
                        <div class="detail-value">${style.orderDate}</div>
                    </div>
                    <div class="detail-item">
                        <div class="detail-label">Date Delivered</div>
                        <div class="detail-value" ${!isFinished ? 'style="color: #9CA3AF;"' : ''}>${deliveryDateStr}</div>
                    </div>
                </div>

                ${style.lastEditedBy && style.lastEditedAt ? `
                <div style="margin-top: 1rem; padding: 0.75rem; background: var(--color-bg-dark); border: 1px dashed var(--color-border); border-radius: 8px; font-size: 0.8rem; color: var(--color-text-muted); display: inline-flex; align-items: center; gap: 0.5rem;">
                    <i class="fa-solid fa-clock-rotate-left" style="color: var(--color-primary);"></i>
                    <span>Last edited by <strong>${style.lastEditedBy}</strong> on ${new Date(style.lastEditedAt).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                ` : ''}
                
                <div class="detail-actions" style="display: flex; gap: 1rem; align-items: center; margin-top: 1.5rem;">
                    ${actionBtn}
                    <button class="btn-text" id="btn-edit-style" style="margin-left:auto;"><i class="fa-solid fa-pen-to-square"></i> Edit Style</button>
                </div>
            </div>
        `;

        // Load Materials (BOM) for this style
        fetchStyleMaterials(style.id);

        // Listeners for the dynamic action buttons
        const trackerBtn = document.getElementById('btn-live-tracker');
        if (trackerBtn) {
            trackerBtn.addEventListener('click', () => {
                openTracker(style);
            });
        }

        const viewTrackerBtn = document.getElementById('btn-view-tracker');
        if (viewTrackerBtn) {
            viewTrackerBtn.addEventListener('click', () => {
                openTracker(style);
            });
        }

        const editBtn = document.getElementById('btn-edit-style');
        if (editBtn) {
            editBtn.addEventListener('click', () => {
                // Populate the edit modal with current style data
                document.getElementById('edit-style-id').value = style.id;
                document.getElementById('edit-style-no').value = style.no;
                document.getElementById('edit-style-desc').value = style.desc;
                document.getElementById('edit-style-color').value = style.color || '';
                document.getElementById('edit-style-category').value = style.category;

                const sz = style.sizes || { XS: 0, S: 0, M: style.qty || 0, L: 0, XL: 0, XXL: 0 };
                document.getElementById('edit-style-size-xs').value = sz.XS;
                document.getElementById('edit-style-size-s').value = sz.S;
                document.getElementById('edit-style-size-m').value = sz.M;
                document.getElementById('edit-style-size-l').value = sz.L;
                document.getElementById('edit-style-size-xl').value = sz.XL;
                document.getElementById('edit-style-size-xxl').value = sz.XXL || 0;

                document.getElementById('edit-style-qty').value = style.qty;
                document.getElementById('edit-style-status').value = style.status;

                // Dates
                document.getElementById('edit-style-order-date').value = style.orderDate || '';
                document.getElementById('edit-style-due-date').value = style.dueDate || '';

                // Tracking template dropdown
                const editTemplateSelect = document.getElementById('edit-style-tracking-template');
                if (editTemplateSelect) {
                    editTemplateSelect.innerHTML = '<option value="">— Keep current template —</option>';
                    trackingTemplates.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = t.name;
                        if (t.id == style.trackingTemplateId) opt.selected = true;
                        editTemplateSelect.appendChild(opt);
                    });
                }

                // Current image preview
                const previewWrap = document.getElementById('edit-image-preview-wrap');
                const previewImg = document.getElementById('edit-image-current');
                if (previewWrap && previewImg && style.image) {
                    previewImg.src = style.image;
                    previewWrap.style.display = 'block';
                } else if (previewWrap) {
                    previewWrap.style.display = 'none';
                }
                // Clear file input
                const fileInput = document.getElementById('edit-style-image-file');
                if (fileInput) fileInput.value = '';

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
            });
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
        const template = getStyleTemplate(style);
        const steps = JSON.parse(template.steps || "[]");
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

            let showRejectionBadge = false;

            // 1. Determine if this step is the "Design" step based on name or team
            const isDesignStep = data.team?.toLowerCase().includes("design") ||
                data.name.toLowerCase().includes("design") ||
                data.name.toLowerCase().includes("artwork") ||
                data.name.toLowerCase().includes("approval");

            // 2. If no clear design step exists in the whole template, fallback to step 0
            const hasDesignStepInTemplate = timelineData.some(step =>
                step.team?.toLowerCase().includes("design") ||
                step.name.toLowerCase().includes("design") ||
                step.name.toLowerCase().includes("artwork") ||
                step.name.toLowerCase().includes("approval")
            );

            if (isDesignStep) {
                showRejectionBadge = true;
            } else if (!hasDesignStepInTemplate && index === 0) {
                showRejectionBadge = true;
            }

            console.log(`Step ${index} (${data.name}): isDesignStep=${isDesignStep}, hasDesignStepInTemplate=${hasDesignStepInTemplate}, showRejectionBadge=${showRejectionBadge}, designRejections=${style.designRejections}, currentStep=${currentStep}`);

            // We simplified the check here. If this is the "Design" step, and there ARE rejections, we show the badge.
            // We removed `currentStep >= index` so the badge is ALWAYS visible historically even if we are at a much later step or finished.
            if (showRejectionBadge && style.designRejections > 0) {
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
            timelineContainer.appendChild(div);

            if (isActive) {
                setTimeout(() => div.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
            }
        });

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

    if (btnConfirmRevertNo) {
        btnConfirmRevertNo.addEventListener('click', () => {
            modalConfirmRevert.classList.remove('active');
        });
    }

    // Helper to advance timeline
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

        // Custom Design Approval Interception
        const nextStepIndex = activeTrackerStyle.trackerStep + 1;
        let isNextStepDesign = false;

        if (nextStepIndex < steps.length) {
            const nextStep = steps[nextStepIndex];
            isNextStepDesign = nextStep.team?.toLowerCase().includes("design") ||
                nextStep.name.toLowerCase().includes("design") ||
                nextStep.name.toLowerCase().includes("artwork") ||
                nextStep.name.toLowerCase().includes("approval");

            // If the template has NO design steps at all, we could optionally intercept the FIRST step after Order Received.
            // But for safety and avoiding unnecessary popups on basic templates, we will ONLY intercept if we confidently think it's a design step.
        }

        if (isNextStepDesign) {
            modalDesignApproval.classList.add('active');
            return; // Wait for user decision inside the modal
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

    document.getElementById('btn-add-style').addEventListener('click', () => {
        modalAddStyle.classList.add('active');
    });

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
            deleteTargetId = null;
            deleteStyleTargetId = null;
        });
    });

    // --- Add Style Modal UI Logic ---
    const addStyleTabs = document.querySelectorAll('#modal-add-style .tab-btn');
    const addStyleContents = document.querySelectorAll('#modal-add-style .tab-content');
    const btnNextTab = document.getElementById('btn-next-tab');
    const btnPrevTab = document.getElementById('btn-prev-tab');
    const btnSubmitStyle = document.getElementById('btn-submit-style');

    let currentTabIndex = 0;

    function updateTabs(tabIndex) {
        const totalTabs = 4; // Increased from 3 to 4

        document.querySelectorAll('#modal-add-style .tab-btn').forEach((btn, index) => {
            if (index === tabIndex) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        document.querySelectorAll('#modal-add-style .tab-content').forEach((content, index) => {
            if (index === tabIndex) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
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

    // --- Image Drag & Drop Logic ---
    const uploadZone = document.getElementById('upload-zone');
    const fileInput = document.getElementById('style-image-file');
    const uploadPlaceholder = document.getElementById('upload-placeholder');
    const previewContainer = document.getElementById('image-preview-container');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image');

    if (uploadZone) {
        // Prevent default drag behaviors
        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, e => {
                e.preventDefault();
                e.stopPropagation();
            });
        });

        // Highlight active drop zone
        ['dragenter', 'dragover'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => uploadZone.classList.add('dragover'));
        });

        ['dragleave', 'drop'].forEach(eventName => {
            uploadZone.addEventListener(eventName, () => uploadZone.classList.remove('dragover'));
        });

        // Handle dropped files
        uploadZone.addEventListener('drop', e => {
            const dt = e.dataTransfer;
            const files = dt.files;
            if (files && files.length > 0) {
                fileInput.files = files; // Assign files to input
                handleImageFile(files[0]);
            }
        });

        if (fileInput) {
            fileInput.addEventListener('change', function () {
                if (this.files && this.files[0]) {
                    handleImageFile(this.files[0]);
                }
            });
        }

        if (removeImageBtn) {
            removeImageBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (fileInput) fileInput.value = '';
                previewContainer.style.display = 'none';
                uploadPlaceholder.style.display = 'block';
            });
        }

        function handleImageFile(file) {
            if (file.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onload = e => {
                    imagePreview.src = e.target.result;
                    uploadPlaceholder.style.display = 'none';
                    previewContainer.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        }
    }

    // --- Color Tab Interactivity ---
    const colorSwatches = document.querySelectorAll('.color-swatch');
    const customColorInputH = document.getElementById('custom-color-input');
    const finalColorHidden = document.getElementById('style-color');

    if (colorSwatches && finalColorHidden && customColorInputH) {
        colorSwatches.forEach(swatch => {
            swatch.addEventListener('click', () => {
                // Remove active class from all
                colorSwatches.forEach(s => s.classList.remove('active'));

                // Add active to clicked
                swatch.classList.add('active');

                // Clear custom input field so they know swatch is taking priority
                customColorInputH.value = '';

                // Update Hidden Input for API payload
                finalColorHidden.value = swatch.getAttribute('data-color');
            });
        });

        // Whenever user types a custom color, unselect all pre-defined swatches
        customColorInputH.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            finalColorHidden.value = val;

            if (val.length > 0) {
                colorSwatches.forEach(s => s.classList.remove('active'));
            }
        });
    }

    // --- Size Chips Logic ---
    const selectedSizesContainer = document.getElementById('selected-sizes-container');
    const noSizesMsg = document.getElementById('no-sizes-msg');
    const totalQtyInput = document.getElementById('style-qty');
    const btnCustomSize = document.getElementById('btn-custom-size');
    const customSizeContainer = document.getElementById('custom-size-container');
    const customSizeInput = document.getElementById('custom-size-input');
    const btnAddCustomSize = document.getElementById('btn-add-custom-size');
    const sizeChipsContainer = document.getElementById('size-chips');

    let activeSizes = {};

    function recalculateTotalQty() {
        let total = 0;
        document.querySelectorAll('.dynamic-size-qty').forEach(input => {
            total += parseInt(input.value) || 0;
        });
        if (totalQtyInput) totalQtyInput.value = total;
    }

    function createSizeInputNode(size) {
        if (activeSizes[size] !== undefined) return;
        activeSizes[size] = 0;

        const div = document.createElement('div');
        div.className = 'dynamic-size-block';
        div.setAttribute('data-size-ref', size);
        div.innerHTML = `
            <div style="font-size: 0.8rem; color: var(--color-text-muted); margin-bottom: 0.5rem; text-align: center; font-weight: 700;">${size}</div>
            <input type="number" class="dynamic-size-qty" placeholder="0" min="0" style="width: 100%; text-align: center; padding: 0.6rem; border-radius: 6px; border: 1px solid var(--color-border-light); background: var(--color-bg-dark); color: var(--color-text-main);">
        `;

        const input = div.querySelector('input');
        input.addEventListener('input', (e) => {
            activeSizes[size] = parseInt(e.target.value) || 0;
            recalculateTotalQty();
        });

        if (noSizesMsg) noSizesMsg.style.display = 'none';
        selectedSizesContainer.appendChild(div);
    }

    function removeSizeInputNode(size) {
        delete activeSizes[size];
        const block = selectedSizesContainer.querySelector(`[data-size-ref="${size}"]`);
        if (block) block.remove();

        if (Object.keys(activeSizes).length === 0 && noSizesMsg) {
            noSizesMsg.style.display = 'block';
        }
        recalculateTotalQty();
    }

    if (sizeChipsContainer) {
        sizeChipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.size-chip:not(#btn-custom-size)');
            if (!chip) return;

            const size = chip.getAttribute('data-size');
            chip.classList.toggle('active');

            if (chip.classList.contains('active')) {
                createSizeInputNode(size);
            } else {
                removeSizeInputNode(size);
            }
        });
    }

    if (btnCustomSize && customSizeContainer) {
        btnCustomSize.addEventListener('click', () => {
            customSizeContainer.style.display = customSizeContainer.style.display === 'none' ? 'flex' : 'none';
            if (customSizeContainer.style.display === 'flex') {
                customSizeInput.focus();
            }
        });
    }

    if (btnAddCustomSize && customSizeInput && sizeChipsContainer) {
        btnAddCustomSize.addEventListener('click', () => {
            const val = customSizeInput.value.trim().toUpperCase();
            if (val) {
                const existing = sizeChipsContainer.querySelector(`[data-size="${val}"]`);
                if (existing) {
                    if (!existing.classList.contains('active')) existing.click();
                } else {
                    const chip = document.createElement('button');
                    chip.type = 'button';
                    chip.className = 'size-chip active';
                    chip.setAttribute('data-size', val);
                    chip.textContent = val;
                    const wrapper = document.getElementById('custom-size-wrapper');
                    if (wrapper) {
                        wrapper.insertBefore(chip, btnCustomSize);
                    } else {
                        sizeChipsContainer.appendChild(chip);
                    }
                    createSizeInputNode(val);
                }
                customSizeInput.value = '';
                customSizeContainer.style.display = 'none';
            }
        });
    }

    // Reset Form hook called when closing modal
    window.resetAddStyleForm = function () {
        const previewContainer = document.getElementById('tracking-preview-container');
        const uploadPlaceholder = document.getElementById('upload-placeholder');
        const fileInput = document.getElementById('style-image-file');

        if (previewContainer) previewContainer.style.display = 'none';
        if (uploadPlaceholder) uploadPlaceholder.style.display = 'block';
        if (fileInput) fileInput.value = '';
        activeSizes = {};
        document.querySelectorAll('.dynamic-size-block').forEach(el => el.remove());
        document.querySelectorAll('.size-chip.active').forEach(chip => chip.classList.remove('active'));
        if (noSizesMsg) noSizesMsg.style.display = 'block';
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
        const finalColorHidden = document.getElementById('style-color');
        const customColorInputH = document.getElementById('custom-color-input');
        if (finalColorHidden) finalColorHidden.value = '';
        if (customColorInputH) customColorInputH.value = '';
        document.querySelectorAll('.color-swatch.active').forEach(s => s.classList.remove('active'));

        currentTabIndex = 0;
        updateTabs(0);
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
        const color = document.getElementById('style-color').value;
        const category = document.getElementById('style-category').value;

        // Grab dynamic sizes
        const sizes = { ...activeSizes };
        const standardKeys = ["XS", "S", "M", "L", "XL", "XXL"];
        standardKeys.forEach(k => { if (sizes[k] === undefined) sizes[k] = 0; });

        let qty = 0;
        Object.values(sizes).forEach(v => qty += v);

        const status = document.getElementById('style-status').value;
        const orderDate = document.getElementById('style-order-date').value;
        const localFileInput = document.getElementById('style-image-file');

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
                trackerStep: status === 'finished' ? 9 : 0,
                deliveryDate: status === 'finished' ? new Date().toISOString().split('T')[0] : null,
                image: imageBase64 || "",
                createdDate: new Date().toISOString(),
                designRejections: 0
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

                const newSizes = {
                    XS: parseInt(document.getElementById('edit-style-size-xs').value) || 0,
                    S: parseInt(document.getElementById('edit-style-size-s').value) || 0,
                    M: parseInt(document.getElementById('edit-style-size-m').value) || 0,
                    L: parseInt(document.getElementById('edit-style-size-l').value) || 0,
                    XL: parseInt(document.getElementById('edit-style-size-xl').value) || 0,
                    XXL: parseInt(document.getElementById('edit-style-size-xxl').value) || 0
                };
                const newQty = Object.values(newSizes).reduce((a, b) => a + b, 0);

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

                // Get tracking template (keep current if blank)
                const editTemplateSelect = document.getElementById('edit-style-tracking-template');
                const newTemplateId = editTemplateSelect && editTemplateSelect.value
                    ? parseInt(editTemplateSelect.value)
                    : (stylesData[styleIndex].trackingTemplateId || 1);

                // Audit trail — grab current user from session
                const sessionData = JSON.parse(localStorage.getItem('bm_session') || '{}');
                const editorName = sessionData.name || sessionData.fullRole || 'Unknown';
                const editedAt = new Date().toISOString();

                const stylePayload = {
                    no: document.getElementById('edit-style-no').value,
                    desc: document.getElementById('edit-style-desc').value,
                    color: document.getElementById('edit-style-color').value,
                    category: document.getElementById('edit-style-category').value,
                    sizes: newSizes,
                    qty: newQty,
                    status: newStatus,
                    trackerStep: newTrackerStep,
                    deliveryDate: newDeliveryDate,
                    orderDate: document.getElementById('edit-style-order-date').value || stylesData[styleIndex].orderDate,
                    dueDate: document.getElementById('edit-style-due-date').value || stylesData[styleIndex].dueDate,
                    trackingTemplateId: newTemplateId,
                    image: newImage,
                    lastEditedBy: editorName,
                    lastEditedAt: editedAt
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
                steps.forEach(s => addStepRow(s.name, s.duration, s.dependency, s.team));
            }
        } else {
            // Add a default first step
            addStepRow('Order Received', 0, '', 'Sales');
        }

        modalAddTemplate.classList.add('active');
    }

    function addStepRow(name = "", duration = "", dependency = "", team = "") {
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

    function calculatePreviewDates() {
        const previewContainer = document.getElementById('tracking-preview-container');
        const previewTbody = document.getElementById('tracking-preview-tbody');

        if (!trackingTemplateSelect || !trackingTemplateSelect.value) {
            if (previewContainer) previewContainer.style.display = 'none';
            return;
        }

        const template = trackingTemplates.find(t => t.id == trackingTemplateSelect.value);
        if (!template) return;

        // Determine base (order) date and due date
        let baseDate = new Date();
        if (orderDateInputTrackingFallback && orderDateInputTrackingFallback.value) {
            baseDate = new Date(orderDateInputTrackingFallback.value);
        }

        const steps = typeof template.steps === 'string' ? JSON.parse(template.steps) : template.steps;
        const totalTemplateDuration = steps.reduce((acc, step) => acc + parseInt(step.duration || 0), 0);

        // Calculate available days window
        let availableDays = totalTemplateDuration; // fallback: use template total
        if (dueDateInput && dueDateInput.value) {
            const targetDue = new Date(dueDateInput.value);
            const diffTime = targetDue - baseDate;
            availableDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
        }

        previewTbody.innerHTML = '';
        previewContainer.style.display = 'block';

        // Show/update the days budget counter
        let budgetBar = document.getElementById('step-days-budget-bar');
        if (!budgetBar) {
            const tableWrapper = previewContainer.querySelector('div');
            budgetBar = document.createElement('div');
            budgetBar.id = 'step-days-budget-bar';
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

        // Pre-compute initial proportional allocations
        const initialDurations = steps.map((step, index) => {
            if (totalTemplateDuration > 0 && availableDays !== null) {
                if (index === steps.length - 1) {
                    const sumSoFar = steps.slice(0, index).reduce((s, s2, i2) => {
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

        steps.forEach((step, index) => {
            const initDays = initialDurations[index];
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-main); font-size: 0.85rem;">${step.name}</td>
                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--color-border-light);">
                    <span style="background: var(--color-bg-dark); padding: 3px 8px; border-radius: 4px; font-size: 0.75rem; border: 1px solid var(--color-border); color: var(--color-text-muted);">${step.team || '—'}</span>
                </td>
                <td style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--color-border-light);">
                    <div style="display: flex; align-items: center; gap: 0.4rem;">
                        <input type="number"
                            class="step-day-input"
                            value="${initDays}"
                            min="0"
                            max="${availableDays}"
                            style="width: 64px; padding: 0.3rem 0.5rem; background: #fff; border: 1px solid #D1D5DB; border-radius: 6px; font-size: 0.85rem; color: #111827; text-align: center;"
                        >
                        <span style="font-size: 0.75rem; color: var(--color-text-muted);">days</span>
                    </div>
                </td>
                <td class="step-target-date" style="padding: 0.6rem 0.75rem; border-bottom: 1px solid var(--color-border-light); text-align: right; color: var(--color-primary); font-family: var(--font-mono); font-weight: 500; font-size: 0.82rem;"></td>
            `;
            tr.querySelector('.step-day-input').addEventListener('input', (e) => {
                // Clamp: can't go above availableDays total across all inputs
                const inputs = previewTbody.querySelectorAll('.step-day-input');
                const totalOthers = Array.from(inputs).reduce((s, inp) => inp !== e.target ? s + (parseInt(inp.value) || 0) : s, 0);
                const maxForThis = availableDays - totalOthers;
                if (parseInt(e.target.value) > maxForThis) {
                    e.target.value = maxForThis;
                }
                if (parseInt(e.target.value) < 0) e.target.value = 0;
                updateBudget();
            });
            previewTbody.appendChild(tr);
        });

        updateBudget();
    }

    // Also update the header to show a "Days" column label
    const previewThead = document.querySelector('#tracking-preview-container thead tr');
    if (previewThead && previewThead.children.length === 3) {
        previewThead.children[2].textContent = 'Days';
        const dateHeader = document.createElement('th');
        dateHeader.style.cssText = 'padding: 0.75rem; text-align: right; border-bottom: 1px solid var(--color-border-light); color: var(--color-text-muted); font-weight: 500;';
        dateHeader.textContent = 'Target Date';
        previewThead.appendChild(dateHeader);
    }

    if (dueDateInput) {
        dueDateInput.addEventListener('change', () => {
            populateTemplatesDropdown();
            calculatePreviewDates();
        });
    }
    if (trackingTemplateSelect) trackingTemplateSelect.addEventListener('change', calculatePreviewDates);
    if (orderDateInputTrackingFallback) orderDateInputTrackingFallback.addEventListener('change', calculatePreviewDates);


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

    const FAQ_RESPONSES = {
        "track": "To track an order, go to the **Styles** section, click on a style, and then click the **Live Tracker** button. You can see the progress in Timeline, Gantt, or CPM views!",
        "cpm": "The **CPM (Critical Path Method)** chart shows the sequence of steps required to finish an order. The active step is highlighted, and you can see the flow of work from start to finish.",
        "add": "To add a new delivery, click the pulsing **'+'** button on the Deliveries page. Fill in the details, and your delivery will be added to the dashboard!",
        "who": "**Black Mango** is a premium fashion tracking and management system designed for speed, clarity, and style. 🥭",
        "default": "I'm still learning! Try clicking one of the common questions below or ask me about tracking, deliveries, or CPM charts."
    };

    if (aiChatToggle) {
        aiChatToggle.addEventListener('click', () => {
            aiChatWindow.classList.add('active');
            aiChatToggle.style.transform = 'scale(0) rotate(-90deg)';
            aiChatToggle.style.opacity = '0';
        });
    }

    if (aiChatClose) {
        aiChatClose.addEventListener('click', () => {
            aiChatWindow.classList.remove('active');
            aiChatToggle.style.transform = 'scale(1) rotate(0)';
            aiChatToggle.style.opacity = '1';
        });
    }

    // Consolidated Dismiss Logic
    const chatDismissBtn = document.getElementById('ai-chat-dismiss');
    const chatWrapper = document.querySelector('.ai-chat-wrapper');
    if (chatDismissBtn && chatWrapper) {
        chatDismissBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Don't trigger FAB click
            chatWrapper.style.display = 'none';

            // If window was open, close it too
            if (aiChatWindow) aiChatWindow.classList.remove('active');
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
        const text = aiChatInput.value.trim();
        if (!text) return;

        appendMessage(text, 'user');
        aiChatInput.value = '';

        // Simple keyword matching for demo
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
});
