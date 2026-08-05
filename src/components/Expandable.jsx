import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

/* ------------------------------------------------------------------ */
/* Collapsible "learn more" section under a response                   */
/* ------------------------------------------------------------------ */

export default function Expandable({ title, body, seeMore, seeLess }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="expandable">
      <button type="button" className="expandable-toggle" onClick={() => setOpen(o => !o)}>
        {open ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
        <span>{open ? seeLess : seeMore}</span>
      </button>
      {open && <div className="expandable-body">{body}</div>}
    </div>
  );
}