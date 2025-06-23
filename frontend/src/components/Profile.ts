import { Configuration, AuthenticationApi } from '../../../ts-client/dist/index.js';

interface UserProfile {
    id: number;
    username: string;
    email: string;
    created_at: string;
}

export class ProfileComponent extends HTMLElement {
    private api: AuthenticationApi;
    private profile: UserProfile | null = null;

    constructor() {
        super();
        const config = new Configuration({
            basePath: 'http://localhost:3000'
        });
        this.api = new AuthenticationApi(config);
        this.attachShadow({ mode: 'open' });
    }

    async connectedCallback() {
        await this.loadProfile();
        this.render();
    }

    private async loadProfile() {
        try {
            // TODO: Implement actual profile endpoint call
            // For now, using mock data
            this.profile = {
                id: 1,
                username: 'Current User',
                email: 'user@example.com',
                created_at: new Date().toISOString()
            };
        } catch (error) {
            console.error('Failed to load profile:', error);
        }
    }

    private render() {
        if (!this.shadowRoot) return;

        const style = document.createElement('style');
        style.textContent = `
            .profile-container {
                max-width: 600px;
                margin: 2rem auto;
                padding: 2rem;
                background: white;
                border-radius: 8px;
                box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }

            .profile-header {
                text-align: center;
                margin-bottom: 2rem;
            }

            .profile-avatar {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                background-color: #e0e0e0;
                margin: 0 auto 1rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 2rem;
                color: #666;
            }

            .profile-info {
                margin-bottom: 1.5rem;
            }

            .info-item {
                margin: 1rem 0;
                padding: 0.5rem;
                border-bottom: 1px solid #eee;
            }

            .info-label {
                font-weight: bold;
                color: #666;
                margin-right: 0.5rem;
            }

            .logout-button {
                display: block;
                width: 100%;
                padding: 0.8rem;
                background-color: #ff4444;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 1rem;
                transition: background-color 0.3s;
            }

            .logout-button:hover {
                background-color: #ff0000;
            }
        `;

        const profileHTML = `
            <div class="profile-container">
                <div class="profile-header">
                    <div class="profile-avatar">
                        ${this.profile?.username.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <h2>${this.profile?.username || 'Loading...'}</h2>
                </div>
                <div class="profile-info">
                    <div class="info-item">
                        <span class="info-label">Email:</span>
                        <span>${this.profile?.email || 'Loading...'}</span>
                    </div>
                    <div class="info-item">
                        <span class="info-label">Member since:</span>
                        <span>${this.profile ? new Date(this.profile.created_at).toLocaleDateString() : 'Loading...'}</span>
                    </div>
                </div>
                <button class="logout-button">Logout</button>
            </div>
        `;

        this.shadowRoot.innerHTML = '';
        this.shadowRoot.appendChild(style);
        const wrapper = document.createElement('div');
        wrapper.innerHTML = profileHTML;
        this.shadowRoot.appendChild(wrapper);

        // Add logout functionality
        const logoutButton = this.shadowRoot.querySelector('.logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/login';
            });
        }
    }
}

customElements.define('profile-component', ProfileComponent); 