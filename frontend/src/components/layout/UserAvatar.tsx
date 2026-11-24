// Avatar utilisateur (initiales colorées) (Power of 10 R4)
interface Props {
    name: string;
    color: string;
}

export default function UserAvatar({ name, color }: Props): JSX.Element {
    return (
        <div style={{
            width: "28px", height: "28px", borderRadius: "7px", flexShrink: 0,
            background: "var(--surface-3)", border: "1px solid var(--border-light)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-mono)", fontSize: "0.68rem", fontWeight: 700, color,
        }}>
            {name.slice(0, 2).toUpperCase()}
        </div>
    );
}
