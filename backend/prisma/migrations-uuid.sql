-- Migration: IDs int autoincrement -> text (UUID gérés par Prisma côté client)
-- Préserve les données existantes (cast ::text, ex "1" -> "1")
BEGIN;

-- 1. Drop de toutes les FK (recréées à la fin)
DO $$
DECLARE r record;
BEGIN
    FOR r IN
        SELECT conname, conrelid::regclass AS tbl
        FROM pg_constraint
        WHERE contype = 'f' AND connamespace = 'public'::regnamespace
    LOOP
        EXECUTE format('ALTER TABLE %s DROP CONSTRAINT %I', r.tbl, r.conname);
    END LOOP;
END $$;

-- 2. Cast int -> text des PK et FK
ALTER TABLE "User"         ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE "Project"      ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "createdById" TYPE text USING "createdById"::text;
ALTER TABLE "ProjectCollaborator" ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;
ALTER TABLE "StockItem"    ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE "ProjectStock" ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "stockItemId" TYPE text USING "stockItemId"::text;
ALTER TABLE "StockMovement" ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "stockItemId" TYPE text USING "stockItemId"::text,
                           ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;
ALTER TABLE "Milestone"    ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "projectId" TYPE text USING "projectId"::text;
ALTER TABLE "MilestoneStock" ALTER COLUMN "milestoneId" TYPE text USING "milestoneId"::text,
                           ALTER COLUMN "stockItemId" TYPE text USING "stockItemId"::text;
ALTER TABLE "Attachment"   ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "uploadedBy" TYPE text USING "uploadedBy"::text;
ALTER TABLE "ActivityLog"  ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;
ALTER TABLE "TimeEntry"    ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "projectId" TYPE text USING "projectId"::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;
ALTER TABLE "Config"       ALTER COLUMN id TYPE text USING id::text;
ALTER TABLE "RefreshToken" ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;
ALTER TABLE "Notification" ALTER COLUMN id TYPE text USING id::text,
                           ALTER COLUMN "userId" TYPE text USING "userId"::text;

-- 3. PK: drop et recréation sur colonnes désormais text
ALTER TABLE "User" DROP CONSTRAINT "User_pkey";             ALTER TABLE "User" ADD PRIMARY KEY (id);
ALTER TABLE "Project" DROP CONSTRAINT "Project_pkey";       ALTER TABLE "Project" ADD PRIMARY KEY (id);
ALTER TABLE "ProjectCollaborator" DROP CONSTRAINT "ProjectCollaborator_pkey";
ALTER TABLE "ProjectCollaborator" ADD PRIMARY KEY ("projectId", "userId");
ALTER TABLE "StockItem" DROP CONSTRAINT "StockItem_pkey";   ALTER TABLE "StockItem" ADD PRIMARY KEY (id);
ALTER TABLE "ProjectStock" DROP CONSTRAINT "ProjectStock_pkey";
ALTER TABLE "ProjectStock" ADD PRIMARY KEY ("projectId", "stockItemId");
ALTER TABLE "StockMovement" DROP CONSTRAINT "StockMovement_pkey"; ALTER TABLE "StockMovement" ADD PRIMARY KEY (id);
ALTER TABLE "Milestone" DROP CONSTRAINT "Milestone_pkey";   ALTER TABLE "Milestone" ADD PRIMARY KEY (id);
ALTER TABLE "MilestoneStock" DROP CONSTRAINT "MilestoneStock_pkey";
ALTER TABLE "MilestoneStock" ADD PRIMARY KEY ("milestoneId", "stockItemId");
ALTER TABLE "Attachment" DROP CONSTRAINT "Attachment_pkey"; ALTER TABLE "Attachment" ADD PRIMARY KEY (id);
ALTER TABLE "ActivityLog" DROP CONSTRAINT "ActivityLog_pkey"; ALTER TABLE "ActivityLog" ADD PRIMARY KEY (id);
ALTER TABLE "TimeEntry" DROP CONSTRAINT "TimeEntry_pkey";   ALTER TABLE "TimeEntry" ADD PRIMARY KEY (id);
ALTER TABLE "Config" DROP CONSTRAINT "Config_pkey";         ALTER TABLE "Config" ADD PRIMARY KEY (id);
ALTER TABLE "RefreshToken" DROP CONSTRAINT "RefreshToken_pkey"; ALTER TABLE "RefreshToken" ADD PRIMARY KEY (id);
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_pkey"; ALTER TABLE "Notification" ADD PRIMARY KEY (id);

-- 4. Recréation des FK
ALTER TABLE "Project" ADD CONSTRAINT "Project_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"(id);
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
ALTER TABLE "ProjectCollaborator" ADD CONSTRAINT "ProjectCollaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "ProjectStock" ADD CONSTRAINT "ProjectStock_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
ALTER TABLE "ProjectStock" ADD CONSTRAINT "ProjectStock_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"(id) ON DELETE CASCADE;
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"(id);
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id);
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "Milestone" ADD CONSTRAINT "Milestone_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
ALTER TABLE "MilestoneStock" ADD CONSTRAINT "MilestoneStock_milestoneId_fkey" FOREIGN KEY ("milestoneId") REFERENCES "Milestone"(id) ON DELETE CASCADE;
ALTER TABLE "MilestoneStock" ADD CONSTRAINT "MilestoneStock_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "StockItem"(id) ON DELETE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "User"(id);
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE SET NULL;
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"(id) ON DELETE CASCADE;
ALTER TABLE "TimeEntry" ADD CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id);
ALTER TABLE "RefreshToken" ADD CONSTRAINT "RefreshToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE;

COMMIT;
