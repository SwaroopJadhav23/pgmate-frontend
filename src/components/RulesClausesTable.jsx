import { useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import "../CSS/RulesClausesTable.css";

export const DEFAULT_RULES = [
  {
    id: "rule-1",
    title: "Rule Changes",
    description:
      "Residents must follow all the rules and regulations of PG. Rules can be changed from time to time. A notice of at least 3 days will be given for any changes in the rules. Violating the rules may result in legal action.",
    enabled: true,
  },
  {
    id: "rule-2",
    title: "Rent Payment",
    description:
      "Rent should be paid between 1st to {Rent Due Date} of every month. A late fee of {Late Fee Amount} rupees per day will be charged after the due date. If rent is not paid by the 20th, the room may be vacated without prior notice.",
    enabled: true,
  },
  {
    id: "rule-3",
    title: "Breakfast, Lunch & Dinner Time",
    description:
      "Breakfast time: {Breakfast Time}. Lunch time: {Lunch Time}. Dinner time: {Dinner Time}. Please follow the timings strictly.",
    enabled: true,
  },
  {
    id: "rule-4",
    title: "Electricity & Appliances",
    description:
      "Use of electrical appliances such as heater, water heater, iron, induction, mixer, electric kettle, etc. is strictly prohibited. A fine of {First Time Fine} will be charged for first-time violation and {Repeated Fine} for repeated violations. Use of AC / Cooler is allowed, but the temperature must be kept between {AC Temp Min}°C to {AC Temp Max}°C. A fine of {Addiction Fine} will be charged for not following this rule.",
    enabled: true,
  },
  {
    id: "rule-5",
    title: "Visitors Not Allowed",
    description:
      "Guests are not allowed. If any guest (for {Visitor Stay Duration}) is found inside the PG, the membership will be cancelled and the security deposit will be forfeited.",
    enabled: true,
  },
  {
    id: "rule-6",
    title: "Commission Agents (Brokers) Not Allowed",
    description:
      "Commission agents (brokers) are not allowed. If anyone is found involved in brokerage activities, their membership will be cancelled and 50% of the security deposit will be deducted.",
    enabled: true,
  },
  {
    id: "rule-7",
    title: "Smoking, Tobacco, Alcohol Prohibited",
    description:
      "Any type of addiction such as smoking, tobacco, gutkha, alcohol, etc. is strictly prohibited inside the PG. Those found doing so will be fined {Addiction Fine} and membership will be cancelled.",
    enabled: true,
  },
  {
    id: "rule-8",
    title: "Cleanliness",
    description:
      "Keep your room, common areas, washrooms, and the entire PG premises clean. Do not throw garbage here and there. If anyone is found doing so, a fine of {Cleanliness Fine} will be charged.",
    enabled: true,
  },
  {
    id: "rule-9",
    title: "Personal Belongings",
    description:
      "You are responsible for your own belongings. PG is not responsible for any loss or theft. If any loss occurs, inform the administrator immediately.",
    enabled: true,
  },
  {
    id: "rule-10",
    title: "Security Deposit Refund",
    description:
      "Security deposit will be refunded within {Security Deposit Refund Days} working days after checkout and after adjusting any pending dues. If any damage is found, an amount of up to {Damage Charges} may be deducted from the deposit.",
    enabled: true,
  },
  {
    id: "rule-11",
    title: "Room Locks",
    description:
      "Keep locks on your room door. PG is not responsible for any loss or theft.",
    enabled: true,
  },
  {
    id: "rule-12",
    title: "Entry Timing",
    description:
      "Entry is allowed till {Curfew Time}. After that, coordinator's permission is mandatory. PG has full rights to deny entry.",
    enabled: true,
  },
  {
    id: "rule-13",
    title: "Mobile Silent Mode",
    description:
      "Please keep your mobile on silent mode in the PG. Do not make noise while talking on the phone.",
    enabled: true,
  },
  {
    id: "rule-14",
    title: "No Spitting / Littering",
    description:
      "Do not spit, litter or throw waste outside the room, in corridors, near staircase, or in the parking area. It is strictly prohibited.",
    enabled: true,
  },
  {
    id: "rule-15",
    title: "PG Facilities Maintenance",
    description:
      "Keep the water tank, washbasin, taps, fans, lights, and all PG facilities clean and in good condition. For any damage, you may be fined up to {Damage Charges}.",
    enabled: true,
  },
  {
    id: "rule-16",
    title: "Washing Machine Usage",
    description:
      "Washing machine is available for use. For coordinator / owner's clothes, washing charge is {Washing Machine Charges} per wash.",
    enabled: true,
  },
];

export const resolveRuleDescription = (desc, formData) => {
  if (!formData) return desc;
  let txt = desc;
  txt = txt.replace(/\{Rent Due Date\}/g, formData.rentDueDate || '___');
  txt = txt.replace(/\{Late Fee Amount\}/g, formData.lateFeeAmount || '___');
  txt = txt.replace(/\{Breakfast Time\}/g, formData.breakfastTime || '___');
  txt = txt.replace(/\{Lunch Time\}/g, formData.lunchTime || '___');
  txt = txt.replace(/\{Dinner Time\}/g, formData.dinnerTime || '___');
  txt = txt.replace(/\{First Time Fine\}/g, formData.firstTimeFine || '___');
  txt = txt.replace(/\{Repeated Fine\}/g, formData.repeatedFine || '___');
  txt = txt.replace(/\{AC Temp Min\}/g, formData.acTempMin || '___');
  txt = txt.replace(/\{AC Temp Max\}/g, formData.acTempMax || '___');
  txt = txt.replace(/\{Addiction Fine\}/g, formData.addictionFine || '___');
  txt = txt.replace(/\{Cleanliness Fine\}/g, formData.cleanlinessFine || '___');
  txt = txt.replace(/\{Security Deposit Refund Days\}/g, formData.depositRefundDays || '___');
  txt = txt.replace(/\{Damage Charges\}/g, formData.damageCharges || '___');
  txt = txt.replace(/\{Curfew Time\}/g, formData.curfewTime || '___');
  txt = txt.replace(/\{Washing Machine Charges\}/g, formData.washingMachineCharges || '___');
  txt = txt.replace(/\{Visitor Stay Duration\}/g, formData.visitorPolicy || '___');
  return txt;
};

function SortableRuleRow({ rule, index, onToggle, onEdit, onDelete, formData }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id });

  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(rule.title);
  const [draftDesc, setDraftDesc] = useState(rule.description);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : "auto",
  };

  const saveEdit = () => {
    onEdit(rule.id, {
      title: draftTitle.trim() || rule.title,
      description: draftDesc.trim() || rule.description,
    });
    setEditing(false);
  };

  return (
    <div ref={setNodeRef} style={style} className="rules-table-row">
      <div className="rules-col-order">
        <span
          className="rules-drag-handle"
          {...attributes}
          {...listeners}
        >
          ⠿
        </span>
        <span className="rules-order-badge">{index + 1}</span>
      </div>

      {editing ? (
        <>
          <div className="rules-col-title">
            <input
              className="rules-edit-input"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              placeholder="Rule title"
            />
          </div>
          <div className="rules-col-desc">
            <textarea
              className="rules-edit-textarea"
              value={draftDesc}
              onChange={(e) => setDraftDesc(e.target.value)}
              placeholder="Rule description"
            />
          </div>
        </>
      ) : (
        <>
          <div className="rules-col-title">{rule.title}</div>
          <div className="rules-col-desc">{resolveRuleDescription(rule.description, formData)}</div>
        </>
      )}

      <div className="rules-col-status">
        <label className="rules-toggle">
          <input
            type="checkbox"
            checked={rule.enabled}
            onChange={() => onToggle(rule.id)}
          />
          <span className="rules-toggle-slider" />
        </label>
      </div>

      <div className="rules-col-actions">
        {editing ? (
          <button
            type="button"
            className="rules-action-btn rules-save-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={saveEdit}
          >
            ✓
          </button>
        ) : (
          <button
            type="button"
            className="rules-action-btn"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={() => setEditing(true)}
          >
            ✎
          </button>
        )}
        <button
          type="button"
          className="rules-action-btn rules-delete-btn"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => onDelete(rule.id)}
        >
          🗑
        </button>
      </div>
    </div>
  );
}

