// Get the backend API URL from environment variables
const BACKEND_API: string = `${import.meta.env.VITE_BACKEND_API || 'http://localhost:8000'}`;

interface ProfileData {
    firstname: string;
    lastname: string;
    email: string;
    role?: string;
    created_at: string;
    last_login?: string;
    login_count?: number;
    profile_picture?: string;
}

class UserProfile extends HTMLElement {
    private _data: ProfileData | null = null;

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
    }

    static get observedAttributes() {
        return ['data'];
    }

    set data(value: ProfileData) {
        this._data = value;
        this.render();
        this.attachEventListeners();
    }

    get data(): ProfileData {
        return this._data as ProfileData;
    }

    private getDefaultProfilePicture(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23ffffff'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
    }

    private getProfilePictureUrl(url?: string): string {
        if (!url) return this.getDefaultProfilePicture();
        return url.startsWith('data:') ? url : `${BACKEND_API}${url}`;
    }

    private formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private handleLogout = (e: Event) => {
        e.preventDefault();
        localStorage.removeItem('token');
        window.location.reload();
    };

    private handleEditProfile = (e: Event) => {
        e.preventDefault();
        const modal = this.shadowRoot?.querySelector('.modal') as HTMLDivElement;
        if (modal) {
            modal.style.display = 'flex';
            requestAnimationFrame(() => modal.classList.add('show'));
        }
    };

    private handleModalClose = (e: Event) => {
        e.preventDefault();
        const modal = this.shadowRoot?.querySelector('.modal') as HTMLDivElement;
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
        }
    };

    private handleModalClick = (e: Event) => {
        const modal = e.target as HTMLElement;
        if (modal.classList.contains('modal')) {
            this.handleModalClose(e);
        }
    };

    private handlePhotoUpload = async (e: Event) => {
        const input = e.target as HTMLInputElement;
        const file = input.files?.[0];
        
        if (!file) return;
        
        // Update preview
        const preview = this.shadowRoot?.querySelector('.photo-preview') as HTMLImageElement;
        if (preview) {
            preview.src = URL.createObjectURL(file);
        }
    };

    private async handleProfileUpdate(e: Event) {
        e.preventDefault();
        const form = e.target as HTMLFormElement;
        const formData = new FormData(form);

        const submitButton = form.querySelector('button[type="submit"]') as HTMLButtonElement;
        const originalText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Saving...';

        try {
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No authentication token found');

            // Handle photo upload first if there's a new photo
            const photoFile = (form.querySelector('#photo-upload') as HTMLInputElement).files?.[0];
            let profilePictureUrl = this._data?.profile_picture;

            if (photoFile) {
                const photoFormData = new FormData();
                photoFormData.append('photo', photoFile);

                const photoResponse = await fetch(`${BACKEND_API}/api/profile/photo`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    },
                    body: photoFormData
                });

                if (!photoResponse.ok) {
                    throw new Error('Failed to upload photo');
                }

                const photoResult = await photoResponse.json();
                profilePictureUrl = photoResult.url;
            }

            // Update profile data
            const response = await fetch(`${BACKEND_API}/api/profile/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    firstname: formData.get('firstname'),
                    lastname: formData.get('lastname'),
                    email: formData.get('email'),
                    password: formData.get('password') || undefined,
                    profile_picture: profilePictureUrl
                })
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.message || 'Failed to update profile');
            }

            const updatedProfile = await response.json();
            this.data = updatedProfile;
            this.handleModalClose(e);
            this.showMessage('Profile updated successfully!', 'success');
        } catch (error) {
            this.showMessage(error instanceof Error ? error.message : 'Failed to update profile', 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = originalText;
        }
    }

    private showMessage(message: string, type: 'success' | 'error') {
        const event = new CustomEvent('show-message', {
            detail: { message, type },
            bubbles: true,
            composed: true
        });
        this.dispatchEvent(event);
    }

    private attachEventListeners() {
        if (!this.shadowRoot) return;

        const logoutButton = this.shadowRoot.querySelector('#logout-button');
        const editButton = this.shadowRoot.querySelector('#edit-button');
        const closeButtons = this.shadowRoot.querySelectorAll('.modal-close');
        const editForm = this.shadowRoot.querySelector('#edit-form');
        const modal = this.shadowRoot.querySelector('.modal');
        const photoInput = this.shadowRoot.querySelector('#photo-upload');

        logoutButton?.addEventListener('click', this.handleLogout);
        editButton?.addEventListener('click', this.handleEditProfile);
        closeButtons?.forEach(button => button.addEventListener('click', this.handleModalClose));
        editForm?.addEventListener('submit', (e) => this.handleProfileUpdate(e));
        modal?.addEventListener('click', this.handleModalClick);
        photoInput?.addEventListener('change', this.handlePhotoUpload);
    }

    connectedCallback() {
        this.render();
        this.attachEventListeners();
    }

    private render() {
        if (!this.shadowRoot) return;

        const styles = `
            :host {
                display: block;
                color: white;
                font-family: 'Inter', sans-serif;
                animation: fadeIn 0.5s ease;
            }

            @keyframes fadeIn {
                from {
                    opacity: 0;
                    transform: translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            .profile-container {
                max-width: 600px;
                margin: 0 auto;
                padding: 2rem;
                text-align: center;
            }

            .profile-picture {
                width: 120px;
                height: 120px;
                border-radius: 50%;
                margin: 0 auto 1.5rem;
                border: 3px solid #00d6b2;
                box-shadow: 0 0 20px rgba(0, 214, 178, 0.3);
                object-fit: cover;
                background-color: #132a36;
                transition: transform 0.3s ease;
                cursor: pointer;
            }

            .profile-picture:hover {
                transform: scale(1.05);
            }

            .photo-upload-container {
                position: relative;
                width: 120px;
                height: 120px;
                margin: 0 auto 1.5rem;
            }

            .photo-preview {
                width: 100%;
                height: 100%;
                border-radius: 50%;
                object-fit: cover;
                border: 3px solid #00d6b2;
                background-color: #132a36;
            }

            .photo-upload-label {
                position: absolute;
                bottom: -10px;
                right: -10px;
                background: #00d6b2;
                border-radius: 50%;
                width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: transform 0.3s ease;
            }

            .photo-upload-label:hover {
                transform: scale(1.1);
            }

            .photo-upload-label svg {
                width: 18px;
                height: 18px;
                fill: white;
            }

            #photo-upload {
                display: none;
            }

            .username {
                font-size: 1.8rem;
                font-weight: bold;
                margin-bottom: 0.5rem;
                color: white;
            }

            .role {
                color: #00d6b2;
                font-size: 1.1rem;
                margin-bottom: 2rem;
            }

            .info-section {
                text-align: left;
                margin-bottom: 2rem;
                background: rgba(19, 42, 54, 0.5);
                padding: 1.5rem;
                border-radius: 8px;
                transition: transform 0.3s ease;
            }

            .info-section:hover {
                transform: translateY(-2px);
            }

            .info-label {
                color: #8a9aa4;
                font-size: 0.9rem;
                margin-bottom: 0.3rem;
            }

            .info-text {
                font-size: 1.1rem;
                margin-bottom: 1rem;
                color: white;
            }

            .activity-card {
                background: rgba(19, 42, 54, 0.5);
                padding: 1.5rem;
                border-radius: 8px;
                margin-bottom: 2rem;
                text-align: left;
                transition: transform 0.3s ease;
            }

            .activity-card:hover {
                transform: translateY(-2px);
            }

            .activity-card h3 {
                color: #00d6b2;
                margin-bottom: 1rem;
                font-size: 1.2rem;
            }

            .activity-item {
                margin: 0.8rem 0;
                color: white;
            }

            .activity-item strong {
                color: #8a9aa4;
                margin-right: 0.5rem;
            }

            .profile-actions {
                display: flex;
                gap: 1rem;
                justify-content: center;
            }

            button {
                background: #00d6b2;
                color: white;
                border: none;
                padding: 12px 24px;
                border-radius: 4px;
                font-size: 1rem;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            button:hover {
                background: #00bfa5;
                transform: translateY(-2px);
            }

            button#logout-button {
                background: #1a2b38;
            }

            button#logout-button:hover {
                background: #243442;
            }

            .modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.8);
                justify-content: center;
                align-items: center;
                opacity: 0;
                transition: opacity 0.3s ease;
                backdrop-filter: blur(5px);
            }

            .modal.show {
                opacity: 1;
            }

            .modal-content {
                background: #1B2735;
                padding: 2rem;
                border-radius: 8px;
                width: 90%;
                max-width: 500px;
                position: relative;
                transform: translateY(20px);
                transition: transform 0.3s ease;
            }

            .modal.show .modal-content {
                transform: translateY(0);
            }

            .modal-close {
                position: absolute;
                top: 1rem;
                right: 1rem;
                background: none;
                border: none;
                color: #8a9aa4;
                cursor: pointer;
                font-size: 1.5rem;
                padding: 0;
            }

            .modal-close:hover {
                color: white;
                transform: scale(1.1);
            }

            .field-wrap {
                position: relative;
                margin-bottom: 1.5rem;
            }

            .field-wrap input {
                width: 100%;
                padding: 12px;
                background: rgba(255, 255, 255, 0.1);
                border: none;
                border-radius: 4px;
                color: white;
                font-size: 1rem;
                transition: all 0.3s ease;
            }

            .field-wrap input:focus {
                outline: none;
                background: rgba(255, 255, 255, 0.15);
                box-shadow: 0 0 0 2px rgba(0, 214, 178, 0.3);
            }

            .field-wrap label {
                color: #8a9aa4;
                font-size: 0.9rem;
                margin-bottom: 0.5rem;
                display: block;
            }

            @media (max-width: 768px) {
                .profile-container {
                    padding: 1rem;
                }

                .username {
                    font-size: 1.5rem;
                }

                .profile-picture {
                    width: 100px;
                    height: 100px;
                }

                .modal-content {
                    padding: 1.5rem;
                }
            }

            .modal h2 {
                color: white;
                margin-bottom: 1.5rem;
                font-size: 1.5rem;
            }

            button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none !important;
            }

            .loading-spinner {
                display: inline-block;
                width: 16px;
                height: 16px;
                margin-right: 8px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-radius: 50%;
                border-top-color: white;
                animation: spin 0.8s linear infinite;
                vertical-align: middle;
            }

            @keyframes spin {
                to {
                    transform: rotate(360deg);
                }
            }

            .modal-actions {
                display: flex;
                gap: 1rem;
                justify-content: flex-end;
                margin-top: 2rem;
            }

            .modal-actions button {
                padding: 0.75rem 1.5rem;
                border: none;
                border-radius: 4px;
                font-weight: 500;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .modal-actions button[type="submit"] {
                background: #00d6b2;
                color: white;
            }

            .modal-actions button[type="button"] {
                background: transparent;
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }

            .modal-actions button:hover {
                transform: translateY(-1px);
                box-shadow: 0 2px 8px rgba(0, 214, 178, 0.2);
            }

            .modal-actions button[type="button"]:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            .modal-actions button:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
        `;

        const content = this._data ? `
            <div class="profile-container">
                <img 
                    src="${this.getProfilePictureUrl(this._data.profile_picture)}" 
                    alt="Profile picture"
                    class="profile-picture"
                    onerror="this.src='${this.getDefaultProfilePicture()}'"
                >
                
                <div class="username">${this._data.firstname} ${this._data.lastname}</div>
                ${this._data.role ? `<div class="role">${this._data.role}</div>` : ''}
                
                <div class="info-section">
                    <div class="info-label">Email</div>
                    <div class="info-text">${this._data.email}</div>
                    
                    <div class="info-label">Member Since</div>
                    <div class="info-text">${this.formatDate(this._data.created_at)}</div>
                </div>

                <div class="activity-card">
                    <h3>Activity Overview</h3>
                    ${this._data.last_login ? `
                        <div class="activity-item">
                            <strong>Last Login:</strong> ${this.formatDate(this._data.last_login)}
                        </div>
                    ` : ''}
                    <div class="activity-item">
                        <strong>Total Logins:</strong> ${this._data.login_count || 0}
                    </div>
                </div>

                <div class="profile-actions">
                    <button type="button" id="edit-button">Edit Profile</button>
                    <button type="button" id="logout-button">Logout</button>
                </div>
            </div>

            <div class="modal">
                <div class="modal-content">
                    <button type="button" class="modal-close">&times;</button>
                    <h2>Edit Profile</h2>
                    <form id="edit-form">
                        <div class="photo-upload-container">
                            <img 
                                src="${this.getProfilePictureUrl(this._data.profile_picture)}" 
                                alt="Profile preview"
                                class="photo-preview"
                            >
                            <label class="photo-upload-label" for="photo-upload">
                                <svg viewBox="0 0 24 24">
                                    <path d="M3 4V1h2v3h3v2H5v3H3V6H0V4h3zm3 6V7h3V4h7l1.83 2H21c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H5c-1.1 0-2-.9-2-2V10h3zm7 9c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-3.2-5c0 1.77 1.43 3.2 3.2 3.2s3.2-1.43 3.2-3.2-1.43-3.2-3.2-3.2-3.2 1.43-3.2 3.2z"/>
                                </svg>
                            </label>
                            <input type="file" id="photo-upload" accept="image/*">
                        </div>
                        <div class="field-wrap">
                            <label>First Name</label>
                            <input type="text" name="firstname" value="${this._data.firstname}" required>
                        </div>
                        <div class="field-wrap">
                            <label>Last Name</label>
                            <input type="text" name="lastname" value="${this._data.lastname}" required>
                        </div>
                        <div class="field-wrap">
                            <label>Email</label>
                            <input type="email" name="email" value="${this._data.email}" required>
                        </div>
                        <div class="field-wrap">
                            <label>New Password (leave blank to keep current)</label>
                            <input type="password" name="password">
                        </div>
                        <div class="modal-actions">
                            <button type="button" class="modal-close">Cancel</button>
                            <button type="submit">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        ` : '<div>Loading profile...</div>';

        this.shadowRoot.innerHTML = `
            <style>${styles}</style>
            ${content}
        `;
    }
}

customElements.define('user-profile', UserProfile);

export default UserProfile; 