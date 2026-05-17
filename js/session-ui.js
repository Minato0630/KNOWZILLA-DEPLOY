// Knowzilla Session UI — shared across all pages
// Checks session, shows username, handles logout

(function() {
    const API_BASE = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'http://localhost:5000'
        : '';

    async function initSession() {
        const dashboardEl = document.getElementById('dashboard-li');
        try {
            const res = await fetch(API_BASE + '/api/session', { credentials: 'include' });
            const data = await res.json();
            if (data.user) {
                // Show welcome
                const welcomeEl = document.getElementById('user-welcome-li');
                const usernameEl = document.getElementById('username-display');
                const logoutEl = document.getElementById('logout-li');
                const loginEl = document.getElementById('login-li');

                if (usernameEl) usernameEl.textContent = data.user.name;
                if (welcomeEl) welcomeEl.style.display = 'list-item';
                if (logoutEl) logoutEl.style.display = 'list-item';
                if (loginEl) loginEl.style.display = 'none';
                if (dashboardEl) dashboardEl.style.display = 'list-item';
            } else {
                if (dashboardEl) dashboardEl.style.display = 'none';
            }
        } catch (err) {
            if (dashboardEl) dashboardEl.style.display = 'none';
        }
    }

    // Global logout function
    window.logoutUser = async function() {
        try {
            await fetch(API_BASE + '/api/logout', { method: 'POST', credentials: 'include' });
            window.location.href = '/login.html';
        } catch (err) {
            window.location.href = '/login.html';
        }
    };

    // Run on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initSession);
    } else {
        initSession();
    }
})();
