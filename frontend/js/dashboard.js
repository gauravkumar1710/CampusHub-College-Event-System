/**
 * CampusHub Dashboard Interactive Logic
 * Handles live search, sidebar toggles, and UI states.
 */

document.addEventListener('DOMContentLoaded', () => {
    initSidebarToggle();
    initLiveSearch();
});

function initSidebarToggle() {
    const toggleBtn = document.getElementById('sidebarToggleBtn');
    const sidebar = document.getElementById('dashboardSidebar');
    
    if (!toggleBtn || !sidebar) return;

    // Check device width initially
    if (window.innerWidth <= 768) {
        sidebar.classList.remove('collapsed');
    }

    toggleBtn.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
            // Mobile: Toggle off-canvas
            sidebar.classList.toggle('open');
        } else {
            // Desktop: Toggle minimize
            sidebar.classList.toggle('collapsed');
        }
    });

    // Close mobile sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768 && sidebar.classList.contains('open')) {
            if (!sidebar.contains(e.target) && !toggleBtn.contains(e.target)) {
                sidebar.classList.remove('open');
            }
        }
    });
}

function initLiveSearch() {
    const searchInput = document.getElementById('dashboardSearch');
    const tbody = document.getElementById('registeredEventsTable');
    
    if (!searchInput || !tbody) return;

    searchInput.addEventListener('input', function() {
        const term = this.value.toLowerCase().trim();
        const rows = tbody.querySelectorAll('tr');

        let hasVisible = false;

        rows.forEach(row => {
            // Skip loading row or "no records" row from being searched
            if (row.classList.contains('no-records') || row.classList.contains('loading-row')) return;

            const text = row.textContent.toLowerCase();
            if (text.includes(term)) {
                row.style.display = '';
                hasVisible = true;
            } else {
                row.style.display = 'none';
            }
        });

        // Manage "No Records Found" state
        let noRecordsRow = tbody.querySelector('.no-records');
        if (!hasVisible && rows.length > 0 && !rows[0].classList.contains('loading-row')) {
            if (!noRecordsRow) {
                noRecordsRow = document.createElement('tr');
                noRecordsRow.className = 'no-records';
                noRecordsRow.innerHTML = `<td colspan="4" style="text-align: center; color: var(--text-muted); padding:30px;">No matching events found.</td>`;
                tbody.appendChild(noRecordsRow);
            } else {
                noRecordsRow.style.display = '';
            }
        } else if (noRecordsRow) {
            noRecordsRow.style.display = 'none';
        }
    });
}
