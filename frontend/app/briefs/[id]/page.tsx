import React from "react";
import { fetchBriefById, fetchBriefMatches } from "@/lib/client/api";
import { BriefDetailView } from "@/components/brief-detail-view";

export function generateStaticParams() {
  return [
    { id: "brief-monsoon" },
    { id: "brief-zomato-midnight" },
    { id: "brief-nykaa-monsoon" },
    { id: "brief-tata-2030" },
    { id: "brief-boat-cyber" },
  ];
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function BriefDetailPage({ params }: PageProps) {
  const { id } = await params;
  const brief = await fetchBriefById(id);
  const matches = await fetchBriefMatches(id);

  return (
    <BriefDetailView
      initialBrief={brief}
      initialMatches={matches}
      briefId={id}
    />
  );
}
