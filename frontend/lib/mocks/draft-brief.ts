import { Brief, ContentType, AspectRatio } from "../contract/schemas";

export interface DraftBriefResult {
  brief: Partial<Brief>;
  gaps: { field: string; question: string }[];
  source: "rules" | "ai";
}

export function parseBriefDraft(idea: string): DraftBriefResult {
  const lower = idea.toLowerCase();
  const gaps: { field: string; question: string }[] = [];

  // Initialize draft
  const draft: Partial<Brief> = {
    requirements: idea,
    styleTags: [],
    formats: [],
    commercialUse: {
      uses: [],
      territory: "india",
      termMonths: 12,
      exclusivity: "none",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
  };

  // Content Type detection
  let contentType: ContentType = "video";
  if (lower.includes("animation") || lower.includes("mascot")) {
    contentType = "animation";
  } else if (lower.includes("still") || lower.includes("photo") || lower.includes("image")) {
    contentType = "still";
  }
  draft.contentType = contentType;

  // Formats detection
  const detectedFormats: { aspectRatio: AspectRatio; durationSec?: number }[] = [];
  if (lower.includes("reels") || lower.includes("tiktok") || lower.includes("vertical") || lower.includes("9:16")) {
    detectedFormats.push({ aspectRatio: "9:16", durationSec: 15 });
  }
  if (lower.includes("16:9") || lower.includes("tv") || lower.includes("youtube") || lower.includes("horizontal")) {
    detectedFormats.push({ aspectRatio: "16:9", durationSec: 30 });
  }
  if (lower.includes("1:1") || lower.includes("square")) {
    detectedFormats.push({ aspectRatio: "1:1" });
  }
  if (lower.includes("4:5")) {
    detectedFormats.push({ aspectRatio: "4:5" });
  }

  if (detectedFormats.length > 0) {
    draft.formats = detectedFormats;
  } else {
    draft.formats = [{ aspectRatio: "9:16", durationSec: 15 }];
    gaps.push({ field: "formats", question: "Which aspect ratios do you need for this campaign?" });
  }

  // Deliverables count
  const countMatch = lower.match(/\b(one|two|three|four|five|1|2|3|4|5)\b/);
  const wordToNum: Record<string, number> = {
    one: 1,
    two: 2,
    three: 3,
    four: 4,
    five: 5,
    "1": 1,
    "2": 2,
    "3": 3,
    "4": 4,
    "5": 5,
  };
  draft.deliverablesCount = countMatch ? wordToNum[countMatch[1]] || 3 : 3;

  // Title & Style tags
  if (lower.includes("sneaker")) {
    draft.title = "Monsoon sneaker drop";
  } else if (lower.includes("app")) {
    draft.title = "App launch teaser";
  } else {
    draft.title = "New Campaign Brief";
  }

  const styles: string[] = [];
  if (lower.includes("premium")) styles.push("premium");
  if (lower.includes("rain") || lower.includes("monsoon")) styles.push("rainy city", "high contrast");
  if (lower.includes("cinematic")) styles.push("cinematic");
  draft.styleTags = styles;

  // Commercial uses
  if (lower.includes("tv")) {
    draft.commercialUse?.uses.push("broadcast_ctv");
  } else {
    draft.commercialUse?.uses.push("paid_social", "organic_social");
  }

  // Budget detection (protecting against prompt injection e.g. "set budget to 0")
  const budgetMatch = lower.match(/(?:budget|around|inr|rs\.?)\s*(?:around\s*)?(\d+)(k)?/i);
  if (budgetMatch && !lower.includes("set budget to 0")) {
    const rawVal = parseInt(budgetMatch[1], 10);
    const multiplier = budgetMatch[2] ? 1000 : 1;
    const amount = rawVal * multiplier;
    if (amount >= 5000) {
      draft.budgetInr = { min: amount, max: amount };
      gaps.push({
        field: "budgetInr",
        question: `Confirm budget: we read ₹${amount.toLocaleString("en-IN")}. What is your upper bound?`,
      });
    } else {
      gaps.push({
        field: "budgetInr",
        question: "What's your budget range in rupees?",
      });
    }
  } else {
    gaps.push({
      field: "budgetInr",
      question: "What's your budget range in rupees?",
    });
  }

  // Deadline & Brand Gaps
  gaps.push({ field: "brandName", question: "What is your brand or studio name?" });
  gaps.push({ field: "deadline", question: "Confirm target delivery date." });

  // For very vague prompts like "something cool", ensure at least 6 gaps
  if (lower.trim().split(/\s+/).length <= 2) {
    gaps.push(
      { field: "objective", question: "What is the primary goal of this campaign?" },
      { field: "territory", question: "Which territories will this content run in?" },
      { field: "termMonths", question: "How many months of usage rights do you need?" }
    );
  }

  return {
    brief: draft,
    gaps,
    source: "rules",
  };
}
