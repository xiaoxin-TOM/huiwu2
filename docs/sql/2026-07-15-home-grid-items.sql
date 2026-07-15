CREATE TABLE IF NOT EXISTS "HomeGridItem" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "href" TEXT NOT NULL,
  "icon" TEXT NOT NULL DEFAULT 'file',
  "size" TEXT NOT NULL DEFAULT 'SMALL',
  "backgroundImage" TEXT,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "isVisible" BOOLEAN NOT NULL DEFAULT true,
  CONSTRAINT "HomeGridItem_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "HomeGridItem_meetingId_fkey"
    FOREIGN KEY ("meetingId") REFERENCES "Meeting"("id")
    ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "HomeGridItem_meetingId_sortOrder_idx"
  ON "HomeGridItem"("meetingId", "sortOrder");
