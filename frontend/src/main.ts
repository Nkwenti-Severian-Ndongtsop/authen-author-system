// Import styles
import './style.scss';

// Initialize app
async function initializeApp() {
    const app = document.getElementById('app');
    if (!app) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginForm(app);
    } else {
        await loadProfile(token);
    }
}

function showLoginForm(app: HTMLElement) {
    app.innerHTML = `
        <div class="card">
            <div class="auth-container">
                <ul class="tab-group">
                    <li class="tab active"><a href="#login">Log In</a></li>
                    <li class="tab"><a href="#signup">Sign Up</a></li>
                </ul>

                <div class="tab-content">
                    <div id="login">
                        <h1>Welcome Back!</h1>
                        <form id="login-form">
                            <div class="field-wrap">
                                <label>Email Address<span class="req">*</span></label>
                                <input type="email" name="email" required autocomplete="off"/>
                            </div>
                            <div class="field-wrap">
                                <label>Password<span class="req">*</span></label>
                                <input type="password" name="password" required autocomplete="off"/>
                            </div>
                            <button type="submit" class="button button-primary button-block">Log In</button>
                        </form>
                    </div>

                    <div id="signup" style="display: none;">
                        <h1>Sign Up</h1>
                        <form id="signup-form">
                            <div class="field-wrap">
                                <label>First Name<span class="req">*</span></label>
                                <input type="text" name="firstname" required autocomplete="off" />
                            </div>
                            <div class="field-wrap">
                                <label>Last Name<span class="req">*</span></label>
                                <input type="text" name="lastname" required autocomplete="off"/>
                            </div>
                            <div class="field-wrap">
                                <label>Email Address<span class="req">*</span></label>
                                <input type="email" name="email" required autocomplete="off"/>
                            </div>
                            <div class="field-wrap">
                                <label>Set A Password<span class="req">*</span></label>
                                <input type="password" name="password" required autocomplete="off"/>
                            </div>
                            <button type="submit" class="button button-primary button-block">Get Started</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    `;

    setupAuthListeners();

    // Initialize form animations
    const inputs = app.querySelectorAll('input');
    inputs.forEach(input => {
        // Check if input has a value
        if (input.value) {
            input.parentElement?.querySelector('label')?.classList.add('active');
        }

        // Add focus event listeners
        input.addEventListener('focus', () => {
            input.parentElement?.querySelector('label')?.classList.add('active');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                input.parentElement?.querySelector('label')?.classList.remove('active');
            }
        });
    });
}

