"use client";

import React, { useState } from "react";
import { playClickSound } from "@/lib/client/audio";
import { PlusIcon } from "./icons";
import { useRouter } from "next/navigation";

export interface StoryCreator {
  id: string;
  name: string;
  shortName: string;
  handle: string;
  role: string;
  ringClass: string;
  bgGradient: string;
}

export const STORY_CREATORS: StoryCreator[] = [
  {
    id: "creator-mira",
    name: "Mira Okonkwo",
    shortName: "Mira",
    handle: "mira-okonkwo",
    role: "Beauty & Fragrance",
    ringClass: "ring-gradient-teal",
    bgGradient: "from-cyan-400 to-teal-500",
  },
  {
    id: "creator-arjun",
    name: "Arjun Patel",
    shortName: "Arjun",
    handle: "arjun-patel",
    role: "Social shorts",
    ringClass: "ring-gradient-amber",
    bgGradient: "from-orange-400 to-rose-500",
  },
  {
    id: "creator-sofia",
    name: "Sofia Chen",
    shortName: "Sofia",
    handle: "sofia-chen",
    role: "AI animation",
    ringClass: "ring-gradient-purple",
    bgGradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "creator-dev",
    name: "Dev Verma",
    shortName: "Dev",
    handle: "dev-verma",
    role: "Fashion lookbooks",
    ringClass: "ring-gradient-pink",
    bgGradient: "from-purple-900 to-rose-950",
  },
  {
    id: "creator-kabir",
    name: "Kabir Nair",
    shortName: "Kabir",
    handle: "kabir-nair",
    role: "Generative Cinema",
    ringClass: "ring-gradient-teal",
    bgGradient: "from-amber-400 via-emerald-400 to-teal-500",
  },
];

interface CreatorStoriesProps {
  selectedId?: string;
  onSelect?: (creatorId: string) => void;
  className?: string;
}

export function CreatorStories({
  selectedId = "creator-mira",
  onSelect,
  className = "",
}: CreatorStoriesProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState(selectedId);

  const handleSelect = (creator: StoryCreator) => {
    playClickSound();
    setActiveId(creator.id);
    if (onSelect) {
      onSelect(creator.id);
    } else {
      router.push(`/creators/${creator.handle}`);
    }
  };

  const handleYourTake = () => {
    playClickSound();
    router.push("/studio");
  };

  return (
    <div className={`w-full overflow-x-auto py-4 px-2 scrollbar-none select-none ${className}`}>
      <div className="flex items-center gap-5 sm:gap-7 min-w-max pb-1">
        {/* + Your take Circle Button */}
        <button
          type="button"
          onClick={handleYourTake}
          className="flex flex-col items-center gap-2 flex-shrink-0 cursor-pointer group min-w-[70px] p-1"
          aria-label="Upload or submit your take"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-full border-2 border-dashed border-[var(--link-aa)] hover:border-[var(--link-aa-hover)] flex items-center justify-center bg-[var(--surface)] group-hover:scale-105 transition-all shadow-xs">
            <span className="text-[var(--link-aa)] font-bold text-xl">
              <PlusIcon size={20} />
            </span>
          </div>
          <span className="text-xs font-medium text-[var(--text)] text-center whitespace-nowrap">
            Your take
          </span>
        </button>

        {/* Creator Story Avatars */}
        {STORY_CREATORS.map((creator) => {
          const isSelected = activeId === creator.id;
          return (
            <button
              key={creator.id}
              type="button"
              onClick={() => handleSelect(creator)}
              aria-label={`${creator.name}, new work`}
              className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer group min-w-[70px] p-1 select-none"
            >
              <div
                className={`w-14 h-14 sm:w-16 sm:h-16 aspect-square rounded-full p-[3px] transition-all duration-150 group-hover:scale-105 ${
                  isSelected ? "scale-105 ring-2 ring-[var(--text)] ring-offset-2 ring-offset-[var(--surface)]" : ""
                }`}
                style={{ background: "var(--gradient-ring)" }}
              >
                <div className="w-full h-full rounded-full p-[3px] bg-[var(--surface)] flex items-center justify-center">
                  <div
                    className={`w-full h-full rounded-full bg-gradient-to-tr ${creator.bgGradient} flex items-center justify-center font-bold text-xs sm:text-sm text-white shadow-inner`}
                  >
                    {creator.shortName.charAt(0)}
                  </div>
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--text)] text-center whitespace-nowrap">
                {creator.shortName}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
