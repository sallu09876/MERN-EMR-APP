export const generateSlots = (startTime, endTime, duration, breakStart, breakEnd) => {
  const slots = [];

  let start = new Date(`1970-01-01T${startTime}:00`);
  const end = new Date(`1970-01-01T${endTime}:00`);

  const breakS = breakStart ? new Date(`1970-01-01T${breakStart}:00`) : null;
  const breakE = breakEnd ? new Date(`1970-01-01T${breakEnd}:00`) : null;

  while (start < end) {
    const slotEnd = new Date(start.getTime() + duration * 60000);

    if (breakS && breakE && start >= breakS && start < breakE) {
      start = breakE;
      continue;
    }

    if (slotEnd > end) break;

    slots.push({
      start: start.toTimeString().slice(0, 5),
      end: slotEnd.toTimeString().slice(0, 5),
    });

    start = slotEnd;
  }

  return slots;
};

