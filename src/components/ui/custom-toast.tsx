import { ReactNode, useCallback, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import clsx from "clsx";
import { Button } from "@/components/ui/button-1";

const CloseIcon = ({ className }: { className?: string }) => (
  <svg
    className={className}
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12.5 3.5L3.5 12.5M3.5 3.5L12.5 12.5"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const UndoIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 16 16"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M2 6H10C12.2091 6 14 7.79086 14 10C14 12.2091 12.2091 14 10 14H6M2 6L5 3M2 6L5 9"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

type ToastType = "message" | "success" | "warning" | "error";

type Toast = {
  id: number;
  text: string | ReactNode;
  measuredHeight?: number;
  timeout?: ReturnType<typeof setTimeout>;
  remaining?: number;
  start?: number;
  pause?: () => void;
  resume?: () => void;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
  type: ToastType;
};

let root: ReturnType<typeof createRoot> | null = null;
let toastId = 0;

const toastStore = {
  toasts: [] as Toast[],
  listeners: new Set<() => void>(),

  add(
    text: string | ReactNode,
    type: ToastType,
    preserve?: boolean,
    action?: string,
    onAction?: () => void,
    onUndoAction?: () => void
  ) {
    const id = toastId++;
    const t: Toast = { id, text, preserve, action, onAction, onUndoAction, type };

    if (!t.preserve) {
      t.remaining = 3000;
      t.start = Date.now();
      const close = () => {
        this.toasts = this.toasts.filter((x) => x.id !== id);
        this.notify();
      };
      t.timeout = setTimeout(close, t.remaining);
      t.pause = () => {
        if (!t.timeout) return;
        clearTimeout(t.timeout);
        t.timeout = undefined;
        t.remaining! -= Date.now() - t.start!;
      };
      t.resume = () => {
        if (t.timeout) return;
        t.start = Date.now();
        t.timeout = setTimeout(close, t.remaining);
      };
    }

    this.toasts.push(t);
    this.notify();
  },

  remove(id: number) {
    this.toasts = this.toasts.filter((t) => t.id !== id);
    this.notify();
  },

  subscribe(listener: () => void) {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  },

  notify() {
    this.listeners.forEach((fn) => fn());
  },
};

const typeStyles: Record<ToastType, string> = {
  message: "bg-background-100 text-gray-1000 shadow-menu border border-gray-alpha-400",
  success: "bg-background-100 text-gray-1000 shadow-menu border border-gray-alpha-400",
  warning: "bg-amber-800 text-black shadow-menu",
  error: "bg-red-800 text-white shadow-menu",
};

const typeIndicator: Record<ToastType, ReactNode> = {
  message: null,
  success: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M13.5 4.5L6 12L2.5 8.5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  warning: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M8 5V8.5M8 11H8.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path
        d="M10 6L6 10M6 6L10 10"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  ),
};

const ToastContainer = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [shownIds, setShownIds] = useState<number[]>([]);
  const [isHovered, setIsHovered] = useState(false);

  const measureRef = (toast: Toast) => (node: HTMLDivElement | null) => {
    if (node && toast.measuredHeight == null) {
      toast.measuredHeight = node.getBoundingClientRect().height;
      toastStore.notify();
    }
  };

  useEffect(() => {
    setToasts([...toastStore.toasts]);
    return toastStore.subscribe(() => {
      setToasts([...toastStore.toasts]);
    });
  }, []);

  useEffect(() => {
    const unseen = toasts.filter((t) => !shownIds.includes(t.id)).map((t) => t.id);
    if (unseen.length > 0) {
      requestAnimationFrame(() => {
        setShownIds((prev) => [...prev, ...unseen]);
      });
    }
  }, [toasts]);

  const lastVisibleCount = 3;
  const lastVisibleStart = Math.max(0, toasts.length - lastVisibleCount);

  const getFinalTransform = (index: number, length: number) => {
    if (index === length - 1) return "none";
    let translateY = 0;
    for (let i = length - 1; i > index; i--) {
      translateY += (toasts[i]?.measuredHeight || 63) + 10;
    }
    return `translateY(-${translateY}px)`;
  };

  const handleMouseEnter = () => {
    setIsHovered(true);
    toastStore.toasts.forEach((t) => t.pause?.());
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    toastStore.toasts.forEach((t) => t.resume?.());
  };

  const visibleToasts = toasts.slice(lastVisibleStart);
  const containerHeight = visibleToasts.reduce((acc, t) => acc + (t.measuredHeight ?? 63), 0);

  return (
    <div
      className="fixed bottom-4 right-4 z-[9999]"
      style={{ perspective: "800px" }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <div
        className="relative transition-all duration-300"
        style={{
          height: visibleToasts.reduce((acc, t) => acc + (t.measuredHeight ?? 63), 0) +
            Math.max(0, visibleToasts.length - 1) * 10,
          width: 356,
        }}
      >
        {toasts.map((toast, index) => {
          const isVisible = index >= lastVisibleStart;

          return (
            <div
              key={toast.id}
              className={clsx(
                "absolute bottom-0 left-0 right-0 transition-all duration-300",
                !isVisible && "opacity-0 pointer-events-none",
                isVisible && shownIds.includes(toast.id) ? "opacity-100" : "opacity-0 translate-y-2"
              )}
              style={{
                transform: getFinalTransform(index, toasts.length),
                transformOrigin: "bottom center",
              }}
            >
              <div
                ref={measureRef(toast)}
                className={clsx(
                  "rounded-xl p-3 w-full",
                  typeStyles[toast.type]
                )}
              >
                <div className="flex items-start gap-2">
                  {typeIndicator[toast.type] && (
                    <span className="mt-0.5 shrink-0">{typeIndicator[toast.type]}</span>
                  )}
                  <span className="flex-1 text-sm leading-relaxed">{toast.text}</span>
                  {!toast.action && (
                    <div className="flex items-center gap-1 shrink-0">
                      {toast.onUndoAction && (
                        <button
                          className="p-1 rounded hover:bg-gray-alpha-200 transition-colors"
                          onClick={() => {
                            toast.onUndoAction?.();
                            toastStore.remove(toast.id);
                          }}
                        >
                          <UndoIcon />
                        </button>
                      )}
                      <button
                        className="p-1 rounded hover:bg-gray-alpha-200 transition-colors"
                        onClick={() => toastStore.remove(toast.id)}
                      >
                        <CloseIcon className="opacity-50 hover:opacity-100" />
                      </button>
                    </div>
                  )}
                </div>

                {toast.action && (
                  <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-alpha-200">
                    <Button
                      type="tertiary"
                      size="small"
                      onClick={() => toastStore.remove(toast.id)}
                    >
                      Dismiss
                    </Button>
                    <Button
                      type="secondary"
                      size="small"
                      onClick={() => {
                        toast.onAction?.();
                        toastStore.remove(toast.id);
                      }}
                    >
                      {toast.action}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const mountContainer = () => {
  if (root) return;
  const el = document.createElement("div");
  document.body.appendChild(el);
  root = createRoot(el);
  root.render(<ToastContainer />);
};

interface Message {
  text: string | ReactNode;
  preserve?: boolean;
  action?: string;
  onAction?: () => void;
  onUndoAction?: () => void;
}

export const useToasts = () => {
  return {
    message: useCallback(({ text, preserve, action, onAction, onUndoAction }: Message) => {
      mountContainer();
      toastStore.add(text, "message", preserve, action, onAction, onUndoAction);
    }, []),
    success: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "success");
    }, []),
    warning: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "warning");
    }, []),
    error: useCallback((text: string) => {
      mountContainer();
      toastStore.add(text, "error");
    }, []),
  };
};

// Standalone toast API (can be called outside React components, like sonner's toast)
export const toast = {
  success: (text: string) => {
    mountContainer();
    toastStore.add(text, "success");
  },
  error: (text: string) => {
    mountContainer();
    toastStore.add(text, "error");
  },
  warning: (text: string) => {
    mountContainer();
    toastStore.add(text, "warning");
  },
  info: (text: string) => {
    mountContainer();
    toastStore.add(text, "message");
  },
  message: (opts: Message) => {
    mountContainer();
    toastStore.add(opts.text, "message", opts.preserve, opts.action, opts.onAction, opts.onUndoAction);
  },
};