async function loadProfile(token: string) {
    const app = document.getElementById('app');
    if (!app) return;

    try {
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const userData = await response.json();
        
        // Create the profile container structure
        app.innerHTML = `
            <div class="card">
                <div class="profile-container">
                    <div class="profile-picture-container">
                        <img 
                            src="${userData.profile_picture || getDefaultProfilePicture()}" 
                            alt="Profile picture"
                            class="profile-picture"
                            onerror="this.src='${getDefaultProfilePicture()}'"
                        >
                    </div>
                    <div class="username">${userData.firstname} ${userData.lastname}</div>
                    <div class="role">${userData.role}</div>

                    <div class="info-label">Email</div>
                    <div class="info-text">${userData.email}</div>

                    <div class="info-label">Member Since</div>
                    <div class="info-text">${formatDate(userData.created_at)}</div>

                    <div class="activity-card">
                        <h3>Activity Overview</h3>
                        <div class="activity-item"><strong>Last Login:</strong> ${formatDate(userData.last_login)}</div>
                        <div class="activity-item"><strong>Total Logins:</strong> ${userData.login_count || 0}</div>
                    </div>

                    <div class="profile-actions">
                        <button class="btn btn-edit" id="edit-profile">EDIT PROFILE</button>
                        <button class="btn btn-logout" id="logout">LOGOUT</button>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        const editButton = app.querySelector('#edit-profile');
        const logoutButton = app.querySelector('#logout');

        editButton?.addEventListener('click', () => {
            showEditModal(userData);
        });

        logoutButton?.addEventListener('click', () => {
            localStorage.removeItem('token');
            window.location.reload();
        });

        // Show the profile with animation
        setTimeout(() => {
            const profileContainer = app.querySelector('.profile-container');
            if (profileContainer) {
                profileContainer.classList.add('visible');
            }
        }, 100);

    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        window.location.reload();
    }
}

function getDefaultProfilePicture(): string {
    return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
}

function formatDate(dateString?: string): string {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function showEditModal(userData: any) {
    const modalHtml = `
        <div class="modal-overlay">
            <div class="modal">
                <h3>Edit Profile</h3>
                <form id="edit-profile-form" class="edit-profile-form">
                    <div class="form-group">
                        <label for="firstname">First Name</label>
                        <input type="text" id="firstname" name="firstname" value="${userData.firstname || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="lastname">Last Name</label>
                        <input type="text" id="lastname" name="lastname" value="${userData.lastname || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="email">Email</label>
                        <input type="email" id="email" name="email" value="${userData.email || ''}" required>
                    </div>
                    <div class="form-group">
                        <label for="password">New Password (leave blank to keep current)</label>
                        <input type="password" id="password" name="password" minlength="6">
                    </div>
                    <div class="form-group">
                        <label for="profile_picture">Profile Picture</label>
                        <input type="file" id="profile_picture" name="profile_picture" accept="image/*">
                    </div>
                    <div class="button-group">
                        <button type="button" class="button button-secondary" id="cancel-edit">Cancel</button>
                        <button type="submit" class="button button-primary">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    `;

    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHtml;
    document.body.appendChild(modalElement.firstElementChild!);

    // Add event listeners
    const form = document.getElementById('edit-profile-form');
    const cancelButton = document.getElementById('cancel-edit');

    cancelButton?.addEventListener('click', () => {
        const modalOverlay = document.querySelector('.modal-overlay');
        if (modalOverlay) {
            modalOverlay.remove();
        }
    });

    form?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        
        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/profile/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstname: formData.get('firstname'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    password: formData.get('password') || undefined,
                    profile_picture: await handleProfilePicture(formData.get('profile_picture') as File)
                })
            });

            if (!response.ok) {
                throw new Error('Failed to update profile');
            }

            const updatedUserData = await response.json();
            
            // Close modal
            const modalOverlay = document.querySelector('.modal-overlay');
            if (modalOverlay) {
                modalOverlay.remove();
            }

            // Reload profile
            await loadProfile(token);

            // Show success message
            showMessage('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showMessage('Failed to update profile. Please try again.', 'error');
        }
    });
}

async function handleProfilePicture(file: File | null): Promise<string | undefined> {
    if (!file || file.size === 0) return undefined;
    
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function showMessage(message: string, type: 'success' | 'error') {
    // Remove any existing message
    const existingMessage = document.querySelector('.message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Create and append new message
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    document.body.appendChild(messageEl);

    // Remove message after delay
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => messageEl.remove(), 300);
    }, 3000);
}

function setupAuthListeners() {
    // Handle login form submission
    const loginForm = document.getElementById('login-form');
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                }),
            });

            if (!response.ok) {
                throw new Error('Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            await loadProfile(data.token);
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please try again.');
        }
    });

    // Handle signup form submission
    const signupForm = document.getElementById('signup-form');
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target as HTMLFormElement);
        try {
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    firstname: formData.get('firstname'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    password: formData.get('password'),
                }),
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            await loadProfile(data.token);
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        }
    });

    // Handle tab switching
    const tabs = document.querySelectorAll('.tab a');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = (e.target as HTMLAnchorElement).getAttribute('href')?.substring(1);
            if (!targetId) return;

            // Update active tab
            tabs.forEach(t => t.parentElement?.classList.remove('active'));
            (e.target as HTMLElement).parentElement?.classList.add('active');

            // Show/hide forms
            document.getElementById('login')!.style.display = targetId === 'login' ? 'block' : 'none';
            document.getElementById('signup')!.style.display = targetId === 'signup' ? 'block' : 'none';
        });
    });
}

// Initialize particles
function createParticle() {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random initial position
    particle.style.left = `${Math.random() * 100}vw`;
    particle.style.top = `${Math.random() * 100}vh`;
    
    // Random size
    const scale = 0.4 + Math.random() * 1.6;
    particle.style.transform = `scale(${scale})`;
    
    // Random movement
    const moveX = (Math.random() - 0.5) * 200 + 'px';
    const moveY = (Math.random() - 0.5) * 200 + 'px';
    particle.style.setProperty('--move-x', moveX);
    particle.style.setProperty('--move-y', moveY);
    
    // Random opacity
    particle.style.setProperty('--particle-opacity', (0.1 + Math.random() * 0.5).toString());
    
    // Random animation duration
    const duration = 15 + Math.random() * 20;
    particle.style.animation = `float ${duration}s infinite linear`;
    
    return particle;
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeApp();

    // Setup particles
    const particlesContainer = document.querySelector('.particles-container');
    if (particlesContainer) {
        // Create initial particles
        for (let i = 0; i < 50; i++) {
            particlesContainer.appendChild(createParticle());
        }
        
        // Continuously replace particles to maintain smooth animation
        setInterval(() => {
            const oldParticle = particlesContainer.firstChild;
            if (oldParticle) {
                const newParticle = createParticle();
                particlesContainer.replaceChild(newParticle, oldParticle);
            }
        }, 300);
    }
});