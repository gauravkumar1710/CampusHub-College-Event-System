async function loadEvents(organizerId = null, containerId = 'allEventsContainer', limit = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    try {
        let url = `${API_BASE_URL}/events/list.php`;
        if (organizerId) {
            url += `?organizer_id=${organizerId}`;
        }
        
        const res = await fetch(url);
        const data = await res.json();

        if (data.status === 'success') {
            container.innerHTML = '';
            
            if (data.events.length === 0) {
                container.innerHTML = '<div class="col-12"><p class="text-muted">No events found.</p></div>';
                return;
            }

            let eventsToRender = data.events;
            if (limit && limit > 0) {
                eventsToRender = eventsToRender.slice(0, limit);
            }

            const currentUser = JSON.parse(localStorage.getItem('campushub_user'));

            eventsToRender.forEach((event, idx) => {
                const date = new Date(event.event_date).toLocaleDateString(undefined, {
                    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
                });
                const isFull = parseInt(event.registered_count) >= parseInt(event.capacity);
                const imageUrl = `https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=500&q=80&auto=format&fit=crop`; 
                
                const btnClass = (idx % 2 === 0) ? 'btn-teal' : 'btn-purple-sm';
                
                let actionHtml = '';
                if (!currentUser || currentUser.role === 'Student') {
                    actionHtml = `<button class="${btnClass} py-2 px-3" style="${btnClass==='btn-purple-sm'?'background:var(--stat-purple); color:white; border:none; border-radius:6px;':''}" 
                                        onclick="openRegistrationModal(${event.id}, '${event.event_date}')" ${isFull ? 'disabled' : ''}>
                                        ${isFull ? 'Full' : 'Register'}
                                    </button>`;
                } else {
                    actionHtml = `<span class="badge bg-secondary p-2 me-2">Staff Only</span>`;
                }
                
                // Add download CSV/PDF button, Notify button, and Delete button for Organizers and Admins
                if (currentUser && (currentUser.role === 'Admin' || (currentUser.role === 'Organizer' && currentUser.id == event.organizer_id))) {
                    actionHtml += `<a href="${API_BASE_URL}/events/print_students.php?event_id=${event.id}&user_id=${currentUser.id}" target="_blank" class="btn btn-primary btn-sm ms-2 py-2 px-3 fw-medium rounded text-decoration-none" style="background:#4F46E5; border:none;"><i class="bi bi-file-earmark-pdf-fill"></i> Students</a>`;
                    actionHtml += `<button class="btn btn-warning btn-sm ms-2 py-2 px-3 fw-medium rounded border-0 text-dark" onclick="openAlertModal(${event.id}, '${escapeHTML(event.title)}')"><i class="bi bi-envelope-paper-heart"></i> Alert</button>`;
                    actionHtml += `<button class="btn btn-danger btn-sm ms-2 py-2 px-3 fw-medium rounded border-0" onclick="deleteEvent(${event.id}, '${escapeHTML(event.title)}')"><i class="bi bi-trash3-fill"></i></button>`;
                }

                // Countdown Logic
                const eventTime = new Date(event.event_date).getTime();
                const now = new Date().getTime();
                const diff = eventTime - now;
                let countdownText = "Event Passed";
                if (diff > 0) {
                    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
                    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
                    countdownText = `Starts in ${days}d ${hours}h`;
                }

                const card = document.createElement('div');
                card.className = 'col-md-4 mb-4';
                card.innerHTML = `
                    <div class="event-card">
                        <div class="card-img-wrap" style="height:160px; overflow:hidden;">
                            <img src="${imageUrl}" class="w-100 h-100 object-fit-cover" alt="Event Cover">
                            <span class="card-tag">${event.category || 'General'}</span>
                        </div>
                        <div class="event-content" style="padding:24px;">
                            <h4 class="event-title">${escapeHTML(event.title)}</h4>
                            
                            <div class="event-meta">
                                <span><i class="bi bi-calendar3"></i> ${date}</span>
                            </div>
                            <div class="event-meta">
                                <span><i class="bi bi-geo-alt"></i> ${escapeHTML(event.location)}</span>
                            </div>
                            <div class="event-countdown" style="margin-bottom: 12px; margin-top: 4px;">
                                <i class="bi bi-hourglass-split"></i> ${countdownText}
                            </div>
                            <div class="event-meta mb-3 text-secondary">
                                <span><i class="bi bi-people"></i> Capacity: ${event.registered_count}/${event.capacity}</span>
                            </div>
                            
                            <p class="event-desc">${escapeHTML(event.description || 'No description provided.')}</p>
                            
                            <div class="d-flex justify-content-between align-items-center mt-auto pt-3 border-top">
                                <span class="small text-muted fw-medium py-2">By ${escapeHTML(event.organizer_name)}</span>
                                <div>
                                    ${actionHtml}
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                container.appendChild(card);
            });
        }
    } catch (err) {
        console.error('Failed to load events:', err);
        container.innerHTML = '<div class="col-12"><div class="alert alert-danger">Failed to load events.</div></div>';
    }
}

// Inject Bootstrap Modal into DOM for Sending Emails
function injectAlertModal() {
    if (document.getElementById('emailAlertModal')) return;
    
    const modalHTML = `
    <div class="modal fade" id="emailAlertModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:16px;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold" style="color:#F59E0B;">Broadcast Email Alert</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-3 pb-4 px-4">
            <p class="text-muted small mb-4">Send a direct email notification to every registered participant for: <strong id="alertEventTitle" style="color:var(--text-dark);"></strong></p>
            <form id="emailAlertForm">
              <input type="hidden" id="alertEventId">
              <div class="mb-4">
                <label class="form-label text-muted small fw-semibold">Message *</label>
                <textarea class="form-control" id="alertMessageBody" rows="4" placeholder="e.g. The venue has changed to the Main Auditorium. Please arrive 30 mins early." required style="border-radius:8px;"></textarea>
              </div>
              <button type="submit" class="btn btn-warning w-100 py-2 fw-semibold text-dark" style="background:#F59E0B; border-radius:8px; border:none;">Send Email Blast <i class="bi bi-send-fill ms-2"></i></button>
            </form>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('emailAlertForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitEmailAlert();
    });
}

function openAlertModal(eventId, eventTitle) {
    injectAlertModal();
    document.getElementById('alertEventId').value = eventId;
    document.getElementById('alertEventTitle').textContent = eventTitle;
    document.getElementById('emailAlertForm').reset();
    
    const myModal = new bootstrap.Modal(document.getElementById('emailAlertModal'));
    myModal.show();
}

async function deleteEvent(eventId, eventTitle) {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    if (!user) return;
    
    const confirmDelete = await Swal.fire({
        title: 'Delete Campaign?',
        text: `Are you sure you want to permanently delete "${eventTitle}"? All registrations will be wiped.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#EF4444',
        cancelButtonColor: '#6B7280',
        confirmButtonText: 'Yes, delete it!'
    });

    if (confirmDelete.isConfirmed) {
        try {
            const res = await fetch(`${API_BASE_URL}/events/delete.php`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ event_id: eventId, user_id: user.id })
            });
            const data = await res.json();
            
            if (data.status === 'success') {
                showPremiumToast('success', 'Campaign deleted successfully.');
                setTimeout(() => window.location.reload(), 1500);
            } else {
                showPremiumToast('danger', data.message || 'Failed to delete campaign.');
            }
        } catch (error) {
            console.error(error);
            showPremiumToast('danger', 'An error occurred while deleting.');
        }
    }
}

async function submitEmailAlert() {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    const eventId = document.getElementById('alertEventId').value;
    const message = document.getElementById('alertMessageBody').value;
    const submitBtn = document.querySelector('#emailAlertForm button');
    
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Sending...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/events/send_alert.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                event_id: eventId, 
                admin_id: user.id,
                message: message
            })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            showPremiumToast('success', data.message);
            const myModal = bootstrap.Modal.getInstance(document.getElementById('emailAlertModal'));
            myModal.hide();
        } else {
            showPremiumToast('danger', data.message || 'Error sending email.');
        }
    } catch (err) {
        console.error(err);
        showPremiumToast('danger', 'An error occurred during broadcasting.');
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Send Email Blast <i class="bi bi-send-fill ms-2"></i>';
    }
}

// Inject Bootstrap Modal into DOM for Registration Form
function injectRegistrationModal() {
    if (document.getElementById('registerModal')) return;
    
    const modalHTML = `
    <div class="modal fade" id="registerModal" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content" style="border-radius:16px;">
          <div class="modal-header border-0 pb-0">
            <h5 class="modal-title fw-bold" style="color:var(--primary-blue);">Event Registration</h5>
            <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
          </div>
          <div class="modal-body pt-3 pb-4 px-4">
            <div id="modalAlertBox" class="alert d-none" role="alert" style="font-size:0.9rem;"></div>
            <div id="modalCountdown" class="alert d-none mb-3" style="background:rgba(16, 185, 129, 0.1); color:var(--neon-lime); border:1px solid rgba(16, 185, 129, 0.2); font-weight:700;">
                <i class="bi bi-clock-history me-2"></i> <span id="regCountdownText"></span>
            </div>
            <p class="text-muted small mb-4">Please fill out these details to complete your registration.</p>
            <form id="studentRegistrationForm">
              <input type="hidden" id="regEventId">
              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">University Roll No *</label>
                <input type="text" class="form-control" id="regRollNo" required>
              </div>
              <div class="mb-3">
                <label class="form-label text-muted small fw-semibold">College Name *</label>
                <input type="text" class="form-control" id="regCollege" required>
              </div>
              <div class="row">
                <div class="col-md-6 mb-3">
                  <label class="form-label text-muted small fw-semibold">Course *</label>
                  <input type="text" class="form-control" id="regCourse" placeholder="e.g. B.Tech" required>
                </div>
                <div class="col-md-6 mb-4">
                  <label class="form-label text-muted small fw-semibold">Section</label>
                  <input type="text" class="form-control" id="regSection">
                </div>
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2" style="background:var(--primary-blue); border-radius:8px; border:none; font-weight:600;">Confirm Registration</button>
            </form>
          </div>
        </div>
      </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    document.getElementById('studentRegistrationForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        await submitRegistration();
    });
}

function openRegistrationModal(eventId, eventDate) {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    if (!user) {
        window.location.href = 'login.html';
        return;
    }
    
    injectRegistrationModal();
    document.getElementById('regEventId').value = eventId;
    
    if (eventDate) {
        const diff = new Date(eventDate).getTime() - new Date().getTime();
        let txt = "Event Passed";
        if (diff > 0) {
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            txt = `Event starts in ${days}d ${hours}h`;
        }
        document.getElementById('regCountdownText').textContent = txt;
        document.getElementById('modalCountdown').classList.remove('d-none');
    }
    
    // reset form
    document.getElementById('studentRegistrationForm').reset();
    document.getElementById('modalAlertBox').classList.add('d-none');
    
    const myModal = new bootstrap.Modal(document.getElementById('registerModal'));
    myModal.show();
}

async function submitRegistration() {
    const user = JSON.parse(localStorage.getItem('campushub_user'));
    const eventId = document.getElementById('regEventId').value;
    const rollNo = document.getElementById('regRollNo').value;
    const college = document.getElementById('regCollege').value;
    const course = document.getElementById('regCourse').value;
    const section = document.getElementById('regSection').value;
    
    const alertBox = document.getElementById('modalAlertBox');
    const submitBtn = document.querySelector('#studentRegistrationForm button');
    
    submitBtn.disabled = true;
    submitBtn.textContent = 'Registering...';
    
    try {
        const res = await fetch(`${API_BASE_URL}/events/register_event.php`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                event_id: eventId, 
                student_id: user.id,
                roll_no: rollNo,
                college: college,
                course: course,
                section: section
            })
        });
        const data = await res.json();
        
        if (data.status === 'success') {
            alertBox.className = 'alert alert-success';
            alertBox.textContent = 'Registration successful!';
            alertBox.classList.remove('d-none');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            alertBox.className = 'alert alert-danger';
            alertBox.textContent = data.message || data.error;
            alertBox.classList.remove('d-none');
        }
    } catch (err) {
        console.error(err);
        alertBox.className = 'alert alert-danger';
        alertBox.textContent = 'An error occurred during registration. Check console.';
        alertBox.classList.remove('d-none');
    } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Confirm Registration';
    }
}

