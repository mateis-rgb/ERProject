// Tirette de redimensionnement d'un jalon (extrémité gauche/droite) (Power of 10 R4)
import { ResizeSide } from "./useResizeDrag";

interface Props {
    side: ResizeSide;
    active: boolean;
    onMouseDown: (e: React.MouseEvent, side: ResizeSide) => void;
}

export default function ResizeHandle({ side, active, onMouseDown }: Props): JSX.Element {
    const isStart = side === "start";
    return (
        <span
            onMouseDown={(ev) => onMouseDown(ev, side)}
            title={isStart ? "Déplacer le début" : "Déplacer la fin"}
            style={{
                position: "absolute", [isStart ? "left" : "right"]: "-2px", top: 0, bottom: 0, width: "10px",
                cursor: "ew-resize",
                background: active ? "rgba(0,0,0,0.35)" : "transparent",
                [isStart ? "borderLeft" : "borderRight"]: "2px solid var(--ink)",
            }}
        />
    );
}
