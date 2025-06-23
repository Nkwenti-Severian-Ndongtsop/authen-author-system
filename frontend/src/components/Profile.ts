import { User } from '../types';

export class ProfileComponent extends HTMLElement {
    private user: User | null = null;

    constructor() {
        super();
        this.render();
    }

    set data(user: User) {
        this.user = user;
        this.render();
    }

    private render() {
        if (!this.user) return;

        this.innerHTML = `
            <div class="profile-info">
                <h2>Profile</h2>
                <p><strong>Name:</strong> <span id="profile-name">${this.user.firstname} ${this.user.lastname}</span></p>
                <p><strong>Email:</strong> <span id="profile-email">${this.user.email}</span></p>
                <p><strong>Role:</strong> <span id="profile-role">${this.user.role}</span></p>
            </div>
            <button id="logout-button">Logout</button>
        `;
    }
}

customElements.define('user-profile', ProfileComponent); 