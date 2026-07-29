import api from '../api/axios';

const BASE = '/owner/tools/lease-agreement';

/**
 * Save a lease agreement to the database.
 * @param {object} data - All lease agreement fields
 * @returns {Promise<object>} - { id, ownerId, pgName, tenantName, ..., createdAt, message }
 */
export async function saveAgreement(data) {
    const res = await api.post(BASE, data);
    return res.data;
}

/**
 * Fetch all lease agreements belonging to the authenticated owner.
 * @returns {Promise<Array>}
 */
export async function getAllAgreements() {
    const res = await api.get(BASE);
    return res.data;
}

/**
 * Fetch a single lease agreement by ID (must belong to the authenticated owner).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getAgreementById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
}

/**
 * Generate and download a PDF for the given lease agreement data.
 * Returns a Blob so the caller can trigger a browser download.
 * @param {object} data - All lease agreement fields
 * @returns {Promise<Blob>}
 */
export async function generatePdf(data) {
    const res = await api.post(`${BASE}/generate-pdf`, data, {
        responseType: 'blob',
    });
    return res.data;
}
