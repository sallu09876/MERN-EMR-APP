import { useState, useCallback } from "react";
import api from "../services/api";

export const useAppointments = () => {
  const [appointments, setAppointments] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async (params = {}) => {
    setLoading(true);
    setError("");
    try {
      const { data } = await api.get("/api/appointments", { params: { limit: 10, ...params } });
      setAppointments(data.data || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load appointments");
    } finally {
      setLoading(false);
    }
  }, []);

  const markArrived = useCallback(async (id) => {
    await api.post(`/api/appointments/${id}/arrive`);
  }, []);

  const remove = useCallback(async (id) => {
    await api.delete(`/api/appointments/${id}`);
  }, []);

  const update = useCallback(async (id, payload) => {
    const { data } = await api.put(`/api/appointments/${id}`, payload);
    return data.data;
  }, []);

  return { appointments, pagination, loading, error, load, markArrived, remove, update };
};
