import api from '../api/axios';

const BASE = '/owner/tools/food-menu';

/**
 * Save a weekly food menu to the backend.
 * @param {object} menuData - { pgName, address, dateRange, days, mealConfigs }
 * @returns {Promise<object>} - saved menu with id, createdAt, etc.
 */
export async function saveMenu(menuData) {
    const res = await api.post(BASE, menuData);
    return res.data;
}

/**
 * Fetch all menus belonging to the authenticated owner.
 * @returns {Promise<Array>}
 */
export async function getAllMenus() {
    const res = await api.get(BASE);
    return res.data;
}

/**
 * Fetch a single menu by ID (must belong to the authenticated owner).
 * @param {string} id
 * @returns {Promise<object>}
 */
export async function getMenuById(id) {
    const res = await api.get(`${BASE}/${id}`);
    return res.data;
}

/**
 * Delete a menu by ID (must belong to the authenticated owner).
 * @param {string} id
 * @returns {Promise<void>}
 */
export async function deleteMenu(id) {
    await api.delete(`${BASE}/${id}`);
}