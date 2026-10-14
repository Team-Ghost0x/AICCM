import { Brief, Creator, MatchResult } from "../contract/schemas";

const DEFAULT_NOW = new Date("2026-10-13T08:00:00Z");

export function scoreMatch(
  brief: Brief,
  creator: Creator,
  referenceNow: Date = DEFAULT_NOW
): MatchResult {
  const reasons: string[] = [];
  let score = 40;

  // 1. Preferred Tool Overlap (Crucial criteria for creative briefs)
  const preferredTools = brief.preferredTools || [];
  const matchingTools = creator.tools.filter((t) =>
    preferredTools.some(
      (pt) =>
        pt.toLowerCase() === t.toolId.toLowerCase() ||
        pt.toLowerCase() === t.name.toLowerCase()
    )
  );

  if (matchingTools.length > 0) {
    score += 25;
    const toolNames = matchingTools.map((t) => t.name).join(", ");
    reasons.push(`Experienced with preferred tool: ${toolNames}.`);
  }

  // 2. Format Overlap
  const briefFormats = brief.formats.map((f) => f.aspectRatio);
  const matchingFormats = creator.formats.filter((f) => briefFormats.includes(f));

  if (matchingFormats.length > 0) {
    score += matchingFormats.length * 15;
    reasons.push(
      `Works in ${matchingFormats.join(" and ")}, covering your required format(s).`
    );
  } else {
    score -= 25;
  }

  // 3. Content Type Fit
  if (creator.contentTypes.includes(brief.contentType)) {
    score += 15;
    reasons.push(`Specialises in ${brief.contentType} production.`);
  } else {
    score -= 15;
  }

  // 4. Turnaround vs Deadline
  if (brief.deadline) {
    const deadlineDate = new Date(brief.deadline);
    const diffDays = Math.ceil(
      (deadlineDate.getTime() - referenceNow.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays > 0 && creator.turnaroundDays <= diffDays) {
      score += 15;
      reasons.push(
        `Delivers in ${creator.turnaroundDays} days, fitting your ${diffDays}-day deadline.`
      );
    } else if (diffDays > 0 && creator.turnaroundDays > diffDays) {
      score -= 15;
    }
  }

  // 5. Budget Check
  if (brief.budgetInr) {
    if (creator.priceFromInr <= brief.budgetInr.max) {
      score += 10;
      reasons.push(
        `Starting rate ₹${creator.priceFromInr.toLocaleString("en-IN")} fits your ₹${brief.budgetInr.max.toLocaleString("en-IN")} budget.`
      );
    } else {
      score -= 25;
      // Do NOT claim budget fit when over max rate
    }
  }

  // 6. Availability
  if (creator.availability === "open") {
    score += 10;
  } else if (creator.availability === "booked") {
    score -= 30;
  }

  const boundedScore = Math.max(10, Math.min(98, score));

  return {
    creator,
    score: boundedScore,
    reasons,
  };
}

export function rankCreatorsForBrief(
  brief: Brief,
  creators: Creator[],
  referenceNow: Date = DEFAULT_NOW
): MatchResult[] {
  const matches = creators.map((c) => scoreMatch(brief, c, referenceNow));

  matches.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return a.creator.id.localeCompare(b.creator.id);
  });

  return matches;
}
