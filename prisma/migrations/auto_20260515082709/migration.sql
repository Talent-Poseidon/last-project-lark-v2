-- CreateTable
CREATE TABLE "KamusItem" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "behavioralIndicators" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,
    "updatedBy" TEXT,

    CONSTRAINT "KamusItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "KamusEvent" (
    "id" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "itemsCount" INTEGER NOT NULL DEFAULT 0,
    "payload" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "KamusEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandarJabatan" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "level" TEXT NOT NULL,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StandarJabatan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StandarJabatanItem" (
    "id" TEXT NOT NULL,
    "standarId" TEXT NOT NULL,
    "kamusItemId" TEXT NOT NULL,
    "expectedLevel" INTEGER NOT NULL,

    CONSTRAINT "StandarJabatanItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Scenario" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description" TEXT,
    "duration" INTEGER NOT NULL DEFAULT 0,
    "instruction" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScenarioItem" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "kamusItemId" TEXT NOT NULL,

    CONSTRAINT "ScenarioItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "KamusItem_code_key" ON "KamusItem"("code");

-- CreateIndex
CREATE UNIQUE INDEX "StandarJabatan_name_key" ON "StandarJabatan"("name");

-- CreateIndex
CREATE UNIQUE INDEX "StandarJabatanItem_standarId_kamusItemId_key" ON "StandarJabatanItem"("standarId", "kamusItemId");

-- CreateIndex
CREATE UNIQUE INDEX "Scenario_name_key" ON "Scenario"("name");

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioItem_scenarioId_kamusItemId_key" ON "ScenarioItem"("scenarioId", "kamusItemId");

-- AddForeignKey
ALTER TABLE "StandarJabatanItem" ADD CONSTRAINT "StandarJabatanItem_standarId_fkey" FOREIGN KEY ("standarId") REFERENCES "StandarJabatan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StandarJabatanItem" ADD CONSTRAINT "StandarJabatanItem_kamusItemId_fkey" FOREIGN KEY ("kamusItemId") REFERENCES "KamusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_scenarioId_fkey" FOREIGN KEY ("scenarioId") REFERENCES "Scenario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScenarioItem" ADD CONSTRAINT "ScenarioItem_kamusItemId_fkey" FOREIGN KEY ("kamusItemId") REFERENCES "KamusItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

