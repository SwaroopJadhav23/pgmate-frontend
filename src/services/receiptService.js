import api from '../api/axios';

const BASE = '/owner/tools/rent-receipt';

/**
 * Create a new rent receipt on the backend.
 * Returns a response with an auto-generated receiptNumber.
 *
 * @param {object} receiptData - { tenantName, landlordName, pgName, pgAddress,
 *                                  amount, paymentMode, forMonth, receiptDate,
 *                                  roomNumber?, remarks? }
 * @returns {Promise<object>} - { id, receiptNumber, ...allFields, createdAt, message }
 */
export async function createReceipt(receiptData) {
    const res = await api.post(BASE, receiptData);
    return res.data;
}

/**
 * Fetch all receipts belonging to the authenticated owner.
 * @returns {Promise<Array>}
 */
export async function getAllReceipts() {
    const res = await api.get(BASE);
    return res.data;
}

/**
 * Fetch a single receipt by ID (must belong to the authenticated owner).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getReceiptById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
}