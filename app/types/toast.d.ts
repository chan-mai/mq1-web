type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  title?: string;
  message?: string;
  duration?: number;
}

interface ToastMessage {
  id: string;
  type: ToastType;
  title?: string;
  message?: string;
  duration: number;
}
