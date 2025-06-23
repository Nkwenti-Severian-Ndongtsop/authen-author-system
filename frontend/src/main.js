import { Configuration, AuthenticationApi } from '../../ts-client/index.js';

// Initialize API client
const api = new AuthenticationApi(new Configuration({
    basePath: 'http://localhost:3000'
}));

document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const tabs = document.querySelectorAll('.tab a');
    const forms = document.querySelectorAll('form');
    const labels = document.querySelectorAll('.field-wrap label');
    const inputs = document.querySelectorAll('.field-wrap input');

    // Tab switching
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            e.preventDefault();
            const target = e.target.getAttribute('href');
            
            // Update active tab
            document.querySelector('.tab.active').classList.remove('active');
            e.target.parentNode.classList.add('active');
            
            // Show target content
            document.querySelector('.tab-content > div:not([style*="display: none"])').style.display = 'none';
            document.querySelector(target).style.display = 'block';
        });
    });

    // Label animation
    inputs.forEach(input => {
        const label = input.previousElementSibling;
        
        // Check if input has value on load
        if (input.value) label.classList.add('active', 'highlight');

        // Handle focus events
        input.addEventListener('focus', () => {
            label.classList.add('active', 'highlight');
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                label.classList.remove('active', 'highlight');
            } else {
                label.classList.remove('highlight');
            }
        });
    });

    // Form submission
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(loginForm);
        
        try {
            const response = await api.authLoginPost({
                email: formData.get('email'),
                password: formData.get('password')
            });
            
            console.log('Login successful:', response.data);
            // Store token and redirect
            localStorage.setItem('token', response.data.token);
            // window.location.href = '/dashboard';
            
        } catch (error) {
            console.error('Login failed:', error);
            alert('Login failed. Please check your credentials.');
        }
    });

    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(signupForm);
        
        try {
            const response = await api.authRegisterPost({
                email: formData.get('email'),
                password: formData.get('password'),
                name: `${formData.get('firstName')} ${formData.get('lastName')}`
            });
            
            console.log('Registration successful:', response.data);
            // Automatically switch to login tab
            document.querySelector('.tab a[href="#login"]').click();
            alert('Registration successful! Please log in.');
            
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed. Please try again.');
        }
    });
}); 