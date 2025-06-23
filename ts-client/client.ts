import { Configuration, AuthenticationApi } from './index.js';

const api = new AuthenticationApi(new Configuration({
    basePath: 'http://localhost:3000',
}));

async function login() {
    try {
        const response = await api.authLoginPost({
            email: 'admin@example.com',
            password: 'password'
        });
        console.log('Login successful!');
        console.log('Token:', response.data.token);
        console.log('User:', response.data.user);
    } catch (error) {
        console.error('Login failed:', error);
    }
}

login(); 