/**
 * RulesClausesTable
 * Props:
 *   rules     – array of { id, title, description, enabled }
 *   onChange  – (newRules) => void
 *   formData  - form state for resolving placeholders
 */
export default function RulesClausesTable({ rules, onChange, formData }) {
  const [newRuleText, setNewRuleText] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = rules.findIndex((r) => r.id === active.id);
    const newIndex = rules.findIndex((r) => r.id === over.id);
    onChange(arrayMove(rules, oldIndex, newIndex));
  };

  const toggleRule = (id) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r)));
  };

  const editRule = (id, updates) => {
    onChange(rules.map((r) => (r.id === id ? { ...r, ...updates } : r)));
  };

  const deleteRule = (id) => {
    onChange(rules.filter((r) => r.id !== id));
  };

  const addRule = () => {
    if (!newRuleText.trim()) return;
    onChange([
      ...rules,
      {
        id: `rule-${Date.now()}`,
        title: newRuleText.trim(),
        description: "",
        enabled: true,
      },
    ]);
    setNewRuleText("");
  };

  const restoreDefaults = () => {
    onChange(DEFAULT_RULES.map((r) => ({ ...r })));
  };

  return (
    <div className="rules-table-wrapper">
      <div className="rules-table-header-row">
        <div>
          <h4 className="rules-table-title">Rules & Clauses Customization</h4>
          <p className="rules-table-subtitle">
            Edit, add, or remove rules. You can reorder the rules using drag and drop.
          </p>
        </div>
        <div className="rules-table-header-actions">
          <button type="button" className="rules-restore-btn" onClick={restoreDefaults}>
            ↻ Restore Default Rules
          </button>
        </div>
      </div>

      <div className="rules-table-columns-header">
        <span>Order</span>
        <span>Rule Title</span>
        <span>Rule Description</span>
        <span>Status</span>
        <span>Actions</span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={rules.map((r) => r.id)}
          strategy={verticalListSortingStrategy}
        >
          {rules.map((rule, i) => (
            <SortableRuleRow
              key={rule.id}
              rule={rule}
              index={i}
              onToggle={toggleRule}
              onEdit={editRule}
              onDelete={deleteRule}
              formData={formData}
            />
          ))}
        </SortableContext>
      </DndContext>

      <div className="rules-add-row">
        <input
          type="text"
          className="rules-add-input"
          placeholder="Add a new custom rule..."
          value={newRuleText}
          onChange={(e) => setNewRuleText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addRule();
            }
          }}
        />
        <button type="button" className="rules-add-btn" onClick={addRule}>
          + Add Rule
        </button>
      </div>
    </div>
  );
}