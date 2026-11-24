// Service Time Tracking - suivi du temps par projet
import { getPrisma } from "../config/prisma";
import { assert } from "../utils/power10";

interface TimeEntryInput {
    hours: number;
    description: string;
    date: Date;
}

export async function addTimeEntry(
    projectId: string,
    userId: string,
    input: TimeEntryInput
): Promise<{ id: string; hours: number; description: string; date: Date }> {
    assert(projectId.length > 0, "addTimeEntry: invalid projectId");
    assert(userId.length > 0, "addTimeEntry: invalid userId");
    assert(input.hours > 0 && input.hours <= 24, "addTimeEntry: hours must be 0-24");
    const prisma = getPrisma();
    const entry = await prisma.timeEntry.create({
        data: {
            projectId,
            userId,
            hours: input.hours,
            description: input.description,
            date: input.date,
        },
    });
    return { id: entry.id, hours: entry.hours, description: entry.description, date: entry.date };
}

export async function getProjectTimeEntries(projectId: string): Promise<Array<{
    id: string; userId: string; userName: string; hours: number; description: string; date: Date;
}>> {
    assert(projectId.length > 0, "getProjectTimeEntries: invalid projectId");
    const prisma = getPrisma();
    const entries = await prisma.timeEntry.findMany({
        where: { projectId },
        include: { user: { select: { name: true } } },
        orderBy: { date: "desc" },
        take: 500,
    });
    return entries.map((e) => ({
        id: e.id,
        userId: e.userId,
        userName: e.user.name,
        hours: e.hours,
        description: e.description,
        date: e.date,
    }));
}

export async function getTotalHoursByProject(projectId: string): Promise<number> {
    assert(projectId.length > 0, "getTotalHoursByProject: invalid projectId");
    const prisma = getPrisma();
    const result = await prisma.timeEntry.aggregate({
        where: { projectId },
        _sum: { hours: true },
    });
    return result._sum.hours ?? 0;
}
