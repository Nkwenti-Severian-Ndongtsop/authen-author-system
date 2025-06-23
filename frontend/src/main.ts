import { Configuration, AuthenticationApi } from '../../ts-client/dist/index.js';
import './style.scss';
import './components/Profile';

// Initialize API client
const api = new AuthenticationApi(new Configuration({
    basePath: 'http://localhost:8080',
    headers: {
        'Content-Type': 'application/json'
    }
}));

// Add profile route handling
const routes = {
    '/': () => {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.href = '/login';
            return;
        }
        const app = document.querySelector<HTMLDivElement>('#app');
        if (app) {
            app.innerHTML = '<profile-component></profile-component>';
        }
    },
    '/login': () => {
        const token = localStorage.getItem('token');
        if (token) {
            window.location.href = '/';
            return;
        }
    }
};

// Handle routing
function handleRoute() {
    const path = window.location.pathname;
    const route = routes[path];
    if (route) {
        route();
    }
}

document.addEventListener('DOMContentLoaded', function() {
    handleRoute();

    // Input event handling
    const formInputs = document.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>('.form input, .form textarea');
    
    formInputs.forEach(input => {
        ['keyup', 'blur', 'focus'].forEach(eventType => {
            input.addEventListener(eventType, (e) => {
                const label = input.previousElementSibling as HTMLLabelElement;
                
                if (e.type === 'keyup') {
                    if (input.value === '') {
                        label.classList.remove('active', 'highlight');
                    } else {
                        label.classList.add('active', 'highlight');
                    }
                } 
                else if (e.type === 'blur') {
                    if (input.value === '') {
                        label.classList.remove('active', 'highlight');
                    } else {
                        label.classList.remove('highlight');
                    }
                } 
                else if (e.type === 'focus') {
                    if (input.value === '') {
                        label.classList.remove('highlight');
                    } else if (input.value !== '') {
                        label.classList.add('highlight');
                    }
                }
            });
        });
    });

    // Tab switching with fade effect
    const tabs = document.querySelectorAll<HTMLElement>('.tab a');
    
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Update active state
            const parentTab = (e.target as HTMLElement).parentElement;
            if (!parentTab) return;
            
            // Remove active class from all siblings
            const siblings = Array.from(parentTab.parentElement?.children || []);
            siblings.forEach(sibling => sibling.classList.remove('active'));
            
            // Add active class to clicked tab
            parentTab.classList.add('active');
            
            // Get target content
            const target = (e.target as HTMLElement).getAttribute('href');
            if (!target) return;
            
            // Hide all other content
            const allContent = document.querySelectorAll('.tab-content > div');
            allContent.forEach(content => {
                if (content.id !== target.substring(1)) {
                    content.style.display = 'none';
                }
            });
            
            // Show target content
            const targetContent = document.querySelector(target);
            if (targetContent) {
                targetContent.style.display = 'block';
            }
        });
    });

    // Form submission
    const loginForm = document.getElementById('login-form') as HTMLFormElement;
    const signupForm = document.getElementById('signup-form') as HTMLFormElement;

    loginForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        try {
            const response = await fetch('http://localhost:8080/auth/login', {
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
                throw new Error('Login failed');
            }

            const data = await response.json();
            if (data.token) {
                localStorage.setItem('token', data.token);
                window.location.href = '/';
            } else {
                throw new Error('No token received');
            }
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials.');
        }
    });

    signupForm?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        try {
            const response = await fetch('http://localhost:8080/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: formData.get('email'),
                    password: formData.get('password'),
                    firstname: formData.get('firstname'),
                    lastname: formData.get('lastname')
                })
            });

            if (!response.ok) {
                throw new Error('Registration failed');
            }

            console.log('Registration successful');
            const loginTab = document.querySelector('.tab a[href="#login"]');
            if (loginTab instanceof HTMLElement) loginTab.click();
            alert('Registration successful! Please log in.');
            
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        }
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