async function loadAdminStats(adminId) {
    const container = document.getElementById('adminStats');
    if (!container) return;

    try {
        const res = await fetch(`${API_BASE_URL}/admin/stats.php?admin_id=${adminId}`);
        const data = await res.json();

        if (data.status === 'success') {
            const stats = data.stats;
            container.innerHTML = `
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon icon-blue" style="background:var(--light-blue); color:var(--primary-blue);"><i class="bi bi-people-fill"></i></div>
                        <div class="stat-value" style="font-size:2rem; font-weight:700;">${stats.total_users}</div>
                        <div class="stat-label" style="text-transform:uppercase; font-size:0.8rem; color:var(--text-muted);">Total Users</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon icon-green" style="background:#E8F5EE; color:var(--stat-green);"><i class="bi bi-calendar-event"></i></div>
                        <div class="stat-value" style="font-size:2rem; font-weight:700;">${stats.total_events}</div>
                        <div class="stat-label" style="text-transform:uppercase; font-size:0.8rem; color:var(--text-muted);">Total Events</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon icon-orange" style="background:#FFF3E0; color:#F57C00;"><i class="bi bi-clipboard-check"></i></div>
                        <div class="stat-value" style="font-size:2rem; font-weight:700;">${stats.total_registrations}</div>
                        <div class="stat-label" style="text-transform:uppercase; font-size:0.8rem; color:var(--text-muted);">Registrations</div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="stat-card">
                        <div class="stat-icon icon-red" style="background:#FDECEA; color:var(--stat-purple);"><i class="bi bi-person-badge"></i></div>
                        <div class="stat-value" style="font-size:2rem; font-weight:700;">${stats.total_organizers} / ${stats.total_students}</div>
                        <div class="stat-label" style="text-transform:uppercase; font-size:0.8rem; color:var(--text-muted);">Orgs / Students</div>
                    </div>
                </div>
            `;
        }
    } catch (err) {
        console.error('Failed to load stats:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const createEventForm = document.getElementById('createEventForm');
    
    if (createEventForm) {
        createEventForm.addEventListener('submit', async (e) => {
            // Already handled via inline script in create-event.html directly, 
            // but kept here as fallback for standard MPA bindings if needed.
        });
    }
});
