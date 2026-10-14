import { z } from "zod";
export const AspectRatioSchema = z.enum(["9:16", "1:1", "4:5", "16:9", "21:9"]);
export const ContentTypeSchema = z.enum(["video", "animation", "still", "audio", "mixed"]);
export const SpecializationSchema = z.enum([
    "ai_film",
    "ai_animation",
    "product_ads",
    "motion_graphics",
    "fashion_lookbook",
    "music_video",
    "social_shorts",
    "brand_mascots",
]);
export const UsageSchema = z.enum([
    "organic_social",
    "paid_social",
    "broadcast_ctv",
    "out_of_home",
    "website",
    "internal_only",
]);
export const VerifyStateSchema = z.enum([
    "unverified",
    "self_declared",
    "evidence_attached",
    "reviewed",
]);
export const CreatorToolSchema = z.object({
    toolId: z.string(),
    name: z.string(),
    kind: z.enum(["video", "image", "audio", "llm", "editing", "upscale"]),
    usedFor: z.string(),
    verify: VerifyStateSchema,
});
export const WorkflowStepSchema = z.object({
    order: z.number().int().positive(),
    tool: z.string(),
    what: z.string(),
    imageUrl: z.string().optional(),
});
export const TakeSchema = z.object({
    n: z.number().int().positive(),
    imageUrl: z.string(),
    tool: z.string(),
    prompt: z.string().optional(),
    whatChanged: z.string(),
});
export const PortfolioPieceSchema = z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    contentType: ContentTypeSchema,
    aspectRatio: AspectRatioSchema,
    mediaUrl: z.string(),
    posterUrl: z.string(),
    toolsUsed: z.array(z.string()),
    takesCount: z.number().int().nonnegative(),
    keyTakes: z.array(TakeSchema),
    workflow: z.array(WorkflowStepSchema),
    hoursSpent: z.number().optional(),
    rights: z.enum(["commercial_cleared", "personal_only", "client_owned"]),
    rightsBasis: z.string().optional(),
    isSample: z.boolean(),
});
export const CreatorSchema = z.object({
    id: z.string(),
    handle: z.string(),
    displayName: z.string(),
    headline: z.string(),
    bio: z.string(),
    location: z.string().optional(),
    avatarUrl: z.string().optional(),
    specializations: z.array(SpecializationSchema),
    skills: z.array(z.string()),
    tools: z.array(CreatorToolSchema),
    contentTypes: z.array(ContentTypeSchema),
    formats: z.array(AspectRatioSchema),
    turnaroundDays: z.number().int().positive(),
    priceFromInr: z.number().int().nonnegative(),
    availability: z.enum(["open", "limited", "booked"]),
    verification: z.object({
        tools: VerifyStateSchema,
        workflow: VerifyStateSchema,
        pastWork: VerifyStateSchema,
    }),
    portfolio: z.array(PortfolioPieceSchema),
    isSample: z.boolean(),
});
export const CommercialUseSchema = z.object({
    uses: z.array(UsageSchema),
    territory: z.enum(["india", "apac", "global"]),
    termMonths: z.number().int().positive(),
    exclusivity: z.enum(["none", "category", "full"]),
    rightsTransfer: z.enum(["license", "buyout"]),
    aiDisclosure: z.enum(["must_label", "creator_discretion"]),
    noModelTraining: z.boolean(),
});
export const BriefSchema = z.object({
    id: z.string(),
    brandName: z.string(),
    title: z.string(),
    objective: z.string(),
    requirements: z.string(),
    contentType: ContentTypeSchema,
    styleTags: z.array(z.string()),
    referenceUrls: z.array(z.string()),
    formats: z.array(z.object({
        aspectRatio: AspectRatioSchema,
        durationSec: z.number().optional(),
    })),
    deliverablesCount: z.number().int().positive(),
    preferredTools: z.array(z.string()),
    budgetInr: z
        .object({
        min: z.number().int().nonnegative(),
        max: z.number().int().nonnegative(),
    })
        .optional(),
    deadline: z.string().optional(),
    commercialUse: CommercialUseSchema,
    status: z.enum(["draft", "open", "closed"]),
    createdAt: z.string(),
});
export const EngagementSchema = z.object({
    id: z.string(),
    briefId: z.string(),
    creatorId: z.string(),
    stage: z.enum(["invited", "proposal", "in_production", "review", "delivered", "closed"]),
    takes: z.array(z.object({
        n: z.number(),
        note: z.string(),
        mediaUrl: z.string().optional(),
        status: z.enum(["submitted", "approved", "changes_requested"]),
    })),
});
export const CommunicationStatusSchema = z.enum([
    "pending",
    "accepted",
    "declined",
    "in_production",
    "completed",
]);
export const MessageAttachmentSchema = z.object({
    type: z.enum(["take", "prompt", "brief", "link"]),
    title: z.string(),
    url: z.string().optional(),
    takeNumber: z.number().optional(),
    details: z.string().optional(),
});
export const MessageSchema = z.object({
    id: z.string(),
    threadId: z.string(),
    senderId: z.string(),
    senderName: z.string(),
    senderRole: z.enum(["brand", "creator", "admin"]),
    text: z.string(),
    attachments: z.array(MessageAttachmentSchema).optional(),
    timestamp: z.string(),
});
export const CommunicationRequestSchema = z.object({
    id: z.string(),
    fromUserId: z.string(),
    fromUserName: z.string(),
    fromUserRole: z.enum(["brand", "creator"]),
    fromCompany: z.string().optional(),
    toUserId: z.string(),
    toUserName: z.string(),
    toUserRole: z.enum(["brand", "creator"]),
    briefId: z.string().optional(),
    projectTitle: z.string(),
    proposedBudgetInr: z.number().int().positive().optional(),
    targetDeadline: z.string().optional(),
    message: z.string(),
    status: CommunicationStatusSchema,
    createdAt: z.string(),
    updatedAt: z.string(),
});
export const MessageThreadSchema = z.object({
    id: z.string(),
    requestId: z.string().optional(),
    projectTitle: z.string(),
    status: CommunicationStatusSchema,
    participants: z.array(z.object({
        id: z.string(),
        name: z.string(),
        role: z.enum(["brand", "creator", "admin"]),
        company: z.string().optional(),
        avatarUrl: z.string().optional(),
    })),
    budgetInr: z.number().optional(),
    lastMessage: z.string(),
    lastMessageAt: z.string(),
    unreadCount: z.record(z.string(), z.number()),
    messages: z.array(MessageSchema),
});
/**
 * Security Data Sanitization: Strips out script tags, onerror/onload attributes,
 * javascript: pseudo-protocols, and dangerous HTML entities from user inputs.
 */
export function sanitizeTextInput(input) {
    if (!input || typeof input !== "string")
        return "";
    return input
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/\bon\w+\s*=\s*(['"]).*?\1/gi, "")
        .replace(/\bon\w+\s*=\s*[^>\s]+/gi, "")
        .replace(/javascript:[^"'\s>]+/gi, "");
}
