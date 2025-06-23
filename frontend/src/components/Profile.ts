import { User } from '../types';

export class ProfileComponent extends HTMLElement {
    private user: User | null = null;

    constructor() {
        super();
        this.render();
    }

    set data(user: User) {
        console.log('Profile component received data:', user);
        this.user = user;
        this.render();
    }

    private render() {
        if (!this.user) {
            this.innerHTML = `
                <div class="profile-info">
                    <h2>Loading profile...</h2>
                </div>
            `;
            return;
        }

        this.innerHTML = `
            <div class="profile-info">
                <h2>Profile</h2>
                <p><strong>Name:</strong> <span id="profile-name">${this.user.firstname} ${this.user.lastname}</span></p>
                <p><strong>Email:</strong> <span id="profile-email">${this.user.email}</span></p>
                <p><strong>Role:</strong> <span id="profile-role">${this.user.role}</span></p>
            </div>
            <button id="logout-button" class="button button-block">Logout</button>
        `;

        // Add event listener for logout button
        const logoutButton = this.querySelector('#logout-button') as HTMLButtonElement;
        if (logoutButton) {
            logoutButton.addEventListener('click', async () => {
                try {
                    // Show loading state
                    logoutButton.disabled = true;
                    logoutButton.innerHTML = '<span class="loading-spinner"></span> Logging out...';
                    
                    // Small delay to show the loading state (simulating cleanup)
                    await new Promise(resolve => setTimeout(resolve, 500));
                    
                    localStorage.removeItem('token');
                    window.location.reload();
                } catch (error) {
                    console.error('Logout failed:', error);
                    // Reset button state
                    logoutButton.disabled = false;
                    logoutButton.textContent = 'Logout';
                }
            });
        }
    }
}

customElements.define('user-profile', ProfileComponent); 