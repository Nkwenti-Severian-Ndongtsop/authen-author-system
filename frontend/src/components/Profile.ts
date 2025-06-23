import { User } from '../../ts-client/api';

export class ProfileComponent extends HTMLElement {
    private profile: User | null = null;

    constructor() {
        super();
        this.loadProfile();
    }

    connectedCallback() {
        this.render();
    }

    private async loadProfile() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                window.location.href = '/login';
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

            this.profile = await response.json();
            this.render();
        } catch (error) {
            console.error('Failed to load profile:', error);
            localStorage.removeItem('token');
            window.location.href = '/login';
        }
    }

    private render() {
        if (!this.profile) {
            this.innerHTML = '<div>Loading...</div>';
            return;
        }

        this.innerHTML = `
            <div class="profile">
                <h2>Profile</h2>
                <div class="profile-info">
                    <p><strong>Name:</strong> ${this.profile.firstname} ${this.profile.lastname}</p>
                    <p><strong>Email:</strong> ${this.profile.email}</p>
                    <p><strong>Role:</strong> ${this.profile.role}</p>
                </div>
                <button onclick="localStorage.removeItem('token'); window.location.href='/login'">
                    Logout
                </button>
            </div>
        `;
    }
}

customElements.define('profile-component', ProfileComponent); 