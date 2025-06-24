// Import styles
import './style.scss';
import './components/Profile';

// Get the backend API URL from environment variables
const BACKEND_API = process.env.VITE_BACKEND_API || 'http://localhost:8000';

// State management
function showAuthForm() {
    const authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    
    if (authContainer && profileContainer) {
        authContainer.style.display = 'block';
        profileContainer.style.display = 'none';
    }
}

function showProfile() {
    const authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    
    if (authContainer && profileContainer) {
        authContainer.style.display = 'none';
        profileContainer.style.display = 'block';
    }
}

// Check authentication state
function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        loadProfile();
    } else {
        showAuthForm();
    }
}

// Load profile data
async function loadProfile() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            showAuthForm();
            return;
        }

        const response = await fetch(`${BACKEND_API}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        
        // Update profile component
        const profileElement = document.querySelector('user-profile');
        if (profileElement) {
            (profileElement as any).data = profile;
            showProfile();
        } else {
            throw new Error('Profile element not found');
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        showAuthForm();
        showError('Session expired. Please log in again.');
    }
}

// Initialize app
async function initializeApp() {
    const app = document.getElementById('app');
    if (!app) return;

    // Add theme toggle
    const themeToggle = document.createElement('button');
    themeToggle.className = 'theme-toggle';
    themeToggle.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>`;
    document.body.appendChild(themeToggle);

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        showLoginForm(app);
    } else {
        await loadProfile();
    }

    // Setup theme toggle listener
    themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isDark = !document.body.classList.contains('light-theme');
        themeToggle.innerHTML = isDark 
            ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12 2.25a.75.75 0 01.75.75v2.25a.75.75 0 01-1.5 0V3a.75.75 0 01.75-.75zM7.5 12a4.5 4.5 0 119 0 4.5 4.5 0 01-9 0zM18.894 6.166a.75.75 0 00-1.06-1.06l-1.591 1.59a.75.75 0 101.06 1.061l1.591-1.59zM21.75 12a.75.75 0 01-.75.75h-2.25a.75.75 0 010-1.5H21a.75.75 0 01.75.75zM17.834 18.894a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 10-1.061 1.06l1.59 1.591zM12 18a.75.75 0 01.75.75V21a.75.75 0 01-1.5 0v-2.25A.75.75 0 0112 18zM7.758 17.303a.75.75 0 00-1.061-1.06l-1.591 1.59a.75.75 0 001.06 1.061l1.591-1.59zM6 12a.75.75 0 01-.75.75H3a.75.75 0 010-1.5h2.25A.75.75 0 016 12zM6.697 7.757a.75.75 0 001.06-1.06l-1.59-1.591a.75.75 0 00-1.061 1.06l1.59 1.591z"/></svg>`
            : `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z"/></svg>`;
    });
}

