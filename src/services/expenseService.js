import api from '../api/axios';

const BASE = '/owner/tools/expense-calculator';

/**
 * Save an expense record to the database.
 * The backend computes totalExpense server-side from expenseItems.
 *
 * @param {object} data - { pgName, month, expenseItems: [{ category, amount }] }
 * @returns {Promise<object>} - { id, ownerId, pgName, month, expenseItems, totalExpense, createdAt, message }
 */
export async function saveExpenseRecord(data) {
    const res = await api.post(BASE, data);
    return res.data;
}

/**
 * Fetch all expense records belonging to the authenticated owner.
 * @returns {Promise<Array>}
 */
export async function getAllExpenseRecords() {
    const res = await api.get(BASE);
    return res.data;
}

/**
 * Fetch a single expense record by ID (must belong to the authenticated owner).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getExpenseRecordById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
}
