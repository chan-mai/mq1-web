export const useToast = () => {
  const toasts = useState<ToastMessage[]>('toasts', () => []);

  const addToast = (type: ToastType, options: ToastOptions) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const duration = options.duration ?? 5000;

    const toast: ToastMessage = {
      id,
      type,
      title: options.title,
      message: options.message,
      duration,
    };

    toasts.value.push(toast);

    // 自動削除
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  };

  const removeToast = (id: string) => {
    toasts.value = toasts.value.filter((t) => t.id !== id);
  };

  const success = (options: ToastOptions) => {
    return addToast('success', options);
  };

  const error = (options: ToastOptions) => {
    return addToast('error', options);
  };

  const info = (options: ToastOptions) => {
    return addToast('info', options);
  };

  const warning = (options: ToastOptions) => {
    return addToast('warning', options);
  };

  const clear = () => {
    toasts.value = [];
  };

  return {
    success,
    error,
    info,
    warning,
    clear,
  };
};
