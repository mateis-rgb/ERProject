// Service PDF - export projet en style néo-brutaliste thème clair - Power of 10 : fonctions < 60 lignes, boucles bornées
import PDFDocument from "pdfkit";
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";

export type ExportMode = "complet" | "previsionnel" | "definitif";
const MAX_ROWS = 500; // borne des tableaux exportés (R2)

// Palette thème clair de l'app (index.css [data-theme="light"])
const INK = "#000000";
const ACCENT = "#ffd600";
const PAPER = "#f7f0dd";
const CARD = "#fffdf4";
const MARGIN = 50;
const PAGE_W = 595.28;
const PAGE_H = 841.89;
const BOTTOM = PAGE_H - 70;
const ROW_H = 16;

type Doc = PDFKit.PDFDocument;

interface ProjectData {
    project: NonNullable<Awaited<ReturnType<typeof loadProject>>>;
    milestones: Awaited<ReturnType<typeof loadMilestones>>;
    links: Awaited<ReturnType<typeof loadLinks>>;
    movements: Awaited<ReturnType<typeof loadMovements>>;
    timeEntries: Awaited<ReturnType<typeof loadTime>>;
    filesCount: number;
    filesBytes: number;
}

async function loadProject(id: string) {
    return getPrisma().project.findUnique({
        where: { id },
        include: { createdBy: true, collaborators: { include: { user: true } } },
    });
}

async function loadMilestones(projectId: string) {
    return getPrisma().milestone.findMany({ where: { projectId }, orderBy: { startDate: "asc" }, take: MAX_ROWS });
}

async function loadLinks(projectId: string) {
    return getPrisma().projectStock.findMany({
        where: { projectId }, include: { stockItem: true, milestone: true }, take: MAX_ROWS,
    });
}

async function loadMovements(projectId: string) {
    return getPrisma().stockMovement.findMany({
        where: { projectId }, include: { stockItem: true, user: true }, orderBy: { date: "desc" }, take: MAX_ROWS,
    });
}

async function loadTime(projectId: string) {
    return getPrisma().timeEntry.findMany({
        where: { projectId }, include: { user: true }, orderBy: { date: "desc" }, take: MAX_ROWS,
    });
}

async function loadFiles(projectId: string): Promise<{ count: number; bytes: number }> {
    const agg = await getPrisma().attachment.aggregate({
        where: { projectId, isFolder: false }, _sum: { fileSize: true }, _count: true,
    });
    return { count: agg._count, bytes: agg._sum.fileSize ?? 0 };
}

export async function collectProjectData(projectId: string): Promise<ProjectData | null> {
    const project = await loadProject(projectId);
    if (project === null) return null;
    const [milestones, links, movements, timeEntries, files] = await Promise.all([
        loadMilestones(projectId), loadLinks(projectId), loadMovements(projectId), loadTime(projectId), loadFiles(projectId),
    ]);
    return { project, milestones, links, movements, timeEntries, filesCount: files.count, filesBytes: files.bytes };
}

let pageNum = 1;

// Fond papier + pied de page, appelé à chaque nouvelle page (doc.y restauré : sinon boucle d'addPage)
function pageBg(doc: Doc): void {
    const savedY = doc.y;
    doc.rect(0, 0, PAGE_W, PAGE_H).fillColor(PAPER).fill();
    doc.fillColor(INK).font("Helvetica").fontSize(8)
        .text(`ERProjects — export PDF — page ${pageNum}`, MARGIN, 778, { width: PAGE_W - 2 * MARGIN, align: "center" });
    doc.y = savedY;
}

