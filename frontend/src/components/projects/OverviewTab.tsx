// Onglet Vue d'ensemble d'un projet (Power of 10 R4)
import { ProjectStockLink, StockItem, TimeEntry, ActivityLog, Attachment } from "../../types";
import StockLinksSection from "../stock/StockLinksSection";
import TimeSection from "./TimeSection";
import ActivitySection from "./ActivitySection";
import AttachmentsSection from "./AttachmentsSection";
import CommentsSection from "./CommentsSection";

interface Props {
    pid: string;
    links: ProjectStockLink[];
    stockItems: StockItem[];
    stockNames: Record<string, string>;
    timeEntries: TimeEntry[];
    totalHours: number;
    logs: ActivityLog[];
    attachments: Attachment[];
    onChanged: () => void;
}

export default function OverviewTab(props: Props): JSX.Element {
    const { pid, links, stockItems, stockNames, timeEntries, totalHours, logs, attachments, onChanged } = props;
    return (
        <div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
                <StockLinksSection projectId={pid} links={links} stockItems={stockItems} stockNames={stockNames} onChanged={onChanged} />
                <TimeSection projectId={pid} entries={timeEntries} totalHours={totalHours} onChanged={onChanged} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginTop: "1.25rem" }}>
                <AttachmentsSection projectId={pid} attachments={attachments} onChanged={onChanged} />
                <ActivitySection logs={logs} />
            </div>
            <CommentsSection projectId={pid} milestoneId={null} />
        </div>
    );
}
