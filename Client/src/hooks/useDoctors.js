import { useState, useEffect } from "react";
import api from "../services/api";

export const useDoctors = () => {
  const [doctors, setDoctors] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/api/doctors")
      .then(({ data }) => {
        const docs = data.data || [];
        setDoctors(docs);
        // Extract unique departments
        const depts = [...new Set(docs.map((d) => d.department).filter(Boolean))].sort();
        setDepartments(depts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return { doctors, departments, loading };
};
