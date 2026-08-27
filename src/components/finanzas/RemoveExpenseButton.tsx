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
import { deleteExpense, reorderExpenses } from "@/app/actions/finance";
import { Modal } from "@/components/comun/Modal";
import { Icon } from "@/components/comun/Icon";
import { formatCurrency } from "@/lib/finance-logic";

interface ExpenseItem {
  id: string;
  category: string;
  amount: number;
  icon: string;
}

interface RemoveExpenseButtonProps {
  expenses: ExpenseItem[];
  currency: string;
}

/** Fila individual sortable de un gasto fijo. */
function SortableExpenseItem({
  expense,
  currency,
  isPending,
  pendingId,
  onDelete,
}: {
  expense: ExpenseItem;
  currency: string;
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
  } = useSortable({ id: expense.id });

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
        aria-label={`Arrastrar ${expense.category}`}
      >
        <Icon name="drag_indicator" className="text-[20px] text-on-surface-variant" />
      </button>

      {/* Icono, nombre y precio — centrados verticalmente */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center border border-outline-variant shrink-0">
          <Icon name={expense.icon} className="text-[18px] text-primary" />
        </div>
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-body-md text-on-surface truncate">
            {expense.category}
          </span>
          <span className="text-body-sm text-on-surface-variant font-mono whitespace-nowrap">
            {formatCurrency(expense.amount, { currency })}
          </span>
        </div>
      </div>

      {/* Botón Quitar */}
      <button
        onClick={() => onDelete(expense.id)}
        disabled={isPending}
        aria-label={`Quitar ${expense.category}`}
        className="flex items-center gap-1 text-error border border-error/40 hover:bg-error/10 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 shrink-0 ml-2"
      >
        <Icon name="delete" className="text-[18px]" />
        <span className="text-sm">
          {isPending && pendingId === expense.id ? "..." : "Quitar"}
        </span>
      </button>
    </li>
  );
}

/**
 * Botón "Modificar Gastos". Abre un modal donde puedes:
 * - Arrastrar gastos fijos para reordenarlos (drag & drop, funciona en móvil)
 * - Eliminar gastos fijos (botón Quitar)
 */
export function RemoveExpenseButton({
  expenses,
  currency,
}: RemoveExpenseButtonProps) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [localExpenses, setLocalExpenses] = useState<ExpenseItem[]>(expenses);
  const [saving, setSaving] = useState(false);

  // Sincronizar cuando cambian los props
  const expensesKey = expenses.map((e) => e.id).join(",");
  const localKey = localExpenses.map((e) => e.id).join(",");
  if (expensesKey !== localKey && !saving) {
    setLocalExpenses(expenses);
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

    const oldIndex = localExpenses.findIndex((e) => e.id === active.id);
    const newIndex = localExpenses.findIndex((e) => e.id === over.id);
    const updated = arrayMove(localExpenses, oldIndex, newIndex);
    setLocalExpenses(updated);

    // Persistir el nuevo orden
    setSaving(true);
    setError(null);
    startTransition(async () => {
      const res = await reorderExpenses(updated.map((e) => e.id));
      setSaving(false);
      if (!res.ok) {
        setError(res.error ?? "Error al reordenar");
        setLocalExpenses(expenses);
      }
    });
  }

  function handleDelete(id: string) {
    setError(null);
    setPendingId(id);
    startTransition(async () => {
      const res = await deleteExpense(id);
      setPendingId(null);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setLocalExpenses((prev) => prev.filter((e) => e.id !== id));
      if (localExpenses.length <= 1) setOpen(false);
    });
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="text-on-surface-variant hover:text-primary text-sm font-medium flex items-center gap-1 transition-colors"
      >
        <Icon name="edit" className="text-[18px]" /> Modificar Gastos
      </button>

      <Modal open={open} onClose={() => setOpen(false)} title="Modificar Gastos Fijos">
        {localExpenses.length === 0 ? (
          <div className="py-8 flex flex-col items-center justify-center text-center gap-3 text-on-surface-variant">
            <Icon name="receipt_long" className="text-[40px] opacity-40" />
            <p className="text-body-sm">No tienes gastos fijos para modificar.</p>
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
                items={localExpenses.map((e) => e.id)}
                strategy={verticalListSortingStrategy}
              >
                <ul className="space-y-2">
                  {localExpenses.map((e) => (
                    <SortableExpenseItem
                      key={e.id}
                      expense={e}
                      currency={currency}
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
