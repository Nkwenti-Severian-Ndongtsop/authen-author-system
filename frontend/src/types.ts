export interface User {
    id?: string;
    email: string;
    firstname: string;
    lastname: string;
    role: string;
    created_at?: string;
    last_login?: string;
    login_count?: number;
    profile_picture?: string;
}

export interface ProfileUpdateData {
    firstname?: string;
    lastname?: string;
    email?: string;
    password?: string;
    profile_picture?: File | string;
} 