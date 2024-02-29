-- AlterTable
ALTER TABLE `Player` ADD COLUMN `hasStyleInstruction` BOOLEAN NULL,
    ADD COLUMN `isSpeaker` BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE `Session` ADD COLUMN `gameMode` INTEGER NULL;
