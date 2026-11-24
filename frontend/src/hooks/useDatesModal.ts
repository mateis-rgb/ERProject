// Hook d'affichage du modal de dates projet (Power of 10 R4)
import { useEffect, useState } from "react";

export function useDatesModal(hasDates: boolean): {
    showDatesModal: boolean;
    openDatesModal: () => void;
    closeDatesModal: () => void;
} {
    const [open, setOpen] = useState(false);
    useEffect(() => {
        if (!hasDates) setOpen(true);
        else setOpen(false);
    }, [hasDates]);
    return {
        showDatesModal: !hasDates && open,
        openDatesModal: () => setOpen(true),
        closeDatesModal: () => setOpen(false),
    };
}