function fmtDate(d: Date | null): string {
    if (d === null) return "—";
    return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function fmtSize(bytes: number): string {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} Ko`;
    return `${(bytes / 1048576).toFixed(2)} Mo`;
}

// Bloc néo-brutaliste : ombre dure noire décalée + fond + bordure (offset = épaisseur de l'ombre)
function shadowBlock(doc: Doc, x: number, y: number, w: number, h: number, fill: string, off: number): void {
    doc.rect(x + off, y + off, w, h).fillColor(INK).fill();
    doc.rect(x, y, w, h).fillColor(fill).fill();
    doc.lineWidth(2).strokeColor(INK).rect(x, y, w, h).stroke();
}

// Bloc titre jaune bordé noir avec ombre dure
function titleBlock(doc: Doc, text: string): void {
    const y = doc.y;
    const w = PAGE_W - 2 * MARGIN;
    shadowBlock(doc, MARGIN, y, w, 42, ACCENT, 7);
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(18)
        .text(text, MARGIN + 10, y + 11, { width: w - 20, lineBreak: false, ellipsis: true });
    doc.y = y + 54;
}

// Titre de section + barre noire épaisse dessous
function h2(doc: Doc, text: string): void {
    if (doc.y > BOTTOM - 50) doc.addPage();
    const y = doc.y + 12;
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(13)
        .text(text, MARGIN, y, { width: PAGE_W - 2 * MARGIN, lineBreak: false, ellipsis: true });
    doc.rect(MARGIN, y + 19, PAGE_W - 2 * MARGIN, 3).fillColor(INK).fill();
    doc.y = y + 30;
}

function kv(doc: Doc, key: string, value: string): void {
    if (doc.y > BOTTOM - 16) doc.addPage();
    doc.fillColor(INK).font("Helvetica-Bold").fontSize(10)
        .text(`${key} : `, MARGIN, doc.y, { continued: true }); // PAS de lineBreak:false ici (boucle infinie de pages sinon)
    doc.font("Helvetica").text(value);
    doc.moveDown(0.25);
}

// Tableau néo-brutaliste : header jaune répété à chaque page, bordures noires, lignes alternées
function table(doc: Doc, headers: string[], rows: string[][], widths: number[]): void {
    const total = widths.reduce((a, b) => a + b, 0);
    const cell = (c: string, x: number, y: number, w: number, bold: boolean): void => {
        doc.fillColor(INK).font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(8.5)
            .text(c, x + 4, y + 4, { width: Math.max(10, w - 8), lineBreak: false, ellipsis: true });
    };
    const drawHeader = (): void => {
        if (doc.y > BOTTOM - ROW_H) doc.addPage();
        const y = doc.y;
        shadowBlock(doc, MARGIN, y, total, ROW_H, ACCENT, 4);
        let x = MARGIN;
        headers.forEach((h, i) => { cell(h, x, y, widths[i] ?? 0, true); x += widths[i] ?? 0; });
        doc.y = y + ROW_H;
    };
    const drawRow = (cells: string[], alt: boolean, isLast: boolean): void => {
        if (doc.y > BOTTOM - ROW_H) { doc.addPage(); drawHeader(); }
        const y = doc.y;
        if (isLast) doc.rect(MARGIN + 4, y + 4, total, ROW_H).fillColor(INK).fill(); // ombre AVANT la ligne (sinon elle recouvre le texte)
        if (alt) doc.rect(MARGIN, y, total, ROW_H).fillColor(CARD).fill();
        doc.lineWidth(1).strokeColor(INK).rect(MARGIN, y, total, ROW_H).stroke();
        let x = MARGIN;
        cells.forEach((c, i) => { cell(c, x, y, widths[i] ?? 0, false); x += widths[i] ?? 0; });
        doc.y = y + ROW_H;
    };
    drawHeader();
    const bounded = rows.slice(0, MAX_ROWS); // boucle bornée (R2)
    bounded.forEach((r, i) => drawRow(r, i % 2 === 1, i === bounded.length - 1));
    doc.moveDown(0.6);
}

function writeHeader(doc: Doc, d: ProjectData): void {
    const p = d.project;
    kv(doc, "Statut", p.status);
    kv(doc, "Client", p.client !== "" ? p.client : "—");
    kv(doc, "Type", p.type !== "" ? p.type : "—");
    kv(doc, "Dates", `${fmtDate(p.startDate)} -> ${fmtDate(p.endDate)}`);
    kv(doc, "Budget", p.budget !== null ? `${p.budget} EUR` : "—");
    kv(doc, "Tags", p.tags.length > 0 ? p.tags.join(", ") : "—");
    kv(doc, "Cree par", p.createdBy.name);
    kv(doc, "Collaborateurs", p.collaborators.map((c) => c.user.name).join(", ") || "—");
    kv(doc, "Fichiers drive", `${d.filesCount} (${fmtSize(d.filesBytes)})`);
    if (p.description !== "") kv(doc, "Description", p.description);
    doc.fillColor(INK).font("Helvetica").fontSize(8)
        .text(`Export genere le ${new Date().toLocaleString("fr-FR")}`, MARGIN, doc.y + 6, { width: PAGE_W - 2 * MARGIN, align: "right" });
    doc.moveDown(0.5);
}

const MAX_MONTHS = 240; // borne de l'axe mensuel (R2)

// Mini diagramme de Gantt : une barre par jalon, échelle adaptée à la plage totale (lisible quelle que soit la durée)
function drawGanttAxis(doc: Doc, t0: number, t1: number, barX: number, barW: number, y: number): void {
    doc.lineWidth(1).strokeColor(INK).moveTo(barX, y).lineTo(barX + barW, y).stroke();
    const pct = (t: number): number => (t - t0) / (t1 - t0);
    const d0 = new Date(t0);
    let t = new Date(d0.getFullYear(), d0.getMonth(), 1).getTime();
    for (let i = 0; i < MAX_MONTHS && t <= t1; i++) {
        const x = barX + pct(t) * barW;
        doc.moveTo(x, y).lineTo(x, y + 4).stroke();
        const dt = new Date(t);
        doc.fillColor(INK).font("Helvetica").fontSize(6.5)
            .text(`${String(dt.getMonth() + 1).padStart(2, "0")}/${dt.getFullYear()}`, x + 2, y + 5, { lineBreak: false });
        t = new Date(dt.getFullYear(), dt.getMonth() + 1, 1).getTime();
    }
    doc.y = y + 16;
}

function drawGantt(doc: Doc, milestones: { startDate: Date; endDate: Date; name: string; color: string }[],
    pStart: Date | null, pEnd: Date | null): void {
    if (milestones.length === 0) return;
    h2(doc, "DIAGRAMME DE GANTT");
    let t0 = Math.min(...milestones.map((m) => m.startDate.getTime()));
    let t1 = Math.max(...milestones.map((m) => m.endDate.getTime()));
    if (pStart !== null) t0 = Math.min(t0, pStart.getTime());
    if (pEnd !== null) t1 = Math.max(t1, pEnd.getTime());
    if (t1 <= t0) t1 = t0 + 86400000;
    const labelW = 150;
    const barX = MARGIN + labelW;
    const barW = PAGE_W - 2 * MARGIN - labelW;
    const pct = (t: number): number => (t - t0) / (t1 - t0);
    milestones.slice(0, MAX_ROWS).forEach((m) => { // boucle bornée (R2)
        if (doc.y > BOTTOM - 20) doc.addPage();
        const y = doc.y;
        doc.fillColor(INK).font("Helvetica").fontSize(8.5)
            .text(m.name, MARGIN, y + 3, { width: labelW - 8, lineBreak: false, ellipsis: true });
        const x0 = pct(m.startDate.getTime());
        const x1 = pct(m.endDate.getTime());
        const w = Math.max(3, (x1 - x0) * barW);
        doc.rect(barX + x0 * barW, y + 2, w, 11).fillColor(m.color).fill();
        doc.lineWidth(1).strokeColor(INK).rect(barX + x0 * barW, y + 2, w, 11).stroke();
        doc.y = y + 17;
    });
    if (doc.y > BOTTOM - 30) doc.addPage();
    drawGanttAxis(doc, t0, t1, barX, barW, doc.y);
    doc.moveDown(0.4);
}

function writeForecast(doc: Doc, d: ProjectData): void {
    drawGantt(doc, d.milestones, d.project.startDate, d.project.endDate);
    h2(doc, "PLANNING PREVISIONNEL (JALONS)");
    const rows = d.milestones.map((m) => [
        m.name,
        fmtDate(m.startDate),
        fmtDate(m.endDate),
        `${Math.max(1, Math.round((m.endDate.getTime() - m.startDate.getTime()) / 86400000))} j`,
    ]);
    table(doc, ["Jalon", "Debut", "Fin", "Duree"], rows.length > 0 ? rows : [["—", "—", "—", "—"]], [210, 95, 95, 70]);
    h2(doc, "STOCK RESERVE / PREVISIONNEL");
    const rows2 = d.links.map((l) => [
        `${l.stockItem.name} (${l.stockItem.reference})`,
        l.milestone !== null ? l.milestone.name : "Projet",
        `${l.allocatedQuantity} ${l.stockItem.unit}`,
        `${l.forecastQuantity} ${l.stockItem.unit}`,
        fmtDate(l.forecastDate),
    ]);
    table(doc, ["Article", "Jalon", "Reserve", "Previsionnel", "Date prev."],
        rows2.length > 0 ? rows2 : [["—", "—", "—", "—", "—"]], [185, 110, 65, 80, 70]);
}

function writeActual(doc: Doc, d: ProjectData): void {
    h2(doc, "STOCK CONSOMME (REEL)");
    const rows = d.links.map((l) => [
        `${l.stockItem.name} (${l.stockItem.reference})`,
        l.milestone !== null ? l.milestone.name : "Projet",
        `${l.consumedQuantity} ${l.stockItem.unit}`,
        `${l.allocatedQuantity} ${l.stockItem.unit}`,
    ]);
    table(doc, ["Article", "Jalon", "Consomme", "Reserve"], rows.length > 0 ? rows : [["—", "—", "—", "—"]], [210, 140, 80, 80]);
    h2(doc, "MOUVEMENTS DE STOCK LIES AU PROJET");
    const rows2 = d.movements.map((m) => [
        fmtDate(m.date), m.type, `${m.quantity}`, m.stockItem.name, m.reason, m.user.name,
    ]);
    table(doc, ["Date", "Type", "Qte", "Article", "Motif", "Par"],
        rows2.length > 0 ? rows2 : [["—", "—", "—", "—", "—", "—"]], [70, 75, 45, 120, 100, 85]);
    h2(doc, "TEMPS PASSE");
    const total = d.timeEntries.reduce((s, e) => s + e.hours, 0);
    kv(doc, "Total", `${total.toFixed(1)} h`);
    const rows3 = d.timeEntries.map((e) => [fmtDate(e.date), e.user.name, `${e.hours} h`, e.description]);
    table(doc, ["Date", "Par", "Heures", "Description"], rows3.length > 0 ? rows3 : [["—", "—", "—", "—"]], [80, 110, 60, 260]);
}

export async function generateProjectPdf(projectId: string, mode: ExportMode): Promise<Buffer | null> {
    assert(projectId.length > 0, "generateProjectPdf: invalid id");
    const data = await collectProjectData(projectId);
    if (data === null) return null;
    pageNum = 1;
    const doc = new PDFDocument({ size: "A4", margin: MARGIN });
    doc.on("pageAdded", () => { pageNum += 1; pageBg(doc); });
    const chunks: Buffer[] = [];
    doc.on("data", (c: Buffer) => { chunks.push(c); });
    pageBg(doc);
    titleBlock(doc, `PROJET : ${data.project.name}`);
    writeHeader(doc, data);
    if (mode === "previsionnel" || mode === "complet") writeForecast(doc, data);
    if (mode === "definitif" || mode === "complet") writeActual(doc, data);
    doc.end();
    return new Promise<Buffer>((resolve, reject) => {
        doc.on("end", () => resolve(Buffer.concat(chunks)));
        doc.on("error", reject);
    });
}
