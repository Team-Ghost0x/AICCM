import { CommercialUse, Usage } from "./schemas";

const USAGE_OPTIONS: { id: Usage; label: string }[] = [
  { id: "organic_social", label: "Organic social" },
  { id: "paid_social", label: "Paid social" },
  { id: "broadcast_ctv", label: "Broadcast & CTV" },
  { id: "out_of_home", label: "Out of home" },
  { id: "website", label: "Website" },
  { id: "internal_only", label: "Internal only" },
];

export function generateRightsSummary(terms: CommercialUse): string {
  const usageLabels = terms.uses.map((u) => {
    const found = USAGE_OPTIONS.find((opt) => opt.id === u);
    return found ? found.label.toLowerCase() : u;
  });

  const usesText =
    usageLabels.length > 0 ? usageLabels.join(" and ") : "No specified channels";

  const territoryText = {
    india: "India",
    apac: "Asia-Pacific",
    global: "worldwide",
  }[terms.territory];

  const exclusivityText = {
    none: "non-exclusive",
    category: "category-exclusive",
    full: "fully exclusive",
  }[terms.exclusivity];

  const rightsText = terms.rightsTransfer === "buyout" ? "buyout" : "licence";
  const trainingText = terms.noModelTraining ? ", no model training" : "";

  return `${usesText} in ${territoryText} for ${terms.termMonths} months, ${exclusivityText} ${rightsText}${trainingText}.`;
}
