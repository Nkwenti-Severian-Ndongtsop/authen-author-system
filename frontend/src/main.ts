import { Configuration, AuthenticationApi } from '../../ts-client/dist/index.js';
import './style.scss';
import './components/Profile';

// Initialize API client
const api = new AuthenticationApi(new Configuration({
    basePath: 'http://localhost:8000',
    headers: {
        'Content-Type': 'application/json'
    }
}));

// State management
function showAuthForm() {
    document.querySelector('.auth-container')?.classList.add('visible');
    document.querySelector('.profile-container')?.classList.remove('visible');
}

function showProfile() {
    document.querySelector('.auth-container')?.classList.remove('visible');
    document.querySelector('.profile-container')?.classList.add('visible');
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

        const response = await fetch('http://localhost:8000/api/profile', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            throw new Error('Failed to fetch profile');
        }

        const profile = await response.json();
        
        // Update profile view
        document.getElementById('profile-name')!.textContent = `${profile.firstname} ${profile.lastname}`;
        document.getElementById('profile-email')!.textContent = profile.email;
        document.getElementById('profile-role')!.textContent = profile.role;
        
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
            document.querySelector('.tab.active')?.classList.remove('active');
            (e.target as HTMLElement).parentNode?.classList.add('active');
            
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
        
        try {
            const response = await fetch('http://localhost:8000/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password')
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Login failed');
            }

            const data = await response.json();
            localStorage.setItem('token', data.token);
            loadProfile();
            
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials.');
        }
    });

    // Signup form submission
    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        try {
            const response = await fetch('http://localhost:8000/auth/register', {
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

// Utility functions for fade effects
function fadeOut(element: HTMLElement, duration: number = 400): void {
    element.style.opacity = '1';
    element.style.display = 'block';
    
    let start: number | null = null;
    
    function animate(currentTime: number) {
        if (!start) start = currentTime;
        const progress = currentTime - start;
        const opacity = 1 - Math.min(progress / duration, 1);
        
        element.style.opacity = opacity.toString();
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        } else {
            element.style.display = 'none';
        }
    }
    
    requestAnimationFrame(animate);
}

function fadeIn(element: HTMLElement, duration: number = 600): void {
    element.style.opacity = '0';
    element.style.display = 'block';
    
    let start: number | null = null;
    
    function animate(currentTime: number) {
        if (!start) start = currentTime;
        const progress = currentTime - start;
        const opacity = Math.min(progress / duration, 1);
        
        element.style.opacity = opacity.toString();
        
        if (progress < duration) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
} 