function showLoginForm(app: HTMLElement) {
    app.innerHTML = `
        <div class="container">
            <div class="toggle">
                <button id="loginToggle" class="active">Log In</button>
                <button id="signupToggle">Sign Up</button>
            </div>

            <form id="loginForm" class="form active">
                <h2>Welcome Back!</h2>
                <input type="email" name="email" placeholder="Email Address" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit" class="btn">LOG IN</button>
            </form>

            <form id="signupForm" class="form">
                <h2>Create Account</h2>
                <input type="text" name="firstname" placeholder="First Name" required />
                <input type="text" name="lastname" placeholder="Last Name" required />
                <input type="email" name="email" placeholder="Email Address" required />
                <input type="password" name="password" placeholder="Password" required />
                <button type="submit" class="btn">SIGN UP</button>
            </form>
        </div>
    `;

    const loginToggle = app.querySelector('#loginToggle');
    const signupToggle = app.querySelector('#signupToggle');
    const loginForm = app.querySelector('#loginForm') as HTMLFormElement;
    const signupForm = app.querySelector('#signupForm') as HTMLFormElement;

    loginToggle?.addEventListener('click', () => {
        loginToggle.classList.add('active');
        signupToggle?.classList.remove('active');
        loginForm?.classList.add('active');
        signupForm?.classList.remove('active');
    });

    signupToggle?.addEventListener('click', () => {
        signupToggle.classList.add('active');
        loginToggle?.classList.remove('active');
        signupForm?.classList.add('active');
        loginForm?.classList.remove('active');
    });

    // Handle login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        try {
            const response = await fetch(`${BACKEND_API}/auth/login`, {
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
            await loadProfile();
        } catch (error) {
            console.error('Login failed:', error);
            showError('Login failed. Please check your credentials and try again.');
        }
    });

    // Handle signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        try {
            const response = await fetch(`${BACKEND_API}/auth/register`, {
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
            await loadProfile();
        } catch (error) {
            console.error('Registration failed:', error);
            showError('Registration failed. Please try again.');
        }
    });
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

            const response = await fetch(`${BACKEND_API}/api/profile/update`, {
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
            await loadProfile();

            // Show success message
            showSuccess('Profile updated successfully!');
        } catch (error) {
            console.error('Failed to update profile:', error);
            showError('Failed to update profile. Please try again.');
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

function showMessage(message: string, type: 'error' | 'success') {
    const messageClass = type === 'error' ? 'error-message' : 'success-message';
    
    // Create message element if it doesn't exist
    let messageElement = document.querySelector(`.${messageClass}`);
    if (!messageElement) {
        messageElement = document.createElement('div');
        messageElement.className = messageClass;
        document.body.appendChild(messageElement);
    }
    
    // Show message
    messageElement.textContent = message;
    messageElement.classList.add('show');
    
    // Hide after 3 seconds
    setTimeout(() => {
        messageElement.classList.remove('show');
    }, 3000);
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
    // Check authentication state on load
    checkAuth();

    // DOM elements
    const tabs = document.querySelectorAll('.tab a');
    const loginForm = document.querySelector<HTMLFormElement>('#login-form');
    const signupForm = document.querySelector<HTMLFormElement>('#signup-form');
    const logoutButton = document.querySelector<HTMLButtonElement>('#logout-button');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = (e.target as HTMLAnchorElement).getAttribute('href');
            
            // Update active tab
            tabs.forEach(t => t.parentElement?.classList.remove('active'));
            (e.target as HTMLElement).parentElement?.classList.add('active');
            
            // Show target content
            document.querySelectorAll('.tab-content > div').forEach(div => {
                (div as HTMLElement).style.display = 'none';
            });
            if (target) {
                const targetElement = document.querySelector(target);
                if (targetElement instanceof HTMLElement) {
                    targetElement.style.display = 'block';
                }
            }
        });
    });

    // Login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        // Get the submit button and disable it
        const submitButton = loginForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalButtonText = submitButton.textContent || 'Log In';
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span> Logging in...';
            
            const response = await fetch(`${BACKEND_API}/auth/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Login failed');
            }

            localStorage.setItem('token', data.token);
            await loadProfile();
            
        } catch (error) {
            console.error('Login failed:', error);
            showError(error instanceof Error ? error.message : 'Login failed. Please try again.');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        // Get form values
        const firstname = formData.get('firstname') as string;
        const lastname = formData.get('lastname') as string;
        const email = formData.get('email') as string;
        const password = formData.get('password') as string;

        // Frontend validation
        if (firstname.length < 2 || firstname.length > 50) {
            showError('First name must be between 2 and 50 characters');
            return;
        }
        if (lastname.length < 2 || lastname.length > 50) {
            showError('Last name must be between 2 and 50 characters');
            return;
        }
        if (password.length < 6) {
            showError('Password must be at least 6 characters');
            return;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            showError('Please enter a valid email address');
            return;
        }
        
        // Get the submit button and disable it
        const submitButton = signupForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalButtonText = submitButton.textContent || 'Get Started';
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span> Creating Account...';
            
            const response = await fetch(`${BACKEND_API}/auth/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstname,
                    lastname,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }

            // Registration successful
            showSuccess('Registration successful! Please log in.');
            
            // Switch to login tab
            const loginTab = document.querySelector('.tab a[href="#login"]');
            if (loginTab instanceof HTMLElement) {
                loginTab.click();
            }
            
            // Clear signup form
            signupForm.reset();
            
        } catch (error) {
            console.error('Registration failed:', error);
            showError(error instanceof Error ? error.message : 'Registration failed. Please try again.');
        } finally {
            // Reset button state
            submitButton.disabled = false;
            submitButton.textContent = originalButtonText;
        }
    });

    // Logout button
    logoutButton?.addEventListener('click', () => {
        localStorage.removeItem('token');
        showAuthForm();
    });

    // Handle input animations
    const formInputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.field-wrap input, .field-wrap textarea');
    formInputs.forEach(input => {
        const label = input.nextElementSibling as HTMLLabelElement;
        
        // Set initial state
        if (input.value) {
            label.classList.add('active');
        }
        
        input.addEventListener('focus', () => {
                        label.classList.add('active', 'highlight');
        });
        
        input.addEventListener('blur', () => {
            if (!input.value) {
                label.classList.remove('active');
                    }
                        label.classList.remove('highlight');
        });
        
        input.addEventListener('input', () => {
            if (input.value) {
                label.classList.add('active');
                    } else {
                label.classList.remove('active');
                }
        });
    });

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

// Utility functions for showing messages
function showError(message: string) {
    showMessage(message, 'error');
}

function showSuccess(message: string) {
    showMessage(message, 'success');
}