const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export async function saveScan(scanData) {
    const response = await fetch(`${API_BASE}/api/scans`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(scanData)
    });

    if (!response.ok) {
        throw new Error('Failed to save scan');
    }

    return response.json();
}

export async function getScans() {
    const response = await fetch(`${API_BASE}/api/scans`);

    if (!response.ok) {
        throw new Error('Failed to fetch scans');
    }

    return response.json();
}

export async function deleteScan(id) {
    const response = await fetch(`${API_BASE}/api/scans/${id}`, {
        method: 'DELETE'
    });

    if (!response.ok) {
        throw new Error('Failed to delete scan');
    }

    return response.json();
}
