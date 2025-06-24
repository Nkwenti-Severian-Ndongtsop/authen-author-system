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

            // Create a clean data object without undefined or empty values
            let cleanData: Partial<ProfileUpdateData> = {};
            
            // Only include non-empty string fields
            if (data.firstname) cleanData.firstname = data.firstname;
            if (data.lastname) cleanData.lastname = data.lastname;
            if (data.email) cleanData.email = data.email;
            if (data.password) cleanData.password = data.password;

            // Handle profile picture only if it's a valid File object
            if (data.profile_picture instanceof File && data.profile_picture.size > 0) {
                const base64 = await this.fileToBase64(data.profile_picture);
                cleanData.profile_picture = base64;
            }

            console.log('Sending update with clean data:', cleanData);

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
            
            // Update the component data and close the modal
            this.data = updatedUser;
            this.closeEditModal();
            
            // Show success message
            this.showMessage('Profile updated successfully!', 'success');
        } catch (error) {
            console.error('Profile update failed:', error);
            this.showMessage('Failed to update profile. Please try again.', 'error');
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
                <button id="logout" class="button button-secondary">Logout</button>
            </div>
        `;

        // Set the innerHTML and setup event listeners after a short delay
        this.innerHTML = modalHtml + profileHtml;
        
        // Use requestAnimationFrame to ensure DOM is updated
        requestAnimationFrame(() => {
            this.setupEventListeners();
        });
    }

    private setupEventListeners() {
        // Edit form handling
        const editForm = this.querySelector('#edit-profile-form');
        if (editForm) {
            console.log('Found edit form, adding submit listener');
            editForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(e.target as HTMLFormElement);
                const data: ProfileUpdateData = {
                    firstname: formData.get('firstname')?.toString() || '',
                    lastname: formData.get('lastname')?.toString() || '',
                    email: formData.get('email')?.toString() || '',
                    password: formData.get('password')?.toString() || undefined,
                    profile_picture: (formData.get('profile_picture') as File)?.size > 0 
                        ? formData.get('profile_picture') as File 
                        : undefined
                };
                await this.handleProfileUpdate(data);
            });

            // Cancel button handling
            const cancelButton = this.querySelector('#cancel-edit');
            if (cancelButton) {
                console.log('Found cancel button, adding click listener');
                cancelButton.addEventListener('click', () => this.closeEditModal());
            }
        } else if (this.isEditModalOpen) {
            console.log('Edit form not found but modal is open, will retry in next frame');
            requestAnimationFrame(() => this.setupEventListeners());
        }

        // Edit profile button
        const editButton = this.querySelector('#edit-profile');
        if (editButton) {
            console.log('Found edit button, adding click listener');
            editButton.addEventListener('click', () => this.openEditModal());
        }

        // Logout button
        const logoutButton = this.querySelector('#logout');
        if (logoutButton) {
            console.log('Found logout button, adding click listener');
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('token');
                window.location.href = '/login';
            });
        }
    }

    private showMessage(message: string, type: 'success' | 'error') {
        const messageElement = document.createElement('div');
        messageElement.className = `message message-${type}`;
        messageElement.textContent = message;
        
        // Add the message to the page
        this.appendChild(messageElement);
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            messageElement.classList.add('fade-out');
            setTimeout(() => messageElement.remove(), 300);
        }, 3000);
    }
} 