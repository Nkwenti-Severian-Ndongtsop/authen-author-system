import './style.scss';
import { ProfileComponent } from './components/Profile';

// Register custom elements
customElements.define('user-profile', ProfileComponent);

// Initialize app
async function initializeApp() {
    const app = document.getElementById('app');
    if (!app) return;

    // Check if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
        // Show login form
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
                                <button type="submit" class="button button-block">Log In</button>
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
                                <button type="submit" class="button button-block">Get Started</button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        `;
    } else {
        // Show profile
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
            
            // Create and render profile component
            app.innerHTML = `
                <div class="card">
                    <user-profile></user-profile>
                </div>
            `;

            // Initialize profile component with user data
            const profileComponent = document.querySelector('user-profile') as ProfileComponent;
            if (profileComponent) {
                profileComponent.data = userData;
            }
        } catch (error) {
            console.error('Failed to load profile:', error);
            localStorage.removeItem('token');
            window.location.reload();
        }
    }
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

// State management
function showAuthForm() {
    console.log('Showing auth form...');
    const authContainer = document.querySelector('.auth-container');
    const profileContainer = document.querySelector('.profile-container');
    
    console.log('Auth container:', authContainer);
    console.log('Profile container:', profileContainer);
    
    if (authContainer) {
        authContainer.classList.add('visible');
        console.log('Added visible class to auth container');
    }
    if (profileContainer) {
        profileContainer.classList.remove('visible');
        console.log('Removed visible class from profile container');
    }
    
    // Log final state
    console.log('Auth container classes:', authContainer?.classList.toString());
    console.log('Profile container classes:', profileContainer?.classList.toString());
}

function showProfile() {
    console.log('Showing profile...');
    const authContainer = document.querySelector('.auth-container');
    const profileContainer = document.querySelector('.profile-container');
    
    console.log('Auth container:', authContainer);
    console.log('Profile container:', profileContainer);
    
    if (authContainer) {
        authContainer.classList.remove('visible');
        console.log('Removed visible class from auth container');
    }
    if (profileContainer) {
        profileContainer.classList.add('visible');
        console.log('Added visible class to profile container');
    }
    
    // Log final state
    console.log('Auth container classes:', authContainer?.classList.toString());
    console.log('Profile container classes:', profileContainer?.classList.toString());
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
        console.log('Loading profile data...');
        const token = localStorage.getItem('token');
        if (!token) {
            console.log('No token found, showing auth form');
            showAuthForm();
            return;
        }

        console.log('Fetching profile data...');
        const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/profile`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        console.log('Profile data received:', profile);
        
        // Update profile component
        const profileElement = document.querySelector('user-profile');
        if (profileElement) {
            console.log('Setting profile data to component');
            (profileElement as any).data = profile;
        } else {
            console.error('Profile element not found');
        }
        
        console.log('Profile data updated, showing profile view');
        showProfile();
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        showAuthForm();
    }
}

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
            const activeTab = document.querySelector('.tab.active');
            if (activeTab) {
                activeTab.classList.remove('active');
            }
            const parentNode = (e.target as HTMLElement).parentNode as HTMLElement;
            if (parentNode) {
                parentNode.classList.add('active');
            }
            
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
            
            console.log('Attempting login...');
            const loginUrl = `${import.meta.env.VITE_BACKEND_API}/auth/login`;
            console.log('Login URL:', loginUrl);
            
            const loginData = {
                email: formData.get('email'),
                password: formData.get('password')
            };
            console.log('Login data:', { email: loginData.email, password: '***' });
            
            const response = await fetch(loginUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(loginData)
            });

            console.log('Response status:', response.status);
            const responseData = await response.json();
            console.log('Response data:', responseData);

            if (!response.ok) {
                throw new Error(responseData.message || 'Login failed');
            }

            console.log('Login successful, storing token...');
            localStorage.setItem('token', responseData.token);
            console.log('Loading profile...');
            loadProfile();
            
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials and try again.');
            
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
            alert('First name must be between 2 and 50 characters');
            return;
        }
        if (lastname.length < 2 || lastname.length > 50) {
            alert('Last name must be between 2 and 50 characters');
            return;
        }
        if (password.length < 6) {
            alert('Password must be at least 6 characters');
            return;
        }
        if (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
            alert('Please enter a valid email address');
            return;
        }
        
        // Get the submit button and disable it
        const submitButton = signupForm.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalButtonText = submitButton.textContent || 'Get Started';
        
        try {
            // Show loading state
            submitButton.disabled = true;
            submitButton.innerHTML = '<span class="loading-spinner"></span> Creating Account...';
            
            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/auth/register`, {
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
            alert('Registration successful! Please log in.');
            
            // Switch to login tab
            const loginTab = document.querySelector('.tab a[href="#login"]');
            if (loginTab instanceof HTMLElement) {
                loginTab.click();
            }
            
            // Clear signup form
            signupForm.reset();
            
        } catch (error) {
            console.error('Registration failed:', error);
            if (error instanceof Error) {
                alert(error.message);
            } else {
                alert('Registration failed. Please try again.');
            }
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
        const label = input.previousElementSibling as HTMLLabelElement;
        
        ['keyup', 'blur', 'focus'].forEach(eventType => {
            input.addEventListener(eventType, (e) => {
                if (e.type === 'keyup') {
                    if (input.value === '') {
                        label.classList.remove('active', 'highlight');
                    } else {
                        label.classList.add('active', 'highlight');
                    }
                } else if (e.type === 'blur') {
                    if (input.value === '') {
                        label.classList.remove('active', 'highlight');
                    } else {
                        label.classList.remove('highlight');
                    }
                } else if (e.type === 'focus') {
                    if (input.value === '') {
                        label.classList.remove('highlight');
                    } else {
                        label.classList.add('highlight');
                    }
                }
            });
        });
    });
});