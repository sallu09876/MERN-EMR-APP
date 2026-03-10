export const formatDateForInput = (date) => {
  return date.toISOString().split("T")[0];
};

