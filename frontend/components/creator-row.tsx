import React from "react";
import { Creator } from "@/lib/contract/schemas";
import { GigCard } from "./gig-card";

interface CreatorRowProps {
  creator: Creator;
}

/**
 * CreatorRow adapter mapping to the new Instagram meets Fiverr GigCard unit
 */
export function CreatorRow({ creator }: CreatorRowProps) {
  return <GigCard creator={creator} />;
}
