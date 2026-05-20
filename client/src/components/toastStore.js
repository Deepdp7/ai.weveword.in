export function useToast() {
  const addToast = (message, type) => {
    console.log(`[Toast ${type}]: ${message}`);
  };
  const clearToasts = () => {};

  return { addToast, clearToasts };
}
