"use client";

import { useState, useTransition } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { deleteHabit, reorderHabits } from "@/app/actions/habits";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";

interface HabitItem {
  id: string;
  name: string;
  icon: string;
}

interface RemoveHabitButtonProps {
  habits: HabitItem[];
}

/** Fila individual sortable de un hábito. */
function SortableHabitItem({
  habit,
  isPending,
  pendingId,
  onDelete,
}: {
  habit: HabitItem;
  isPending: boolean;
  pendingId: string | null;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 50 : undefined,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg bg-surface-container-lowest border border-outline-variant/40 ${
        isDragging ? "shadow-lg ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Handle de arrastre */}
      <button
        {...attributes}
        {...listeners}
        className="flex items-center justify-center w-8 h-8 rounded-lg cursor-grab active:cursor-grabbing hover:bg-surface-container transition-colors touch-none mr-2 shrink-0"
        aria-label={`Arrastrar ${habit.name}`}
      >
        <Icon name="drag_indicator" className="text-[20px] text-on-surface-variant" />
      </button>

      {/* Icono y nombre */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant shrink-0">
          <Icon name={habit.icon} className="text-[18px] text-primary" />
        </div>
        <span className="text-body-md text-on-surface truncate">{habit.name}</span>
      </div>

      {/* Botón Quitar */}
      <button
        onClick={() => onDelete(habit.id)}
        disabled={isPending}
        aria-label={`Quitar ${habit.name}`}
        className="flex items-center gap-1 text-error border border-error/40 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 ml-2"
      >
        <Icon name="delete" className="text-[18px]" />
        <span className="text-sm">
          {isPending && pendingId === habit.id ? "..." : "Quitar"}
        </span>
      </button>
    </li>
  );
}

/**
 * Botón "Modificar Hábito". Abre un modal donde puedes:
 * - Arrastrar hábitos para reordenarlos (drag & drop, funciona en móvil)
 * - Eliminar hábitos (botón Quitar)
 */
export function RemoveHabitButton({ habits }: RemoveHabitButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localHabits, setLocalHabits] = useState<HabitItem[]>(habits);
  const [saving, setSaving] = useState(false);

  // Sincronizar cuando cambian los props (después de eliminar, etc.)
  const habitsKey = habits.map((h) => h.id).join(",");
  const localKey = localHabits.map((h) => h.id).join(",");
  if (habitsKey !== localKey && !saving) {
    setLocalHabits(habits);
  }

  // Sensores: pointer (desktop) + touch (móvil) + keyboard (accesibilidad)
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 150, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = localHabits.findIndex((h) => h.id === active.id);
    const newIndex = localHabits.findIndex((h) => h.id === over.id);
    const updated = arrayMove(localHabits, oldIndex, newIndex);
    setLocalHabits(updated);

    // Persistir el nuevo orden
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const res = await reorderHabits(updated.map((h) => h.id));
      setSaving(false);
      if (!res.ok) {
        setError(res.error ?? "Error al reordenar");
        setLocalHabits(habits);
      }
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteHabit(id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      // Quitar del estado local
      setLocalHabits((prev) => prev.filter((h) => h.id !== id));
      if (localHabits.length <= 1) setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex flex-1 sm:flex-none items-center justify-center gap-2 border border-primary/40 text-primary font-medium px-4 py-2 rounded-xl hover:bg-primary/10 transition-colors whitespace-nowrap"
      >
        <Icon name="edit" className="text-[20px] shrink-0" />
        <span>Modificar Hábito</span>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modificar Hábitos">
        {localHabits.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="event_repeat" className="text-[40px] opacity-40" />
            <p className="text-body-sm">No tienes hábitos para modificar.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-body-sm text-on-surface-variant">
              Arrastra con el icono <Icon name="drag_indicator" className="text-[16px] inline-block align-middle" /> para
              reordenar. El orden se guarda automáticamente.
            </p>

            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={localHabits.map((h) => h.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {localHabits.map((h) => (
                    <SortableHabitItem
                      key={h.id}
                      habit={h}
                      isPending={isPending}
                      pendingId={pendingId}
                      onDelete={handleDelete}
                    />
                  ))}
                </ul>
              </SortableContext>
            </DndContext>

            {saving && (
              <p className="text-body-sm text-primary flex items-center gap-1">
                <Icon name="sync" className="text-[16px] animate-spin" />
                Guardando orden...
              </p>
            )}
            {error && <p className="text-error text-body-sm">{error}</p>}
          </div>
        )}
      </Modal>
    </>
  );
}
