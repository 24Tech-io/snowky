-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "vector";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'AGENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "SessionStatus" AS ENUM ('ACTIVE', 'WAITING_AGENT', 'WITH_AGENT', 'RESOLVED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "MessageRole" AS ENUM ('USER', 'ASSISTANT', 'AGENT', 'SYSTEM');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "role" "UserRole" NOT NULL DEFAULT 'USER',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Project" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "website" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ownerId" TEXT NOT NULL,

    CONSTRAINT "Project_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProjectSettings" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "widgetColor" TEXT NOT NULL DEFAULT '#6366f1',
    "widgetPosition" TEXT NOT NULL DEFAULT 'bottom-right',
    "widgetButtonText" TEXT NOT NULL DEFAULT 'Chat with us',
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Hello! How can I help you today?',
    "offlineMessage" TEXT NOT NULL DEFAULT 'We''re currently offline. Leave a message!',
    "aiEnabled" BOOLEAN NOT NULL DEFAULT true,
    "aiModel" TEXT NOT NULL DEFAULT 'gemini-1.5-flash',
    "aiTemperature" DOUBLE PRECISION NOT NULL DEFAULT 0.7,
    "aiMaxTokens" INTEGER NOT NULL DEFAULT 1024,
    "ragTopK" INTEGER NOT NULL DEFAULT 5,
    "ragThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.65,
    "ragMaxContext" INTEGER NOT NULL DEFAULT 4000,
    "ragUseHybridSearch" BOOLEAN NOT NULL DEFAULT true,
    "memoryEnabled" BOOLEAN NOT NULL DEFAULT true,
    "memorySummarizationEnabled" BOOLEAN NOT NULL DEFAULT true,
    "memoryMaxMessages" INTEGER NOT NULL DEFAULT 20,
    "memoryCrossSessionEnabled" BOOLEAN NOT NULL DEFAULT false,
    "salesModeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "salesAggressiveness" TEXT NOT NULL DEFAULT 'subtle',
    "leadCaptureEnabled" BOOLEAN NOT NULL DEFAULT true,
    "leadCaptureFields" TEXT[] DEFAULT ARRAY['email']::TEXT[],
    "leadCaptureTiming" TEXT NOT NULL DEFAULT 'natural',
    "urgencyTacticsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "competitorComparisonEnabled" BOOLEAN NOT NULL DEFAULT false,
    "upsellEnabled" BOOLEAN NOT NULL DEFAULT false,
    "crossSellEnabled" BOOLEAN NOT NULL DEFAULT false,
    "responseStyle" TEXT NOT NULL DEFAULT 'friendly',
    "useEmojis" BOOLEAN NOT NULL DEFAULT true,
    "personalizedGreetings" BOOLEAN NOT NULL DEFAULT true,
    "proactiveEngagement" BOOLEAN NOT NULL DEFAULT false,
    "proactiveDelaySeconds" INTEGER NOT NULL DEFAULT 30,
    "proactiveMessage" TEXT NOT NULL DEFAULT 'Hi there! Need any help?',
    "strictKnowledgeBase" BOOLEAN NOT NULL DEFAULT true,
    "allowGeneralKnowledge" BOOLEAN NOT NULL DEFAULT false,
    "autoHandoffEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoHandoffThreshold" DOUBLE PRECISION NOT NULL DEFAULT 0.5,
    "sensitiveTopicDetection" BOOLEAN NOT NULL DEFAULT true,
    "sensitiveTopicActions" TEXT NOT NULL DEFAULT 'handoff',
    "blockOffTopicQuestions" BOOLEAN NOT NULL DEFAULT false,
    "offTopicResponse" TEXT NOT NULL DEFAULT 'I can only help with questions about our products and services.',
    "collectFeedback" BOOLEAN NOT NULL DEFAULT true,
    "trackUnansweredQuestions" BOOLEAN NOT NULL DEFAULT true,
    "sessionRecording" BOOLEAN NOT NULL DEFAULT true,
    "systemPrompt" TEXT,
    "salesPromptAddition" TEXT,
    "companyContext" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "DocumentStatus" NOT NULL DEFAULT 'PENDING',
    "chunkCount" INTEGER NOT NULL DEFAULT 0,
    "tokenCount" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "embeddingStatus" TEXT NOT NULL DEFAULT 'pending',
    "embeddingError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "processedAt" TIMESTAMP(3),

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chunk" (
    "id" TEXT NOT NULL,

    CONSTRAINT "Chunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Embedding" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "vector" vector(768),
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Embedding_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentChunk" (
    "id" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "chunkIndex" INTEGER NOT NULL,
    "embedding" vector(768),
    "tokenCount" INTEGER NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentChunk_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WidgetSession" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "contactId" TEXT,
    "status" "SessionStatus" NOT NULL DEFAULT 'ACTIVE',
    "isAiMode" BOOLEAN NOT NULL DEFAULT true,
    "assignedTo" TEXT,
    "currentUrl" TEXT,
    "userAgent" TEXT,
    "ipAddress" TEXT,
    "history" JSONB NOT NULL DEFAULT '[]',
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastActiveAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),
    "rating" INTEGER,
    "feedback" TEXT,
    "resolved" BOOLEAN,

    CONSTRAINT "WidgetSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatMessage" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "role" "MessageRole" NOT NULL,
    "content" TEXT NOT NULL,
    "sources" JSONB,
    "confidence" DOUBLE PRECISION,
    "tokensUsed" INTEGER,
    "hadContext" BOOLEAN NOT NULL DEFAULT true,
    "metadata" JSONB,
    "responseTime" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "visitorIds" TEXT[],
    "customFields" JSONB NOT NULL DEFAULT '{}',
    "attributes" JSONB,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'open',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "assigneeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Ticket_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TicketComment" (
    "id" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TicketComment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "contactId" TEXT,
    "visitorId" TEXT,
    "type" TEXT NOT NULL,
    "data" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Event_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AnalyticsEvent" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "sessionId" TEXT,
    "eventType" TEXT NOT NULL,
    "eventData" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AnalyticsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelConfig" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "config" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "ProjectSettings_projectId_key" ON "ProjectSettings"("projectId");

-- CreateIndex
CREATE INDEX "DocumentChunk_documentId_idx" ON "DocumentChunk"("documentId");

-- CreateIndex
CREATE INDEX "WidgetSession_projectId_idx" ON "WidgetSession"("projectId");

-- CreateIndex
CREATE INDEX "WidgetSession_visitorId_idx" ON "WidgetSession"("visitorId");

-- CreateIndex
CREATE INDEX "WidgetSession_status_idx" ON "WidgetSession"("status");

-- CreateIndex
CREATE INDEX "ChatMessage_sessionId_idx" ON "ChatMessage"("sessionId");

-- CreateIndex
CREATE INDEX "ChatMessage_createdAt_idx" ON "ChatMessage"("createdAt");

-- CreateIndex
CREATE INDEX "Contact_projectId_idx" ON "Contact"("projectId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_projectId_email_key" ON "Contact"("projectId", "email");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_projectId_eventType_idx" ON "AnalyticsEvent"("projectId", "eventType");

-- CreateIndex
CREATE INDEX "AnalyticsEvent_timestamp_idx" ON "AnalyticsEvent"("timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelConfig_projectId_type_key" ON "ChannelConfig"("projectId", "type");

-- AddForeignKey
ALTER TABLE "Project" ADD CONSTRAINT "Project_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectSettings" ADD CONSTRAINT "ProjectSettings_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embedding" ADD CONSTRAINT "Embedding_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentChunk" ADD CONSTRAINT "DocumentChunk_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSession" ADD CONSTRAINT "WidgetSession_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSession" ADD CONSTRAINT "WidgetSession_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WidgetSession" ADD CONSTRAINT "WidgetSession_assignedTo_fkey" FOREIGN KEY ("assignedTo") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatMessage" ADD CONSTRAINT "ChatMessage_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "WidgetSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Ticket" ADD CONSTRAINT "Ticket_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TicketComment" ADD CONSTRAINT "TicketComment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Event" ADD CONSTRAINT "Event_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChannelConfig" ADD CONSTRAINT "ChannelConfig_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
