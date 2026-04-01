const API_BASE_URL = '/backend/api';

function checkAuth() {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    
    // Update navbar based on auth status
    const authLinks = document.querySelectorAll('.auth-links');
    const navBarNav = document.querySelector('#navbarNav ul');

    if (user && navBarNav) {
        authLinks.forEach(link => link.style.display = 'none');
        
        // Ensure not adding duplicates if already present (useful for SPAs, though we are MPA)
        if(!document.getElementById('nav-dashboard')) {
            const dashboardLi = document.createElement('li');
            dashboardLi.id = 'nav-dashboard';
            dashboardLi.className = 'nav-item';
            dashboardLi.innerHTML = '<a class="nav-link fw-bold text-primary" href="dashboard.html">Dashboard</a>';
            navBarNav.appendChild(dashboardLi);
        }
        
        if(!document.getElementById('nav-logout')) {
            const logoutLi = document.createElement('li');
            logoutLi.id = 'nav-logout';
            logoutLi.className = 'nav-item';
            logoutLi.innerHTML = '<button class="btn btn-outline-danger ms-2" onclick="logout()">Logout</button>';
            navBarNav.appendChild(logoutLi);
        }
    }
}

function logout() {
    localStorage.removeItem('campushub_user');
    window.location.href = 'login.html';
}

function showAlert(boxId, type, message) {
    if (typeof showPremiumToast === 'function') {
        showPremiumToast(type, message);
    } else {
        const box = document.getElementById(boxId);
        if (!box) return;
        box.className = `alert alert-${type}`;
        box.textContent = message;
        box.classList.remove('d-none');
    }
}

// Escape HTML utility to prevent XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Avatar Management system
function updateDynamicAvatars() {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    if (!user) return;
    
    // Auto-update dashboard top navigation role badge if it exists
    const roleBadge = document.getElementById('topNavRole');
    if (roleBadge) {
        roleBadge.textContent = user.role;
        // Optional: color coding based on role
        if (user.role === 'Admin') {
            roleBadge.style.background = '#FEE2E2'; // Red tint
            roleBadge.style.color = '#EF4444';
            roleBadge.style.borderColor = '#FECACA';
        } else if (user.role === 'Organizer') {
            roleBadge.style.background = '#FEF3C7'; // Yellow tint
            roleBadge.style.color = '#F59E0B';
            roleBadge.style.borderColor = '#FDE68A';
        } else {
            // Student styling is default purple
            roleBadge.style.background = 'rgba(139, 92, 246, 0.1)';
            roleBadge.style.color = '#8B5CF6';
            roleBadge.style.borderColor = 'rgba(139, 92, 246, 0.3)';
        }
    }

    const avatars = document.querySelectorAll('.user-avatar');
    avatars.forEach(img => {
        if (user.profile_picture) {
            img.src = '/' + user.profile_picture;
        } else {
            img.src = 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80&fit=crop';
        }
        
        img.style.cursor = 'pointer';
        img.onclick = (e) => {
            e.stopPropagation(); // Prevent dropdown toggle if clicked directly on image to open upload modal
            openAvatarModal();
        };
    });
}

function injectAvatarModal() {
    if (document.getElementById('avatarUploadModal')) return;
    
    const modalHTML = `
    <div class="modal fade" id="avatarUploadModal" tabindex="-1" aria-hidden="true" style="z-index:9999;">
      <div class="modal-dialog modal-dialog-centered modal-sm">
        <div class="modal-content" style="border-radius:16px;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold">Update Photo</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-3 pb-4 px-4 text-center">
             <div class="mb-4">
                 <img id="avatarPreview" src="" class="rounded-circle object-fit-cover shadow-sm" style="width:110px; height:110px; border:3px solid var(--neon-purple);">
             </div>
            <form id="avatarUploadForm">
              <input type="file" id="avatarFileInput" accept="image/png, image/jpeg, image/webp" class="form-control mb-3 text-sm shadow-none" required>
              <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold" style="background:#4F46E5; border:none; border-radius:8px;">Upload Image</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('avatarFileInput').addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            document.getElementById('avatarPreview').src = URL.createObjectURL(file);
        }
    });

    document.getElementById('avatarUploadForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = document.getElementById('avatarFileInput');
        if (!fileInput.files[0]) return;
        
        const user = JSON.parse(localStorage.getItem('campushub_user'));
        const formData = new FormData();
        formData.append('user_id', user.id);
        formData.append('avatar', fileInput.files[0]);
        
        const btn = document.querySelector('#avatarUploadForm button');
        btn.disabled = true;
        btn.textContent = 'Uploading...';
        
        try {
            const res = await fetch('/backend/api/users/upload_avatar.php', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                user.profile_picture = data.profile_picture;
                localStorage.setItem('campushub_user', JSON.stringify(user));
                updateDynamicAvatars();
                showAlert('alertBox', 'success', 'Profile photo permanently updated!');
                if (typeof showPremiumToast === 'function') showPremiumToast('success', 'Profile photo permanently updated!');
                bootstrap.Modal.getInstance(document.getElementById('avatarUploadModal')).hide();
            } else {
                if (typeof showPremiumToast === 'function') showPremiumToast('danger', data.message);
                else alert(data.message);
            }
        } catch (err) {
            console.error(err);
            if (typeof showPremiumToast === 'function') showPremiumToast('danger', 'Failed to upload image.');
        } finally {
            btn.disabled = false;
            btn.textContent = 'Upload Image';
        }
    });
}

function openAvatarModal() {
    injectAvatarModal();
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    const defSrc = user && user.profile_picture ? '/' + user.profile_picture : 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?w=100&q=80&fit=crop';
    document.getElementById('avatarPreview').src = defSrc;
    document.getElementById('avatarUploadForm').reset();
    
    const myModal = new bootstrap.Modal(document.getElementById('avatarUploadModal'));
    myModal.show();
}

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    updateDynamicAvatars();
});
