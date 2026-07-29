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
  rectSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

/**
 * Single draggable image item
 */
function SortableImageItem({ img, index, total, onRemove }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: img.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.45 : 1,
    zIndex: isDragging ? 999 : "auto",
    cursor: "grab",
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="sortable-image-item"
      {...attributes}
      {...listeners}
    >
      <img src={img.src} alt={`preview-${index}`} draggable={false} />

      {/* order badge */}
      <span className="sortable-image-badge">{index + 1}</span>

      {/* delete button — stop drag propagation so click registers */}
      <button
        type="button"
        className="sortable-image-remove-btn"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(index);
        }}
      >
        ×
      </button>

      {/* drag handle hint */}
      <div className="sortable-image-drag-hint">
        <span>⠿</span>
      </div>
    </div>
  );
}

/**
 * SortableImageGrid
 *
 * Props:
 *   imageList  – array of { id, src, file?, type? }
 *   onChange   – (newList) => void
 *   onRemove   – (index)   => void
 */
export default function SortableImageGrid({ imageList, onChange, onRemove }) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    const oldIndex = imageList.findIndex((img) => img.id === active.id);
    const newIndex = imageList.findIndex((img) => img.id === over.id);
    onChange(arrayMove(imageList, oldIndex, newIndex));
  };

  if (!imageList || imageList.length === 0) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={imageList.map((img) => img.id)}
        strategy={rectSortingStrategy}
      >
        <div className="sortable-image-grid">
          {imageList.map((img, i) => (
            <SortableImageItem
              key={img.id}
              img={img}
              index={i}
              total={imageList.length}
              onRemove={onRemove}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}