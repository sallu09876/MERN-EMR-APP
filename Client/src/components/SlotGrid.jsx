import React from "react";

export const SlotGrid = ({ slots, selectedSlot, onSelect }) => {
  if (!slots?.length) {
    return (
      <div style={{
        textAlign: "center", padding: "2.5rem 1.5rem",
        color: "var(--text-muted)", fontSize: "0.9rem",
        background: "var(--surface-2)", borderRadius: "12px",
        border: "2px dashed var(--border)"
      }}>
        <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>📅</div>
        <p style={{ margin: 0, fontWeight: 500 }}>No slots available for this selection.</p>
        <p style={{ fontSize: "0.8rem", marginTop: "0.35rem", margin: "0.35rem 0 0" }}>
          Try selecting a different doctor or date.
        </p>
      </div>
    );
  }

  return (
    <>
      <style>{`
        .slot-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0.5rem;
        }
        @media (max-width: 767px) {
          .slot-grid { gap: 0.5rem; }
          .sg-btn { min-height: 52px; padding: 0.6rem 0.3rem; -webkit-tap-highlight-color: transparent; touch-action: manipulation; }
          .sg-time { font-size: 0.75rem; }
          .sg-end { font-size: 0.6rem; }
        }
        @media (min-width: 400px) {
          .slot-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (min-width: 600px) {
          .slot-grid { grid-template-columns: repeat(auto-fill, minmax(100px, 1fr)); gap: 0.625rem; }
        }

        .sg-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 0.55rem 0.25rem;
          border-radius: 9px;
          border: 1.5px solid var(--border);
          background: white;
          cursor: pointer;
          transition: all 0.14s;
          min-height: 56px;
          /* Ensure minimum tap size on mobile */
          min-width: 0;
          -webkit-tap-highlight-color: transparent;
          font-family: 'DM Sans', sans-serif;
        }
        .sg-btn:hover:not(:disabled) {
          border-color: var(--teal);
          background: var(--teal-glow);
          transform: translateY(-1px);
        }
        .sg-btn:active:not(:disabled) { transform: translateY(0); }
        .sg-btn:disabled {
          background: var(--surface-2);
          cursor: not-allowed;
          opacity: 0.55;
        }
        .sg-btn.selected {
          background: linear-gradient(135deg, var(--teal), #0891b2);
          border-color: var(--teal);
          color: white;
          box-shadow: 0 3px 10px rgba(14,165,160,0.35);
          transform: translateY(-1px);
        }
        .sg-btn.booked {
          text-decoration: line-through;
        }
        .sg-time {
          font-weight: 600;
          font-size: 0.8rem;
          line-height: 1.2;
          white-space: nowrap;
        }
        .sg-end {
          font-size: 0.65rem;
          opacity: 0.65;
          line-height: 1.2;
          white-space: nowrap;
        }
        .sg-booked-label {
          font-size: 0.6rem;
          margin-top: 2px;
          color: #ef4444;
          font-weight: 600;
        }
        .sg-btn.selected .sg-end,
        .sg-btn.selected .sg-time { opacity: 1; }
        .sg-btn.selected .sg-booked-label { color: rgba(255,255,255,0.7); }
      `}</style>

      <div className="slot-grid">
        {slots.map((slot) => {
          const isBooked   = slot.status === "BOOKED";
          const isSelected = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end;
          return (
            <button
              key={`${slot.start}-${slot.end}`}
              type="button"
              disabled={isBooked}
              onClick={() => onSelect(slot)}
              className={`sg-btn${isSelected ? " selected" : ""}${isBooked ? " booked" : ""}`}
            >
              <div className="sg-time">{slot.start}</div>
              <div className="sg-end">– {slot.end}</div>
              {isBooked && <div className="sg-booked-label">Booked</div>}
            </button>
          );
        })}
      </div>
    </>
  );
};
