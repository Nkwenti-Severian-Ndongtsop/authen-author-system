// Import styles
import './style.scss';
import './components/Profile';

// Backend API URL from .env with fallback
const BACKEND_API = import.meta.env.VITE_BACKEND_API;

// Initialize background elements
function initializeBackground() {
    // Create aurora background
    const auroraBackground = document.createElement('div');
    auroraBackground.className = 'aurora-background';
    auroraBackground.innerHTML = '<div class="aurora-container"></div>';
    document.body.appendChild(auroraBackground);

    // Create particles container
    const particlesContainer = document.createElement('div');
    particlesContainer.className = 'particles-container';
    document.body.appendChild(particlesContainer);

    // Initialize particles
    for (let i = 0; i < 50; i++) {
        createParticle(particlesContainer);
    }

    // Continuously replace particles
    setInterval(() => {
        const oldParticle = particlesContainer.firstChild;
        if (oldParticle) {
            const newParticle = createParticle(particlesContainer);
            particlesContainer.replaceChild(newParticle, oldParticle);
        }
    }, 300);
}

function createParticle(container: HTMLElement): HTMLElement {
    const particle = document.createElement('div');
    particle.className = 'particle';
    
    // Random initial position
    const startX = Math.random() * window.innerWidth;
    const startY = Math.random() * window.innerHeight;
    
    // Random movement
    const moveX = (Math.random() - 0.5) * 200;
    const moveY = (Math.random() - 0.5) * 200;
    
    // Random duration
    const duration = 15 + Math.random() * 20;
    
    // Random opacity
    const opacity = 0.1 + Math.random() * 0.3;
    
    // Set CSS variables
    particle.style.setProperty('--start-x', `${startX}px`);
    particle.style.setProperty('--start-y', `${startY}px`);
    particle.style.setProperty('--end-x', `${moveX}px`);
    particle.style.setProperty('--end-y', `${moveY}px`);
    particle.style.setProperty('--duration', `${duration}s`);
    particle.style.setProperty('--particle-opacity', opacity.toString());
    
    container.appendChild(particle);
    return particle;
}

// State management
function showAuthForm() {
    let authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    
    // Create auth container if it doesn't exist
    if (!authContainer) {
        authContainer = document.createElement('div');
        authContainer.className = 'auth-container';
        document.getElementById('app')?.appendChild(authContainer);
        showLoginForm(authContainer);
    }
    
    if (profileContainer) {
        profileContainer.style.display = 'none';
    }
    authContainer.style.display = 'block';
}

