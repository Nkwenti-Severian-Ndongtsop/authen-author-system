import { User, ProfileUpdateData } from '../types';

export class ProfileComponent extends HTMLElement {
    private user: User | null = null;
    private isEditModalOpen: boolean = false;

    constructor() {
        super();
        this.render();
    }

    set data(user: User) {
        console.log('Profile component received data:', user);
        this.user = user;
        this.render();
        this.animateIn();
        
        // Make sure the profile container is visible
        const profileContainer = this.closest('.profile-container');
        if (profileContainer) {
            profileContainer.classList.add('visible');
        }
    }

    private animateIn() {
        const elements = this.querySelectorAll('.animate-in');
        elements.forEach((el, index) => {
            (el as HTMLElement).style.animation = `fadeInUp 0.5s ease forwards ${index * 0.1}s`;
        });
    }

    private async handleProfileUpdate(data: ProfileUpdateData) {
        try {
            console.log('Handling profile update:', data);
            const token = localStorage.getItem('token');
            if (!token) throw new Error('No token found');

            // Convert file to base64 if it exists
            let cleanData = { ...data };
            if (data.profile_picture instanceof File) {
                const base64 = await this.fileToBase64(data.profile_picture);
                cleanData.profile_picture = base64;
            }

            // Remove undefined values and empty strings
            cleanData = Object.fromEntries(
                Object.entries(cleanData).filter(([_, value]) => 
                    value !== undefined && value !== ''
                )
            );

            const response = await fetch(`${import.meta.env.VITE_BACKEND_API}/api/profile/update`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(cleanData)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(errorData?.message || 'Failed to update profile');
            }

            const updatedUser = await response.json();
            console.log('Profile updated successfully:', updatedUser);
            this.data = updatedUser;
            this.closeEditModal();
        } catch (error) {
            console.error('Profile update failed:', error);
            alert('Failed to update profile. Please try again.');
        }
    }

    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = error => reject(error);
        });
    }

    private openEditModal() {
        console.log('Opening edit modal');
        this.isEditModalOpen = true;
        this.render();
    }

    private closeEditModal() {
        console.log('Closing edit modal');
        this.isEditModalOpen = false;
        this.render();
    }

    private getDefaultProfilePicture(): string {
        return `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23666'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 3c1.66 0 3 1.34 3 3s-1.34 3-3 3-3-1.34-3-3 1.34-3 3-3zm0 14.2c-2.5 0-4.71-1.28-6-3.22.03-1.99 4-3.08 6-3.08 1.99 0 5.97 1.09 6 3.08-1.29 1.94-3.5 3.22-6 3.22z'/%3E%3C/svg%3E`;
    }

    private formatDate(dateString?: string): string {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    private render() {
        if (!this.user) {
            this.innerHTML = `
                <div class="animate-in">
                    <div class="profile-info">
                        <h2>Loading profile...</h2>
                    </div>
                </div>
            `;
            return;
        }

        // Create the modal HTML if it's open
        const modalHtml = this.isEditModalOpen ? `
            <div class="modal-overlay">
                <div class="modal animate-in">
                    <h3>Edit Profile</h3>
                    <form id="edit-profile-form" class="edit-profile-form">
                        <div class="form-group">
                            <label for="firstname">First Name</label>
                            <input type="text" id="firstname" name="firstname" value="${this.user.firstname || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="lastname">Last Name</label>
                            <input type="text" id="lastname" name="lastname" value="${this.user.lastname || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="email">Email</label>
                            <input type="email" id="email" name="email" value="${this.user.email || ''}" required>
                        </div>
                        <div class="form-group">
                            <label for="password">New Password (leave blank to keep current)</label>
                            <input type="password" id="password" name="password" minlength="6">
                        </div>
                        <div class="form-group">
                            <label for="profile_picture">Profile Picture</label>
                            <input type="file" id="profile_picture" name="profile_picture" accept="image/*">
                        </div>
                        <div class="button-group">
                            <button type="button" class="button button-secondary" id="cancel-edit">Cancel</button>
                            <button type="submit" class="button">Save Changes</button>
                        </div>
                    </form>
                </div>
            </div>
        ` : '';

        // Create the main profile HTML
        const profileHtml = `
            <div class="profile-header animate-in">
                <div class="profile-picture-container">
                    <img 
                        src="${this.user.profile_picture || this.getDefaultProfilePicture()}" 
                        alt="Profile picture"
                        class="profile-picture"
                        onerror="this.src='${this.getDefaultProfilePicture()}'"
                    >
                </div>
                <div class="profile-title">
                    <h2>${this.user.firstname} ${this.user.lastname}</h2>
                    <span class="role-badge">${this.user.role}</span>
                </div>
            </div>

            <div class="profile-info animate-in">
                <div class="info-group">
                    <label>Email</label>
                    <p>${this.user.email}</p>
                </div>
                <div class="info-group">
                    <label>Member Since</label>
                    <p>${this.formatDate(this.user.created_at)}</p>
                </div>
            </div>

            <div class="activity-overview animate-in">
                <h3>Activity Overview</h3>
                <div class="info-group">
                    <label>Last Login</label>
                    <p>${this.formatDate(this.user.last_login)}</p>
                </div>
                <div class="info-group">
                    <label>Total Logins</label>
                    <p>${this.user.login_count || 0}</p>
                </div>
            </div>

            <div class="profile-actions animate-in">
                <button id="edit-profile" class="button">Edit Profile</button>
                <button id="logout-button" class="button button-danger">Logout</button>
            </div>
        `;

        // Combine the profile and modal HTML
        this.innerHTML = `
            <div>
                ${profileHtml}
                ${modalHtml}
            </div>
        `;

        // Add event listeners after rendering
        requestAnimationFrame(() => {
            this.setupEventListeners();
        });
    }

    private setupEventListeners() {
        // Edit profile button
        const editButton = this.querySelector('#edit-profile');
        if (editButton) {
            console.log('Found edit button, adding click listener');
            editButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Edit button clicked');
                this.openEditModal();
            });
        } else {
            console.warn('Edit button not found');
        }

        // Cancel edit button
        const cancelButton = this.querySelector('#cancel-edit');
        if (cancelButton) {
            console.log('Found cancel button, adding click listener');
            cancelButton.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Cancel button clicked');
                this.closeEditModal();
            });
        }

        // Edit profile form
        const editForm = this.querySelector('#edit-profile-form');
        if (editForm) {
            console.log('Found edit form, adding submit listener');
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('Form submitted');
                const formData = new FormData(e.target as HTMLFormElement);
                const data: ProfileUpdateData = {};
                
                formData.forEach((value, key) => {
                    if (value instanceof File) {
                        if (value.size > 0) {
                            data[key as 'profile_picture'] = value;
                        }
                    } else if (value && typeof value === 'string' && value.trim()) {
                        data[key as Exclude<keyof ProfileUpdateData, 'profile_picture'>] = value.trim();
                    }
                });

                await this.handleProfileUpdate(data);
            });
        } else {
            console.warn('Edit form not found');
        }

        // Logout button
        const logoutButton = this.querySelector('#logout-button');
        if (logoutButton) {
            console.log('Found logout button, adding click listener');
            logoutButton.addEventListener('click', async () => {
                try {
                    logoutButton.setAttribute('disabled', 'true');
                    logoutButton.innerHTML = '<span class="loading-spinner"></span> Logging out...';
                    
                    await new Promise(resolve => setTimeout(resolve, 500));
                    localStorage.removeItem('token');
                    window.location.reload();
                } catch (error) {
                    console.error('Logout failed:', error);
                    logoutButton.removeAttribute('disabled');
                    logoutButton.textContent = 'Logout';
                }
            });
        } else {
            console.warn('Logout button not found');
        }
    }
} 