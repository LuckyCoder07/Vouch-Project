import toast, { Toaster } from 'react-hot-toast';

export { Toaster };

export function useToast() {
  return {
    success: (msg) => toast.success(msg),
    error:   (msg) => toast.error(msg),
    warning: (msg) => toast(msg, { icon: '⚠️' }),
    info:    (msg) => toast(msg, { icon: 'ℹ️' }),
    promise: toast.promise,
  };
}
