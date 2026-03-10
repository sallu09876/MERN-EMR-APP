import React from "react";

export const SlotGrid = ({ slots, selectedSlot, onSelect }) => {
  if (!slots?.length) {
    return (
      <div style={{
        textAlign: "center", padding: "3rem",
        color: "var(--text-muted)", fontSize: "0.9rem",
        background: "var(--surface-2)", borderRadius: "12px",
        border: "2px dashed var(--border)"
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
        <p>No slots available for this selection.</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Try selecting a different doctor or date.</p>
      </div>
    );
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))", gap: "0.625rem" }}>
      {slots.map((slot) => {
        const isBooked = slot.status === "BOOKED";
        const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
        return (
          <button
            key={`${slot.start}-${slot.end}`}
            type="button"
            disabled={isBooked}
            onClick={() => onSelect(slot)}
            className={`slot-btn ${isSelected ? "selected" : ""}`}
            style={isBooked ? { textDecoration: "line-through", opacity: 0.5 } : {}}
          >
            <div style={{ fontWeight: 600 }}>{slot.start}</div>
            <div style={{ fontSize: "0.7rem", opacity: 0.7 }}>– {slot.end}</div>
            {isBooked && <div style={{ fontSize: "0.65rem", marginTop: "2px", color: "#ef4444" }}>Booked</div>}
          </button>
        );
      })}
    </div>
  );
};
