"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Icon } from "@/components/comun/ui/Icon";
import { DEFAULT_QUICK_CSS } from "@/lib/constants/default-css";
import { setQuickCss, clearQuickCss } from "@/app/actions/settings";
import { applyQuickCssPreview, clearQuickCssPreview } from "@/lib/quick-css";

/**
 * "Personalización LifeTracker" — editor de QuickCSS (inspirado en Vencord).
 *
 * El tema se persiste en la **base de datos** (`User.quickCss`) para que se
 * aplique en todos los dispositivos del usuario. La inyección definitiva la hace
 * `QuickCssStyle` (server-side, sin FOUC). Este editor usa una **vista previa en
 * vivo** (`applyQuickCssPreview`, nodo propio) mientras se edita; al Guardar
 * persiste en BD y al Restablecer BORRA el registro (no deja basura).
 *
 * No reutiliza `comun/ui/Modal` porque ese modal está fijado a `max-w-md`; en su
 * lugar usa su propio overlay grande, también vía React Portal (obligatorio por
 * el `backdrop-filter` de `.glass-panel`, invariante de diseño #10).
 */
export function QuickCSSEditor({ quickCss }: { quickCss: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [code, setCode] = useState(quickCss ?? DEFAULT_QUICK_CSS);
  const [customActive, setCustomActive] = useState(Boolean(quickCss));
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const gutterRef = useRef<HTMLDivElement>(null);

  useEffect(() => setMounted(true), []);

  // Al abrir, carga el CSS persistido en la BD (o la plantilla por defecto).
  useEffect(() => {
    if (!open) return;
    setCustomActive(Boolean(quickCss));
    setCode(quickCss && quickCss.length > 0 ? quickCss : DEFAULT_QUICK_CSS);
    setError(null);
  }, [open, quickCss]);

  // Cerrar con Escape + bloquear scroll del body mientras está abierto.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  // Al cerrar el editor sin guardar, quita la vista previa (vuelve al tema real).
  useEffect(() => {
    if (!open) clearQuickCssPreview();
  }, [open]);

  // Números de línea sincronizados con el contenido.
  const lineCount = useMemo(() => Math.max(code.split("\n").length, 1), [code]);
  const lineNumbers = useMemo(
    () => Array.from({ length: lineCount }, (_, i) => i + 1).join("\n"),
    [lineCount],
  );

  // Mantiene el gutter alineado al hacer scroll en el textarea.
  function syncScroll() {
    if (gutterRef.current && textareaRef.current) {
      gutterRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  // Vista previa en vivo al escribir (no persiste hasta Guardar).
  function handleChange(value: string) {
    setCode(value);
    applyQuickCssPreview(value);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const res = await setQuickCss({ quickCss: code });
      if (!res.ok) {
        setError(res.fieldErrors?.quickCss?.[0] ?? res.error);
        return;
      }
      // La BD es la fuente de verdad; quita el preview y refresca para que el
      // <style> server-side (QuickCssStyle) refleje lo guardado.
      clearQuickCssPreview();
      setCustomActive(code.trim().length > 0);
      setSaved(true);
      setTimeout(() => setSaved(false), 1600);
      router.refresh();
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const res = await clearQuickCss();
      if (!res.ok) {
        setError(res.error);
        return;
      }
      clearQuickCssPreview();
      setCode(DEFAULT_QUICK_CSS);
      setCustomActive(false);
      router.refresh();
    });
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      textareaRef.current?.select();
    }
  }

  // Inserta 2 espacios al tabular (mejor DX en un editor de código).
  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Tab") {
      e.preventDefault();
      const el = e.currentTarget;
      const start = el.selectionStart;
      const end = el.selectionEnd;
      const next = code.slice(0, start) + "  " + code.slice(end);
      handleChange(next);
      requestAnimationFrame(() => {
        el.selectionStart = el.selectionEnd = start + 2;
      });
    }
  }

  const editorFont = {
    fontFamily: "var(--font-jetbrains-mono), monospace",
    fontSize: "13px",
    lineHeight: "1.6rem",
  } as const;

  return (
    <>
      {/* Tarjeta / botón de acción rápida */}
      <button
        onClick={() => setOpen(true)}
        className="w-full text-left flex items-center gap-4 p-4 bg-surface-container-low rounded-lg border border-surface-variant hover:border-primary/50 hover:bg-surface-variant transition-colors group"
      >
        <div className="shrink-0 w-11 h-11 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary">
          <Icon name="palette" filled />
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-body-lg font-body-lg text-on-surface font-medium flex items-center gap-2">
            Personalización LifeTracker
            {customActive && (
              <span className="text-label-caps font-label-caps uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                Tema activo
              </span>
            )}
          </h4>
          <p className="text-body-sm font-body-sm text-on-surface-variant">
            Editor QuickCSS: cambia colores, fuentes, glass y efectos de toda la
            app.
          </p>
        </div>
        <Icon
          name="code"
          className="text-on-surface-variant group-hover:text-primary group-hover:scale-110 transition-all shrink-0"
        />
      </button>

      {open &&
        mounted &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Editor QuickCSS"
          >
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/75 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />

            {/* Panel: pantalla completa en móvil, panel grande centrado en desktop.
                Usa dvh para respetar el teclado virtual en móvil. */}
            <div
              className="relative flex flex-col w-full h-full sm:h-[92vh] sm:max-w-6xl sm:rounded-2xl bg-surface-container sm:border border-outline-variant shadow-[0px_20px_60px_rgba(0,0,0,0.6)] overflow-hidden"
              style={{
                animation: "quickcssIn 0.15s ease-out",
                height: "100dvh",
                maxHeight: "100dvh",
              }}
            >
              {/* Header */}
              <div className="flex items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-outline-variant shrink-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/30 flex items-center justify-center text-primary shrink-0">
                    <Icon name="palette" filled className="text-[20px]" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="text-body-lg sm:text-headline-md font-headline-md text-on-surface truncate">
                      Personalización · QuickCSS
                    </h3>
                    <p className="hidden sm:block text-body-sm text-on-surface-variant truncate">
                      Edita las variables o pega el tema que quieras. Se guarda
                      en tu navegador.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="text-on-surface-variant hover:text-primary transition-colors shrink-0 p-1 -m-1"
                  aria-label="Cerrar"
                >
                  <Icon name="close" />
                </button>
              </div>

              {/* Editor: gutter de líneas + textarea monoespaciado (ocupa todo el alto) */}
              <div className="flex-1 min-h-0 flex bg-surface-container-lowest">
                <div
                  ref={gutterRef}
                  aria-hidden
                  className="no-scrollbar select-none overflow-hidden py-4 pl-2 sm:pl-4 pr-2 text-right text-on-surface-variant/40 border-r border-outline-variant"
                  style={{
                    ...editorFont,
                    whiteSpace: "pre",
                    minWidth: "2.5rem",
                  }}
                >
                  {lineNumbers}
                </div>
                <textarea
                  ref={textareaRef}
                  value={code}
                  onChange={(e) => handleChange(e.target.value)}
                  onScroll={syncScroll}
                  onKeyDown={handleKeyDown}
                  spellCheck={false}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  wrap="off"
                  className="flex-1 resize-none bg-transparent py-4 px-3 sm:px-4 text-on-surface outline-none"
                  style={{
                    ...editorFont,
                    whiteSpace: "pre",
                    overflow: "auto",
                    tabSize: 2,
                    // Evita el zoom automático de iOS al enfocar y desactiva
                    // gestos que interfieren con el scroll del código.
                    WebkitTextSizeAdjust: "100%",
                    touchAction: "pan-x pan-y",
                  }}
                />
              </div>

              {/* Footer con acciones: apiladas/anchas en móvil, en fila en desktop */}
              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-3 px-4 sm:px-5 py-3 sm:py-4 border-t border-outline-variant shrink-0">
                {error && (
                  <p className="w-full text-error text-body-sm sm:order-last sm:w-auto">
                    {error}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="w-full sm:w-auto justify-center py-2.5 px-5 rounded-xl bg-primary text-on-primary font-medium hover:opacity-90 transition-opacity disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <Icon name={saved ? "check" : "save"} className="text-[18px]" />
                  {isPending ? "Guardando..." : saved ? "Aplicado" : "Guardar y Aplicar"}
                </button>
                <div className="flex gap-2 sm:gap-3">
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="flex-1 sm:flex-none justify-center py-2.5 px-4 rounded-xl border border-outline-variant text-on-surface hover:bg-surface-variant transition-colors flex items-center gap-2"
                  >
                    <Icon
                      name={copied ? "check" : "content_copy"}
                      className="text-[18px]"
                    />
                    <span>{copied ? "Copiado" : "Copiar"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    disabled={isPending}
                    className="flex-1 sm:flex-none justify-center py-2.5 px-4 rounded-xl border border-transparent text-error hover:bg-error-container/10 hover:border-error/40 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Icon name="restart_alt" className="text-[18px]" />
                    <span>Restablecer</span>
                  </button>
                </div>
                <p className="ml-auto hidden md:block text-body-sm text-on-surface-variant/70">
                  Tip: pega el bloque en tu IA y pídele un tema completo.
                </p>
              </div>
            </div>

            <style>{`@keyframes quickcssIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }`}</style>
          </div>,
          document.body,
        )}
    </>
  );
}
