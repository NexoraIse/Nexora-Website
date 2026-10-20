DELETE FROM "content_categories"
WHERE LOWER("type") = 'notice';

DROP TABLE "notices";

DROP TYPE "NoticePriority";
