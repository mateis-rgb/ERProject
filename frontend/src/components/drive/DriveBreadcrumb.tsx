// Fil d'Ariane du drive (Power of 10 R4)
interface Crumb { id: string | null; name: string }

interface Props {
    path: Crumb[];
    onGo: (i: number) => void;
}

export default function DriveBreadcrumb({ path, onGo }: Props): JSX.Element {
    return (
        <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap", margin: "0.75rem 0", alignItems: "center" }}>
            {path.map((c, i) => (
                <span key={c.id ?? "root"} style={{ display: "flex", gap: "0.25rem", alignItems: "center" }}>
                    {i > 0 && <span className="mono" style={{ color: "var(--muted)" }}>/</span>}
                    <button className={i === path.length - 1 ? "btn" : "btn-ghost"}
                        style={{ padding: "0.2rem 0.6rem", fontSize: "0.75rem" }}
                        onClick={() => onGo(i)}>
                        {c.name}
                    </button>
                </span>
            ))}
        </div>
    );
}
