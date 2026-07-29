import api from "../../../api/axios";

export const getUIText = async (section) => {
  const res = await api.get(`/public/ui-text/${section}`);
  return res.data;
};

export const saveUIText = async (section, data) => {
  const res = await api.put(`/admin/ui-text/${section}`, data);
  return res.data;
};
