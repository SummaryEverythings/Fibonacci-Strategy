// Base fetcher for our backend API
const API_BASE_URL = 'http://localhost:3000/api';

/**
 * Helper to make API requests with better-auth session integration
 */
async function fetchApi(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    // Not all endpoints return JSON, but typically REST APIs do
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return response.json();
    }

    return response.text();
}

/**
 * Service to interact with the scans endpoint
 */
export const scanService = {
    getScans: async () => {
        return fetchApi('/scans');
    },

    getScanById: async (id) => {
        return fetchApi(`/scans/${id}`);
    },

    createScan: async (scanData) => {
        return fetchApi('/scans', {
            method: 'POST',
            body: JSON.stringify(scanData),
        });
    },

    deleteScan: async (id) => {
        return fetchApi(`/scans/${id}`, {
            method: 'DELETE',
        });
    }
};
