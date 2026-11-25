// State + actions d'un toast local (section settings) - mutualise le pattern useState<ToastData|null> (Power of 10 R4)
import { useCallback, useState } from "react";
import type { ToastData } from "../components/ui/Toast";

export function useLocalToast(): { toast: ToastData | null; showToast: (t: ToastData) => void; dismissToast: () => void } {
    const [toast, setToast] = useState<ToastData | null>(null);
    const showToast = useCallback((t: ToastData): void => setToast(t), []);
    const dismissToast = useCallback((): void => setToast(null), []);
    return { toast, showToast, dismissToast };
}
