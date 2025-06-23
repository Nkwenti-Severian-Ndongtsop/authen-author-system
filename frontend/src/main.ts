import './style.scss';
import './components/Profile';

// State management
function showAuthForm() {
    console.log('Showing auth form...');
    const authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    console.log('Auth container:', authContainer);
    console.log('Profile container:', profileContainer);
    authContainer?.classList.add('visible');
    profileContainer?.classList.remove('visible');
    console.log('Auth container visibility:', authContainer?.classList.contains('visible'));
    console.log('Profile container visibility:', profileContainer?.classList.contains('visible'));
}

function showProfile() {
    console.log('Showing profile...');
    const authContainer = document.querySelector('.auth-container') as HTMLElement;
    const profileContainer = document.querySelector('.profile-container') as HTMLElement;
    console.log('Auth container:', authContainer);
    console.log('Profile container:', profileContainer);
    authContainer?.classList.remove('visible');
    profileContainer?.classList.add('visible');
    console.log('Auth container visibility:', authContainer?.classList.contains('visible'));
    console.log('Profile container visibility:', profileContainer?.classList.contains('visible'));
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
                    firstname: formData.get('firstname'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Registration failed');
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
            alert('Registration failed. Please try again.');
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