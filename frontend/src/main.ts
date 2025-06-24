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
                    <user-profile></user-profile>
                </div>
            </div>
        `;
        
        // Get a reference to the profile element
        const profileElement = app.querySelector('user-profile') as ProfileComponent;
        
        // Now set the data
        if (profileElement) {
            profileElement.data = userData;
        } else {
            console.error('Profile element not found');
            throw new Error('Failed to initialize profile component');
        }
    } catch (error) {
        console.error('Failed to load profile:', error);
        localStorage.removeItem('token');
        window.location.reload();
    }
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