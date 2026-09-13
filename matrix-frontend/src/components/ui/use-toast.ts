// Lightweight Toast helper
export interface ToastOptions {
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

export function toast(options: ToastOptions) {
  if (options.variant === "destructive") {
    console.error(`[Toast Error] ${options.title}: ${options.description}`);
  } else {
    console.log(`[Toast] ${options.title}: ${options.description}`);
  }
}

export function useToast() {
  return { toast };
}

export default toast;