function showProfile() {
    const authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    
    if (authContainer) {
        authContainer.style.display = 'none';
    }
    
    if (profileContainer) {
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

// Add function to get time-based greeting
function getTimeBasedGreeting(): string {
    const hour = new Date().getHours();
    
    if (hour >= 5 && hour < 12) {
        return 'Good morning';
    } else if (hour >= 12 && hour < 17) {
        return 'Good afternoon';
    } else if (hour >= 17 && hour < 22) {
        return 'Good evening';
    } else {
        return 'Good night';
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
        
        // Create profile container and element if they don't exist
        let profileContainer = document.querySelector('.profile-container');
        if (!profileContainer) {
            profileContainer = document.createElement('div');
            profileContainer.className = 'profile-container';
            document.getElementById('app')?.appendChild(profileContainer);
        }

        // Add greeting section
        const greetingSection = document.createElement('div');
        greetingSection.className = 'greeting-section';
        greetingSection.innerHTML = `
            <h1 class="greeting-text">${getTimeBasedGreeting()}, ${profile.firstname}!</h1>
            <p class="greeting-date">${new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            })}</p>
        `;

        // Add or update greeting section
        const existingGreeting = profileContainer.querySelector('.greeting-section');
        if (existingGreeting) {
            profileContainer.replaceChild(greetingSection, existingGreeting);
        } else {
            profileContainer.insertBefore(greetingSection, profileContainer.firstChild);
        }
        
        let profileElement = document.querySelector('user-profile');
        if (!profileElement) {
            profileElement = document.createElement('user-profile');
            profileContainer.appendChild(profileElement);
        }
        
        // Update profile data
        (profileElement as any).data = profile;
        showProfile();
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        showAuthForm();
        showError('Session expired. Please log in again.');
    }
}

// Initialize app
async function initializeApp() {
    // Initialize background first
    initializeBackground();

    const app = document.getElementById('app');
    if (!app) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        showAuthForm();
    } else {
        await loadProfile();
    }
}

function showLoginForm(container: HTMLElement) {
    container.innerHTML = `
        <div class="container">
            <div class="toggle">
                <button id="loginToggle" class="active">Log In</button>
                <button id="signupToggle">Sign Up</button>
            </div>

            <form id="loginForm" class="form active">
                <h2>Welcome Back!</h2>
                <div class="form-group">
                    <input type="email" name="email" placeholder="Email Address" required />
                </div>
                <div class="form-group">
                    <div class="password-field">
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                            <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn">LOG IN</button>
            </form>

            <form id="signupForm" class="form">
                <h2>Create Account</h2>
                <div class="form-group">
                    <input type="text" name="firstname" placeholder="First Name" required />
                </div>
                <div class="form-group">
                    <input type="text" name="lastname" placeholder="Last Name" required />
                </div>
                <div class="form-group">
                    <input type="email" name="email" placeholder="Email Address" required />
                </div>
                <div class="form-group">
                    <div class="password-field">
                        <input type="password" name="password" placeholder="Password" required />
                        <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                            <svg class="eye-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
                                <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                            </svg>
                        </button>
                    </div>
                </div>
                <button type="submit" class="btn">SIGN UP</button>
            </form>
        </div>
    `;

    const loginToggle = container.querySelector('#loginToggle');
    const signupToggle = container.querySelector('#signupToggle');
    const loginForm = container.querySelector('#loginForm') as HTMLFormElement;
    const signupForm = container.querySelector('#signupForm') as HTMLFormElement;
    const loginButton = loginForm?.querySelector('button[type="submit"]') as HTMLButtonElement;
    const signupButton = signupForm?.querySelector('button[type="submit"]') as HTMLButtonElement;

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

    // Add password toggle functionality
    const passwordToggles = container.querySelectorAll('.password-toggle');
    passwordToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            const button = e.currentTarget as HTMLButtonElement;
            const passwordField = button.closest('.password-field');
            const passwordInput = passwordField?.querySelector('input') as HTMLInputElement;
            const eyeIcon = button.querySelector('.eye-icon');

            if (passwordInput.type === 'password') {
                passwordInput.type = 'text';
                eyeIcon?.setAttribute('d', 'M12 6.5c-3.79 0-7.17 2.13-8.82 5.5 1.65 3.37 5.03 5.5 8.82 5.5s7.17-2.13 8.82-5.5C19.17 8.63 15.79 6.5 12 6.5zm0 9c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm0-4c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5 1.5-.67 1.5-1.5-.67-1.5-1.5-1.5z');
            } else {
                passwordInput.type = 'password';
                eyeIcon?.setAttribute('d', 'M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z');
            }
        });
    });

    // Handle login form submission
    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        try {
            // Show loading state
            loginButton.classList.add('loading');
            loginButton.disabled = true;
            loginButton.textContent = 'Logging in...';
            
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
        } finally {
            // Remove loading state
            loginButton.classList.remove('loading');
            loginButton.disabled = false;
            loginButton.textContent = 'LOG IN';
        }
    });

    // Handle signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        try {
            // Show loading state
            signupButton.classList.add('loading');
            signupButton.disabled = true;
            signupButton.textContent = 'Creating Account...';
            
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
            
            // Show success message
            showSuccess('Account created successfully!');
        } catch (error) {
            console.error('Registration failed:', error);
            showError('Registration failed. Please try again.');
        } finally {
            // Remove loading state
            signupButton.classList.remove('loading');
            signupButton.disabled = false;
            signupButton.textContent = 'SIGN UP';
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
    const submitButton = form?.querySelector('button[type="submit"]') as HTMLButtonElement;

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
            // Show loading state
            submitButton.classList.add('loading');
            submitButton.disabled = true;
            
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
        } finally {
            // Remove loading state
            submitButton.classList.remove('loading');
            submitButton.disabled = false;
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    initializeApp();

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
});

// Utility functions for showing messages
function showError(message: string) {
    showMessage(message, 'error');
}

function showSuccess(message: string) {
    showMessage(message, 'success');
}