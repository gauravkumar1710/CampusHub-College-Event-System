document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const submitBtn = loginForm.querySelector('button[type="submit"]');
            
            submitBtn.disabled = true;
            submitBtn.textContent = 'Signing In...';

            try {
                const res = await fetch(`${API_BASE_URL}/auth/login.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });
                const data = await res.json();
                
                if (data.status === 'success') {
                    localStorage.setItem('campushub_user', JSON.stringify(data.user));
                    window.location.href = 'dashboard.html';
                } else {
                    showAlert('alertBox', 'danger', data.message || data.error || 'Login failed.');
                }
            } catch (err) {
                showAlert('alertBox', 'danger', 'An error occurred during login. Check console.');
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Sign In';
            }
        });
    }

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('name').value;
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;
            const role = document.getElementById('role').value;
            const submitBtn = registerForm.querySelector('button[type="submit"]');

            submitBtn.disabled = true;
            submitBtn.textContent = 'Registering...';

            try {
                const res = await fetch(`${API_BASE_URL}/auth/register.php`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ name, email, password, role })
                });
                const data = await res.json();
                
                if (data.status === 'success') {
                    showAlert('alertBox', 'success', 'Registration successful! You can now sign in.');
                    registerForm.reset();
                } else {
                    showAlert('alertBox', 'danger', data.message || data.error || 'Registration failed.');
                }
            } catch (err) {
                showAlert('alertBox', 'danger', 'An error occurred during registration.');
                console.error(err);
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register';
            }
        });
    }
});
