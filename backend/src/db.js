/**
 * Database store with JSON file persistence and golden seed data.
 * All monetary values are in INR (Indian Rupees) as integers.
 * Persists data to backend/data/db.json so data survives restarts.
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  initMySQLTables,
  fetchCollectionFromMySQL,
  syncBriefToMySQL,
  syncUserToMySQL,
  syncCreatorToMySQL,
  syncApplicationToMySQL,
  syncTransactionToMySQL,
  syncAuditLogToMySQL,
} from "./mysql.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const DATA_DIR = join(__dirname, "../data");
const DB_FILE = join(DATA_DIR, "db.json");

// ── Seed Users ────────────────────────────────────────────────────────────────
const PASSWORD_HASH = "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi"; // "password"

const SEED_USERS = [
  {
    id: "usr_1024",
    email: "brand@nexawave.in",
    passwordHash: PASSWORD_HASH,
    name: "NexaWave Media",
    company: "NexaWave Media",
    role: "brand",
    balanceInr: 1250000,
    credits: 500,
    createdAt: "2026-08-01T10:00:00Z",
  },
  {
    id: "client-vikram",
    email: "vikram.sharma@zomatostudios.com",
    passwordHash: PASSWORD_HASH,
    name: "Vikram Sharma",
    company: "Zomato Studios",
    role: "brand",
    balanceInr: 350000,
    credits: 300,
    createdAt: "2026-08-10T10:00:00Z",
  },
  {
    id: "client-ananya",
    email: "ananya.roy@nykaalabs.com",
    passwordHash: PASSWORD_HASH,
    name: "Ananya Roy",
    company: "Nykaa Brand Labs",
    role: "brand",
    balanceInr: 280000,
    credits: 200,
    createdAt: "2026-08-15T10:00:00Z",
  },
  {
    id: "usr_9921",
    email: "director@hyperreal.studio",
    passwordHash: PASSWORD_HASH,
    name: "Devin Vance",
    company: "Hyperreal Studio",
    role: "creator",
    balanceInr: 320000,
    credits: 250,
    createdAt: "2026-07-15T09:00:00Z",
  },
  {
    id: "creator-arjun",
    email: "arjun@retake.market",
    passwordHash: PASSWORD_HASH,
    name: "Arjun Patel",
    company: "Kinetic Motion AI Lab",
    role: "creator",
    balanceInr: 125000,
    credits: 150,
    createdAt: "2026-07-20T09:00:00Z",
  },
  {
    id: "creator-mira",
    email: "mira@retake.market",
    passwordHash: PASSWORD_HASH,
    name: "Mira Okonkwo",
    company: "Neo-Kyoto Neural Cinema",
    role: "creator",
    balanceInr: 240000,
    credits: 200,
    createdAt: "2026-07-22T09:00:00Z",
  },
  {
    id: "usr_0001",
    email: "admin@retake.design",
    passwordHash: PASSWORD_HASH,
    name: "Retake Admin",
    company: "Retake Platform",
    role: "admin",
    balanceInr: 0,
    credits: 9999,
    createdAt: "2026-01-01T00:00:00Z",
  },
];

// ── Seed Creators ─────────────────────────────────────────────────────────────
const SEED_CREATORS = [
  {
    id: "creator-mira",
    handle: "mira-okonkwo",
    displayName: "Mira Okonkwo",
    headline: "AI Director for Cyberpunk, Sci-Fi Worldbuilding & Neural Cinema",
    bio: "Builds photorealistic sci-fi cinematic sequences and cybernetic worldbuilding. Shows every take, because worldbuilding solidifies through rigorous visual iteration.",
    location: "Neo-Kyoto / Lagos",
    avatarUrl: "/media/hero/take-3.jpg",
    specializations: ["ai_film", "motion_graphics"],
    skills: ["Directing", "Prompt design", "Volumetric lighting", "ComfyUI VFX", "Color grading"],
    tools: [
      { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Hero look development and concept art", verify: "evidence_attached" },
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Gen-3 motion tests and camera tracking", verify: "evidence_attached" },
      { toolId: "kling", name: "Kling", kind: "video", usedFor: "Long cinematic tracking shots", verify: "reviewed" },
      { toolId: "magnific", name: "Magnific", kind: "upscale", usedFor: "Final 8K sharpening and texture enhancement", verify: "reviewed" },
    ],
    contentTypes: ["video", "still"],
    formats: ["4:5", "16:9"],
    turnaroundDays: 4,
    priceFromInr: 25000,
    availability: "open",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    isSample: true,
    portfolio: [
      {
        id: "piece-hero",
        title: "NEO-SHINJUKU 2099 // UNIT-07",
        description: "An 8K cinematic teaser for an upcoming cyberpunk feature film. Shows the generative iteration from atmospheric megalopolis to cybernetic android character design, holographic VFX telemetry, and final IMAX master grade.",
        contentType: "video",
        aspectRatio: "4:5",
        mediaUrl: "/media/hero/take-5.jpg",
        posterUrl: "/media/hero/take-5.jpg",
        toolsUsed: ["Runway Gen-3", "Midjourney v6", "ComfyUI", "Magnific"],
        takesCount: 23,
        hoursSpent: 18,
        rights: "commercial_cleared",
        rightsBasis: "Generated on enterprise commercial plans. Creator warrants commercial clearance and provenance telemetry for all 23 production takes.",
        isSample: true,
        keyTakes: [
          { n: 1, imageUrl: "/media/hero/take-1.jpg", tool: "Midjourney & Runway Gen-3", prompt: "Futuristic cyberpunk neo-Tokyo metropolis at twilight, towering holographic advertisements, neon rain reflections on wet asphalt", whatChanged: "Take 01: Initial megalopolis worldbuilding & atmospheric perspective pass." },
          { n: 4, imageUrl: "/media/hero/take-2.jpg", tool: "Runway Gen-3 Alpha", prompt: "Futuristic cybernetic android heroine in torrential cyberpunk rain, wireframe volumetric lighting pass", whatChanged: "Take 04: Character placement in scene with volumetric rain physics." },
          { n: 9, imageUrl: "/media/hero/take-3.jpg", tool: "Midjourney v6 + ComfyUI", prompt: "Cinematic close-up portrait of female cyborg android, wet carbon fiber and polished chrome faceplates, glowing cyan optical eyes", whatChanged: "Take 09: Locked character facial telemetry and cyan ocular glow." },
          { n: 17, imageUrl: "/media/hero/take-4.jpg", tool: "ComfyUI & Flux Schnell", prompt: "Futuristic filmmaker holographic timeline editor and neural VFX workstation, quantum waveform visuals", whatChanged: "Take 17: Integrated holographic UI telemetry layers." },
          { n: 23, imageUrl: "/media/hero/take-5.jpg", tool: "Magnific AI & Topaz 8K", prompt: "Master cinematic 8k movie still of female cybernetic operative on high-rise balcony looking across vast sprawling cyberpunk metropolis", whatChanged: "Take 23: Final 8K IMAX master grade with volumetric atmospheric depth." },
        ],
        workflow: [
          { order: 1, tool: "Midjourney v6", what: "Explored 40 environment compositions to lock the dystopian megalopolis atmosphere.", imageUrl: "/media/hero/take-1.jpg" },
          { order: 2, tool: "Runway Gen-3", what: "Simulated volumetric rain lighting passes and wireframe character blocking.", imageUrl: "/media/hero/take-2.jpg" },
          { order: 3, tool: "Magnific", what: "Synthesized optical neural telemetry and upscaled to master 8K ProRes delivery.", imageUrl: "/media/hero/take-5.jpg" },
        ],
      },
    ],
  },
  {
    id: "creator-arjun",
    handle: "arjun-patel",
    displayName: "Arjun Patel",
    headline: "Kinetic motion designer for short-form ads",
    bio: "Fast-turnaround AI animation and kinetic social cuts. Specialised in vertical hooks, fluid simulations, and high-energy pacing.",
    location: "Bengaluru, India",
    avatarUrl: "/media/pieces/piece-3.jpg",
    specializations: ["social_shorts", "motion_graphics", "product_ads"],
    skills: ["Kinetic type", "ComfyUI node workflows", "Audio syncing", "Speed ramping", "Fluid simulation"],
    tools: [
      { toolId: "kling", name: "Kling 1.5", kind: "video", usedFor: "High frame-rate motion bursts", verify: "evidence_attached" },
      { toolId: "comfyui", name: "ComfyUI", kind: "image", usedFor: "Custom LoRA stylization and control nets", verify: "evidence_attached" },
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Cinematic speed ramps", verify: "reviewed" },
    ],
    contentTypes: ["video", "animation"],
    formats: ["9:16", "1:1"],
    turnaroundDays: 2,
    priceFromInr: 12000,
    availability: "open",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    isSample: true,
    portfolio: [
      {
        id: "piece-arjun-1",
        title: "Neon Pulse Beverage Launch",
        description: "Vertical product teaser for an energy drink launch featuring high-speed liquid physics and neon caustics.",
        contentType: "video",
        aspectRatio: "9:16",
        mediaUrl: "/media/pieces/piece-3.jpg",
        posterUrl: "/media/pieces/piece-3.jpg",
        toolsUsed: ["Kling 1.5", "ComfyUI", "Topaz"],
        takesCount: 9,
        hoursSpent: 6,
        rights: "commercial_cleared",
        rightsBasis: "Commercial clearance verified via custom pipeline.",
        isSample: true,
        keyTakes: [
          { n: 1, imageUrl: "/media/hero/take-1.jpg", tool: "Midjourney v6", prompt: "Concept silhouette and lighting pass for cyber beverage can, neon ambient glow", whatChanged: "Initial geometry pass." },
          { n: 6, imageUrl: "/media/pieces/piece-2.jpg", tool: "Kling AI Motion", prompt: "High energy fluid kinetic simulation with neon refraction, ultra-crisp beverage splash", whatChanged: "Fluid simulation motion pass." },
          { n: 9, imageUrl: "/media/pieces/piece-3.jpg", tool: "Magnific AI & Topaz 8K", prompt: "Master commercial grade 8K energy drink launch keyframe, pristine liquid arcs", whatChanged: "Final color grade and commercial clearance delivery." },
        ],
        workflow: [
          { order: 1, tool: "ComfyUI", what: "Pre-rendered can geometry with Depth ControlNet.", imageUrl: "/media/hero/take-1.jpg" },
          { order: 2, tool: "Kling", what: "Added fluid simulation motion.", imageUrl: "/media/pieces/piece-2.jpg" },
          { order: 3, tool: "Topaz 8K", what: "8K upscale & commercial clearance.", imageUrl: "/media/pieces/piece-3.jpg" },
        ],
      },
    ],
  },
  {
    id: "cr_01",
    handle: "neura-cinema",
    displayName: "Neura Cinema Studio",
    headline: "Hyper-realistic commercial AI video & worldbuilding",
    bio: "Specialized in cinematic camera control and consistent identity synthesis. We craft narratives that feel physically real using cutting-edge diffusion pipelines and custom LoRA architectures.",
    location: "Bengaluru, India",
    avatarUrl: "/media/pieces/piece-1.jpg",
    specializations: ["ai_film", "product_ads"],
    skills: ["LoRA training", "camera control", "liquid dynamics", "3D compositing", "brand identity"],
    tools: [
      { toolId: "comfyui", name: "ComfyUI", kind: "video", usedFor: "Custom LoRA motion chaining", verify: "evidence_attached" },
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Cinematic motion generation", verify: "reviewed" },
      { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Concept art and storyboarding", verify: "evidence_attached" },
    ],
    contentTypes: ["video", "still", "animation"],
    formats: ["9:16", "16:9", "1:1"],
    turnaroundDays: 5,
    priceFromInr: 45000,
    availability: "open",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    portfolio: [
      {
        id: "pf_01",
        title: "Bioluminescent Desert Perfume Launch",
        description: "Luxury fragrance commercial set in a surreal glowing desert landscape using custom diffusion pipelines.",
        contentType: "video",
        aspectRatio: "16:9",
        mediaUrl: "/media/hero/take-hero-master.jpg",
        posterUrl: "/media/hero/take-hero-master.jpg",
        toolsUsed: ["ComfyUI", "Runway Gen-3", "Topaz"],
        takesCount: 7,
        keyTakes: [
          { n: 1, imageUrl: "/media/hero/take-1.jpg", tool: "Midjourney v6", prompt: "Bioluminescent desert dunes luxury perfume --ar 16:9", whatChanged: "Initial concept and color palette" },
          { n: 4, imageUrl: "/media/hero/take-2.jpg", tool: "ComfyUI", prompt: "Perfume bottle desert glow motion 4k", whatChanged: "Added liquid caustics and bottle refraction" },
          { n: 7, imageUrl: "/media/hero/take-hero-master.jpg", tool: "Runway Gen-3", whatChanged: "Final cinematic grade and motion polish" },
        ],
        workflow: [
          { order: 1, tool: "Midjourney v6", what: "Visual concept & moodboarding" },
          { order: 2, tool: "ComfyUI", what: "Custom LoRA bottle identity training" },
          { order: 3, tool: "Runway Gen-3", what: "Motion generation and camera control" },
          { order: 4, tool: "Topaz Video AI", what: "4K upscale and temporal denoising" },
        ],
        hoursSpent: 32,
        rights: "commercial_cleared",
        rightsBasis: "Full commercial license, no model training clause",
        isSample: true,
      },
    ],
    isSample: true,
  },
  {
    id: "creator-dev",
    handle: "dev-verma",
    displayName: "Dev Verma",
    headline: "Editorial fashion and luxury commercial worldbuilder",
    bio: "Directs high-concept fashion lookbooks and cinematic brand visuals. Obsessive attention to garment physics, fabric caustics, and lighting coherence.",
    location: "Mumbai, India",
    avatarUrl: "/media/pieces/piece-5.jpg",
    specializations: ["fashion_lookbook", "product_ads"],
    skills: ["Fabric simulation", "Lookbook curation", "Cinematography", "Lighting design", "Texture synthesis"],
    tools: [
      { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Editorial fashion compositions and color palettes", verify: "evidence_attached" },
      { toolId: "comfyui", name: "ComfyUI", kind: "image", usedFor: "IP-Adapter fabric texture transfer", verify: "evidence_attached" },
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Cloth flow and slow-motion drape", verify: "reviewed" },
    ],
    contentTypes: ["still", "video"],
    formats: ["4:5", "9:16", "16:9"],
    turnaroundDays: 5,
    priceFromInr: 90000,
    availability: "open",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    isSample: true,
    portfolio: [
      {
        id: "piece-dev-1",
        title: "Monsoon Silk Haute Couture",
        description: "Haute couture editorial shot under simulated downpour with iridescent wet organza silk texture diffusion.",
        contentType: "still",
        aspectRatio: "4:5",
        mediaUrl: "/media/pieces/piece-5.jpg",
        posterUrl: "/media/pieces/piece-5.jpg",
        toolsUsed: ["Midjourney v6", "ComfyUI", "Runway Gen-3"],
        takesCount: 42,
        hoursSpent: 28,
        rights: "commercial_cleared",
        rightsBasis: "Commercial clearance statement on file.",
        isSample: true,
        keyTakes: [
          { n: 1, imageUrl: "/media/pieces/piece-1.jpg", tool: "Midjourney", prompt: "Iridescent silk fabric floating in slow motion rain", whatChanged: "Initial moodboard and silk palette." },
          { n: 24, imageUrl: "/media/pieces/piece-5.jpg", tool: "ComfyUI IP-Adapter", prompt: "Haute couture luxury silk dress with realistic water droplets", whatChanged: "High-resolution fabric weave and water refraction." },
        ],
        workflow: [
          { order: 1, tool: "Midjourney", what: "Look development on iridescent wet organza silk." },
          { order: 2, tool: "ComfyUI", what: "Face and fabric texture high-res restoration." },
        ],
      },
    ],
  },
  {
    id: "creator-kabir",
    handle: "kabir-nair",
    displayName: "Kabir Nair",
    headline: "Neural VFX & Sci-Fi Cinematographer",
    bio: "Pioneering generative photoreal cinematic shots, cybernetic drone plates, and atmospheric lighting rigs for streaming series and concept films.",
    location: "Bengaluru, India",
    avatarUrl: "/media/hero/take-4.jpg",
    specializations: ["ai_film", "motion_graphics"],
    skills: ["Anamorphic composition", "ComfyUI node workflows", "Runway Gen-3", "Flux LoRAs"],
    tools: [
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Volumetric drone paths", verify: "evidence_attached" },
      { toolId: "comfyui", name: "ComfyUI", kind: "image", usedFor: "Multi-pass ControlNet character consistency", verify: "evidence_attached" },
      { toolId: "magnific", name: "Magnific", kind: "upscale", usedFor: "8K HDR mastering", verify: "reviewed" },
    ],
    contentTypes: ["video", "still"],
    formats: ["16:9", "9:16"],
    turnaroundDays: 4,
    priceFromInr: 45000,
    availability: "open",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    isSample: true,
    portfolio: [
      {
        id: "piece-kabir-1",
        title: "Malabar 2088 // Coastal Cybernetics",
        description: "Autonomous coastal hovercraft transit and holographic navigation plates over monsoon sea.",
        contentType: "video",
        aspectRatio: "16:9",
        mediaUrl: "/media/hero/take-4.jpg",
        posterUrl: "/media/hero/take-4.jpg",
        toolsUsed: ["Runway Gen-3", "ComfyUI", "Topaz"],
        takesCount: 19,
        hoursSpent: 14,
        rights: "commercial_cleared",
        rightsBasis: "Full commercial clearance warrantied.",
        isSample: true,
        keyTakes: [],
        workflow: [
          { order: 1, tool: "ComfyUI", what: "Generated hovercraft depth map." },
          { order: 2, tool: "Runway Gen-3", what: "Camera tracking over coastal water." },
        ],
      },
    ],
  },
  {
    id: "cr_02",
    handle: "synthwave-visuals",
    displayName: "Synthwave Visuals",
    headline: "Retro-futuristic motion graphics & brand identity films",
    bio: "We blend 80s aesthetic with generative AI to produce brand films that stand apart. Our motion graphic pipelines are fully custom-built in ComfyUI with proprietary style LoRAs.",
    location: "Mumbai, India",
    avatarUrl: "/media/pieces/piece-2.jpg",
    specializations: ["motion_graphics", "brand_mascots", "social_shorts"],
    skills: ["motion design", "brand identity", "3D type", "color grading", "audio sync"],
    tools: [
      { toolId: "comfyui", name: "ComfyUI", kind: "video", usedFor: "Custom style LoRAs", verify: "reviewed" },
      { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Stylized brand assets", verify: "evidence_attached" },
    ],
    contentTypes: ["animation", "still", "video"],
    formats: ["9:16", "1:1", "16:9"],
    turnaroundDays: 7,
    priceFromInr: 30000,
    availability: "limited",
    verification: { tools: "reviewed", workflow: "self_declared", pastWork: "reviewed" },
    portfolio: [
      {
        id: "piece-synth-1",
        title: "Obsidian Bloom Skincare Reel",
        description: "Botanical slow-motion floral emergence with iridescent chromatic edges.",
        contentType: "video",
        aspectRatio: "16:9",
        mediaUrl: "/media/pieces/piece-2.jpg",
        posterUrl: "/media/pieces/piece-2.jpg",
        toolsUsed: ["Runway Gen-3", "ComfyUI"],
        takesCount: 14,
        hoursSpent: 8,
        rights: "commercial_cleared",
        rightsBasis: "Commercial rights verified.",
        isSample: true,
        keyTakes: [],
        workflow: [{ order: 1, tool: "ComfyUI", what: "Procedural bloom dynamics." }],
      },
    ],
    isSample: true,
  },
  {
    id: "creator-sofia",
    handle: "sofia-chen",
    displayName: "Sofia Chen",
    headline: "Character animator and 3D mascot director",
    bio: "Brings brand characters and mascot universes to life using generative 3D diffusion and stylised animation passes.",
    location: "Taipei / Singapore",
    avatarUrl: "/media/pieces/piece-4.jpg",
    specializations: ["ai_animation", "brand_mascots"],
    skills: ["Character consistency", "Prompt rigging", "Cel-shading", "Expression sheets"],
    tools: [
      { toolId: "runway-gen3", name: "Runway Gen-3", kind: "video", usedFor: "Character turnaround", verify: "evidence_attached" },
      { toolId: "midjourney", name: "Midjourney v6", kind: "image", usedFor: "Character sheets", verify: "reviewed" },
    ],
    contentTypes: ["animation", "still"],
    formats: ["1:1", "16:9"],
    turnaroundDays: 7,
    priceFromInr: 60000,
    availability: "booked",
    verification: { tools: "reviewed", workflow: "evidence_attached", pastWork: "reviewed" },
    isSample: true,
    portfolio: [
      {
        id: "piece-sofia-1",
        title: "Kuma & Spark Animated Mascot Spot",
        description: "Animated mascot spot for a fintech app with consistent facial expressions across takes.",
        contentType: "animation",
        aspectRatio: "1:1",
        mediaUrl: "/media/pieces/piece-4.jpg",
        posterUrl: "/media/pieces/piece-4.jpg",
        toolsUsed: ["Runway Gen-3", "Midjourney v6"],
        takesCount: 31,
        hoursSpent: 22,
        rights: "client_owned",
        rightsBasis: "Exclusive commissioned IP assignment.",
        isSample: true,
        keyTakes: [],
        workflow: [{ order: 1, tool: "Midjourney v6", what: "Locked 8 character angles." }],
      },
    ],
  },
];

// ── Seed Briefs ───────────────────────────────────────────────────────────────
const SEED_BRIEFS = [
  {
    id: "br_4401",
    brandId: "usr_1024",
    brandName: "NexaWave Media",
    title: "Cyber-Tea Launch Campaign",
    objective: "Launch high-energy synthetic beverage visuals",
    requirements: "Consistent glass refraction and splash dynamics",
    contentType: "video",
    styleTags: ["cyberpunk", "macro", "liquid_dynamics"],
    referenceUrls: ["/media/pieces/piece-3.jpg"],
    formats: [{ aspectRatio: "9:16", durationSec: 15 }],
    deliverablesCount: 3,
    preferredTools: ["ComfyUI", "Runway Gen-3"],
    budgetInr: { min: 50000, max: 90000 },
    deadline: "2026-11-15",
    commercialUse: {
      uses: ["paid_social", "website"],
      territory: "india",
      termMonths: 12,
      exclusivity: "category",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
    status: "open",
    createdAt: "2026-10-10T14:00:00Z",
  },
  {
    id: "brief-zomato-midnight",
    brandId: "client-vikram",
    brandName: "Zomato Studios",
    title: "Midnight Munchies 15s Kinetic Social Video",
    objective: "Capture high-energy late night food cravings across Indian cities.",
    requirements: "2 vertical 9:16 cuts featuring sizzling street food, neon cityscapes, and rapid kinetic pacing.",
    contentType: "video",
    styleTags: ["kinetic", "high contrast", "night", "food"],
    referenceUrls: [],
    formats: [{ aspectRatio: "9:16", durationSec: 15 }],
    deliverablesCount: 2,
    preferredTools: ["Kling", "ComfyUI", "Runway Gen-3"],
    budgetInr: { min: 35000, max: 60000 },
    deadline: "2026-10-24",
    commercialUse: {
      uses: ["paid_social", "organic_social"],
      territory: "india",
      termMonths: 6,
      exclusivity: "none",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
    status: "open",
    createdAt: "2026-10-12T10:00:00Z",
  },
  {
    id: "brief-nykaa-serum",
    brandId: "client-ananya",
    brandName: "Nykaa Brand Labs",
    title: "Bioluminescent Ayurvedic Face Serum Reveal",
    objective: "Macro textures and fluid droplet dynamics of golden serum sinking into glowing skin.",
    requirements: "3 photorealistic macro texture diffusion clips. No synthetic uncanny valley faces.",
    contentType: "still",
    styleTags: ["macro", "luxury", "beauty", "photoreal"],
    referenceUrls: [],
    formats: [{ aspectRatio: "4:5", durationSec: 10 }],
    deliverablesCount: 3,
    preferredTools: ["Midjourney v6", "ComfyUI"],
    budgetInr: { min: 60000, max: 110000 },
    deadline: "2026-10-28",
    commercialUse: {
      uses: ["paid_social", "website", "organic_social"],
      territory: "india",
      termMonths: 12,
      exclusivity: "category",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
    status: "open",
    createdAt: "2026-10-12T12:00:00Z",
  },
  {
    id: "brief-monsoon",
    brandId: "usr_1024",
    brandName: "Stride Studio",
    title: "Monsoon Sneaker Drop",
    objective: "Launch rain-ready sneaker with short vertical films featuring wet pavement reflections.",
    requirements: "Three films of 15s. Rain, wet reflections, sneaker in every shot.",
    contentType: "video",
    styleTags: ["premium", "rainy city", "high contrast"],
    referenceUrls: [],
    formats: [{ aspectRatio: "9:16", durationSec: 15 }, { aspectRatio: "4:5", durationSec: 15 }],
    deliverablesCount: 3,
    preferredTools: ["Runway Gen-3", "ComfyUI"],
    budgetInr: { min: 25000, max: 45000 },
    deadline: "2026-10-30",
    commercialUse: {
      uses: ["paid_social", "website"],
      territory: "india",
      termMonths: 12,
      exclusivity: "none",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
    status: "open",
    createdAt: "2026-10-13T08:00:00Z",
  },
];

// ── Seed Communication Requests ───────────────────────────────────────────────
const SEED_COMMUNICATION_REQUESTS = [
  {
    id: "req_001",
    fromUserId: "usr_1024",
    fromUserName: "NexaWave Media",
    fromUserRole: "brand",
    fromCompany: "NexaWave Media",
    toUserId: "usr_9921",
    toUserName: "Devin Vance",
    toUserRole: "creator",
    briefId: "br_4401",
    projectTitle: "Cyber-Tea Launch Campaign",
    proposedBudgetInr: 75000,
    targetDeadline: "2026-11-01",
    message: "We loved your bioluminescent take sequence and want you for our commercial spot.",
    status: "accepted",
    threadId: "th_001",
    createdAt: "2026-10-11T09:00:00Z",
    updatedAt: "2026-10-11T11:30:00Z",
  },
  {
    id: "req-zomato-arjun",
    fromUserId: "client-vikram",
    fromUserName: "Vikram Sharma",
    fromUserRole: "brand",
    fromCompany: "Zomato Studios",
    toUserId: "creator-arjun",
    toUserName: "Arjun Patel",
    toUserRole: "creator",
    briefId: "brief-zomato-midnight",
    projectTitle: "Midnight Munchies 15s Kinetic Social Video",
    proposedBudgetInr: 45000,
    targetDeadline: "2026-10-24",
    message: "Hey Arjun! Loved your Neon Pulse work. We are launching a high-energy midnight cravings campaign for Zomato & Blinkit. Need 2 vertical cuts with fast-paced food motion.",
    status: "in_production",
    threadId: "th_002",
    createdAt: "2026-10-12T14:30:00Z",
    updatedAt: "2026-10-13T09:15:00Z",
  },
];

// ── Seed Threads ──────────────────────────────────────────────────────────────
const SEED_THREADS = [
  {
    id: "th_001",
    requestId: "req_001",
    projectTitle: "Cyber-Tea Launch Campaign",
    status: "in_production",
    participants: [
      { id: "usr_1024", name: "NexaWave Media", role: "brand", company: "NexaWave Media", avatarUrl: null },
      { id: "usr_9921", name: "Devin Vance", role: "creator", company: "Hyperreal Studio", avatarUrl: null },
    ],
    budgetInr: 75000,
    lastMessage: "Looking forward to seeing take #3!",
    lastMessageAt: "2026-10-12T16:00:00Z",
    unreadCount: { usr_1024: 0, usr_9921: 0 },
    messages: [
      {
        id: "msg_001",
        threadId: "th_001",
        senderId: "usr_1024",
        senderName: "NexaWave Media",
        senderRole: "brand",
        text: "Excited to kick off the Cyber-Tea project! Our brief is attached.",
        attachments: [{ type: "brief", title: "Cyber-Tea Brief", url: null }],
        timestamp: "2026-10-11T11:35:00Z",
      },
      {
        id: "msg_002",
        threadId: "th_001",
        senderId: "usr_9921",
        senderName: "Devin Vance",
        senderRole: "creator",
        text: "Here is iteration Take #1 with initial storyboard and prompt exploration.",
        attachments: [{ type: "take", title: "Take #1 - Storyboard", takeNumber: 1, url: "/media/hero/take-1.jpg", details: "Midjourney v6 seed 112233" }],
        timestamp: "2026-10-12T14:00:00Z",
      },
      {
        id: "msg_003",
        threadId: "th_001",
        senderId: "usr_1024",
        senderName: "NexaWave Media",
        senderRole: "brand",
        text: "Looking forward to seeing take #3!",
        attachments: [],
        timestamp: "2026-10-12T16:00:00Z",
      },
    ],
  },
  {
    id: "th_002",
    requestId: "req-zomato-arjun",
    projectTitle: "Midnight Munchies 15s Kinetic Social Video",
    status: "in_production",
    participants: [
      { id: "client-vikram", name: "Vikram Sharma", role: "brand", company: "Zomato Studios", avatarUrl: null },
      { id: "creator-arjun", name: "Arjun Patel", role: "creator", company: "Kinetic Motion AI Lab", avatarUrl: null },
    ],
    budgetInr: 45000,
    lastMessage: "I will upload the first fluid simulation pass today.",
    lastMessageAt: "2026-10-13T10:00:00Z",
    unreadCount: { "client-vikram": 0, "creator-arjun": 0 },
    messages: [
      {
        id: "msg_201",
        threadId: "th_002",
        senderId: "client-vikram",
        senderName: "Vikram Sharma",
        senderRole: "brand",
        text: "Hi Arjun, looking forward to high-energy cuts for our late-night food drop!",
        attachments: [],
        timestamp: "2026-10-12T15:00:00Z",
      },
      {
        id: "msg_202",
        threadId: "th_002",
        senderId: "creator-arjun",
        senderName: "Arjun Patel",
        senderRole: "creator",
        text: "I will upload the first fluid simulation pass today.",
        attachments: [],
        timestamp: "2026-10-13T10:00:00Z",
      },
    ],
  },
];

// ── Seed Wallet Transactions ──────────────────────────────────────────────────
const SEED_WALLET_TRANSACTIONS = [
  {
    id: "tx_8810",
    userId: "usr_1024",
    type: "deposit",
    amountInr: 1500000,
    campaign: null,
    creatorOrBrand: null,
    status: "completed",
    date: "2026-09-01T10:00:00Z",
    method: "UPI",
  },
  {
    id: "tx_8812",
    userId: "usr_1024",
    type: "escrow_lock",
    amountInr: 75000,
    campaign: "Cyber-Tea Launch Campaign",
    creatorOrBrand: "Neura Cinema Studio",
    status: "completed",
    date: "2026-10-12T14:30:00Z",
    method: "Escrow",
    briefId: "br_4401",
    creatorId: "cr_01",
    milestoneTitle: "Milestone 1: Take Iterations & Rough Cut",
    milestoneId: "ms_01",
  },
  {
    id: "tx_8813",
    userId: "usr_9921",
    type: "escrow_release",
    amountInr: 75000,
    campaign: "Cyber-Tea Launch Campaign",
    creatorOrBrand: "NexaWave Media",
    status: "completed",
    date: "2026-10-13T10:00:00Z",
    method: "Escrow",
    briefId: "br_4401",
    creatorId: "cr_01",
    milestoneId: "ms_01",
  },
];

// ── Seed Trackers ─────────────────────────────────────────────────────────────
const SEED_TRACKERS = [
  {
    id: "eng_901",
    briefId: "br_4401",
    creatorId: "cr_01",
    creatorUserId: "usr_9921",
    brandUserId: "usr_1024",
    stage: "in_production",
    takes: [
      {
        n: 1,
        note: "Initial storyboard and prompt exploration pass",
        tool: "Midjourney v6",
        prompt: "Cyber-tea glass splash cinematic macro --ar 9:16",
        mediaUrl: "/media/hero/take-1.jpg",
        status: "approved",
        feedback: "Good start, proceed with motion and liquid dynamics.",
        submittedAt: "2026-10-11T14:00:00Z",
        reviewedAt: "2026-10-11T18:00:00Z",
      },
      {
        n: 2,
        note: "Motion video generation with animated droplets and reflections",
        tool: "Runway Gen-3",
        prompt: "Glass bottle glowing in rain with splash particles",
        mediaUrl: "/media/hero/take-2.jpg",
        status: "changes_requested",
        feedback: "Droplets need to be crisper. Make neon caustics more prominent.",
        submittedAt: "2026-10-12T10:00:00Z",
        reviewedAt: "2026-10-12T15:00:00Z",
      },
      {
        n: 3,
        note: "High-resolution liquid splash with neon caustics locked",
        tool: "ComfyUI & Flux Schnell",
        prompt: "High speed splash physics around cybernetic beverage, neon ambient glow",
        mediaUrl: "/media/pieces/piece-3.jpg",
        status: "approved",
        feedback: "Approved! Proceed to master 8K color grade.",
        submittedAt: "2026-10-13T09:00:00Z",
        reviewedAt: "2026-10-13T12:00:00Z",
      },
    ],
    milestones: [
      { id: "ms_01", title: "Milestone 1: Take Iterations & Rough Cut", amountInr: 75000, status: "locked" },
      { id: "ms_02", title: "Milestone 2: Final Delivery & Master", amountInr: 25000, status: "pending" },
    ],
    createdAt: "2026-10-10T15:00:00Z",
    updatedAt: "2026-10-13T12:00:00Z",
  },
];

// ── Seed Rights Certificates ──────────────────────────────────────────────────
const SEED_RIGHTS_CERTIFICATES = [
  {
    id: "RTK-CERT-148F-2026",
    briefId: "br_4401",
    campaignTitle: "Cyber-Tea Launch Campaign",
    brandName: "NexaWave Media",
    creatorId: "cr_01",
    hash: "d5c1012d3f1d470bbdafbfcbdab82abad47a41894e876d1ed7511dbc8cad73d2",
    issuedAt: "2026-10-13T20:00:00Z",
    status: "VERIFIED_AUTHENTIC",
    commercialUse: {
      uses: ["paid_social", "website"],
      territory: "india",
      termMonths: 12,
      exclusivity: "category",
      rightsTransfer: "license",
      aiDisclosure: "must_label",
      noModelTraining: true,
    },
    spec: {
      campaignTitle: "Cyber-Tea Launch Campaign",
      brandName: "NexaWave Media",
      noModelTrainingWarranty: true,
      signatureValid: true,
    },
  },
];

// ── Seed Audit Logs ───────────────────────────────────────────────────────────
const SEED_AUDIT_LOGS = [
  {
    id: "log_001",
    timestamp: "2026-10-13T19:55:00Z",
    tag: "ESCROW",
    severity: "info",
    actor: "usr_1024",
    message: "Escrow vault locked ₹75,000 for brief br_4401",
  },
  {
    id: "log_002",
    timestamp: "2026-10-13T11:30:00Z",
    tag: "AUTH",
    severity: "info",
    actor: "usr_9921",
    message: "Creator usr_9921 authenticated via email",
  },
  {
    id: "log_003",
    timestamp: "2026-10-12T14:30:00Z",
    tag: "COMMS",
    severity: "info",
    actor: "usr_1024",
    message: "Communication request req_001 dispatched to creator cr_01",
  },
  {
    id: "log_004",
    timestamp: "2026-10-10T09:00:00Z",
    tag: "SYSTEM",
    severity: "info",
    actor: "system",
    message: "Platform initialized with database store",
  },
];

const SEED_APPLICATIONS = [
  {
    id: "app_001",
    briefId: "brief-zomato-midnight",
    briefTitle: "Midnight Munchies 15s Kinetic Social Video",
    creatorId: "creator-arjun",
    creatorHandle: "arjun-patel",
    creatorName: "Arjun Patel",
    creatorAvatar: "/media/hero/take-4.jpg",
    proposedPriceInr: 45000,
    deliveryDays: 5,
    proposalText: "I will use custom ComfyUI workflows and Flux Schnell nodes to generate dynamic, high-energy food motion with neon lighting suited for 9:16 Instagram Reels.",
    relevantTools: ["ComfyUI", "Flux Schnell", "Topaz Video AI"],
    portfolioReferences: ["neon-pulse-motion"],
    status: "accepted",
    submittedAt: "2026-10-12T15:00:00Z",
    updatedAt: "2026-10-12T18:00:00Z",
  },
  {
    id: "app_002",
    briefId: "br_4401",
    briefTitle: "Cyber-Tea Launch Commercial Video",
    creatorId: "usr_9921",
    creatorHandle: "devin-vance",
    creatorName: "Devin Vance",
    creatorAvatar: "/media/hero/take-1.jpg",
    proposedPriceInr: 70000,
    deliveryDays: 7,
    proposalText: "I specialize in bioluminescent and futuristic beverage simulations. I will deliver 3 master 4K cuts with volumetric lighting and custom sound synchronization.",
    relevantTools: ["Runway Gen-3", "Midjourney v6", "Magnific"],
    portfolioReferences: ["bioluminescent-brew"],
    status: "shortlisted",
    submittedAt: "2026-10-11T10:30:00Z",
    updatedAt: "2026-10-11T12:00:00Z",
  },
];

const SEED_VERIFICATIONS = [
  {
    id: "ver_001",
    creatorId: "creator-mira",
    creatorName: "Mira Okonkwo",
    category: "workflow_evidence",
    categoryLabel: "ComfyUI Node Graph & Take Pipeline",
    evidenceUrl: "https://retake.market/proof/mira-comfyui-pipeline.json",
    description: "Submitted node graph schema, LoRA weights configuration, and uncompressed intermediate generation takes for Basalt Parfum commercial.",
    status: "approved",
    decisionReason: "Comprehensive multi-stage ComfyUI workflow verified with raw seed logs.",
    submittedAt: "2026-09-15T10:00:00Z",
    decidedAt: "2026-09-16T14:30:00Z",
    decidedBy: "admin@retake.design",
  },
  {
    id: "ver_002",
    creatorId: "creator-arjun",
    creatorName: "Arjun Patel",
    category: "tool_evidence",
    categoryLabel: "Runway Gen-3 Alpha & Kling Commercial License",
    evidenceUrl: "https://retake.market/proof/arjun-license-receipt.pdf",
    description: "Enterprise commercial generation license proof for Runway Gen-3 and Kling video generation engine.",
    status: "approved",
    decisionReason: "Active enterprise commercial subscription verified.",
    submittedAt: "2026-09-20T11:00:00Z",
    decidedAt: "2026-09-20T16:00:00Z",
    decidedBy: "admin@retake.design",
  },
  {
    id: "ver_003",
    creatorId: "usr_9921",
    creatorName: "Devin Vance",
    category: "workflow_evidence",
    categoryLabel: "Flux.1 Cinematic Pipeline Verification",
    evidenceUrl: "https://retake.market/proof/devin-flux-pipeline.mp4",
    description: "Screen recording of prompt iteration and step guidance tuning for product commercial sequences.",
    status: "pending",
    decisionReason: null,
    submittedAt: "2026-10-12T16:00:00Z",
    decidedAt: null,
    decidedBy: null,
  },
];

const SEED_SAVED_CREATORS = [
  {
    id: "sc_001",
    brandUserId: "usr_1024",
    creatorId: "creator-mira",
    creatorHandle: "mira-okonkwo",
    savedAt: "2026-10-10T12:00:00Z",
  },
  {
    id: "sc_002",
    brandUserId: "usr_1024",
    creatorId: "creator-arjun",
    creatorHandle: "arjun-patel",
    savedAt: "2026-10-11T09:30:00Z",
  },
  {
    id: "sc_003",
    brandUserId: "client-vikram",
    creatorId: "creator-arjun",
    creatorHandle: "arjun-patel",
    savedAt: "2026-10-12T14:00:00Z",
  },
];

const SEED_REPORTS = [
  {
    id: "rep_001",
    reporterUserId: "usr_1024",
    reporterName: "NexaWave Media",
    targetType: "brief",
    targetId: "br_legacy_test",
    targetTitle: "Spam Brief Test",
    reason: "Duplicate or test brief published accidentally.",
    status: "resolved",
    resolutionNotes: "Brief archived by administrator.",
    createdAt: "2026-10-01T10:00:00Z",
    resolvedAt: "2026-10-01T11:00:00Z",
  },
];

const SEED_CATEGORIES = {
  specializations: [
    { id: "ai_film", label: "AI Filmmaking", description: "Narrative & cinematic generative films" },
    { id: "ai_animation", label: "AI Animation", description: "Character, stylized, and anime generative motion" },
    { id: "product_ads", label: "Product Advertisements", description: "Photorealistic product commercial videos" },
    { id: "motion_graphics", label: "Motion Graphics & VFX", description: "Dynamic typography, futuristic UI & particle VFX" },
    { id: "fashion_lookbook", label: "Fashion & Virtual Lookbook", description: "Haute couture & synthetic models" },
    { id: "character_design", label: "Character & Avatar Design", description: "Consistent identity generation" },
    { id: "cinematic_storytelling", label: "Cinematic Storytelling", description: "Episodic worldbuilding & sequence direction" },
    { id: "social_shorts", label: "Social Media Shorts (9:16)", description: "High-retention Reels, TikTok & Shorts" },
  ],
  tools: [
    { id: "comfyui", name: "ComfyUI", category: "Node Pipeline" },
    { id: "flux", name: "Flux.1 Schnell / Dev", category: "Image Generation" },
    { id: "runway", name: "Runway Gen-3 Alpha", category: "Video Generation" },
    { id: "kling", name: "Kling AI", category: "Video Generation" },
    { id: "midjourney", name: "Midjourney v6", category: "Image Generation" },
    { id: "topaz", name: "Topaz Video AI", category: "Upscale & Interpolation" },
    { id: "magnific", name: "Magnific AI", category: "Detail Enhancement" },
    { id: "luma", name: "Luma Dream Machine", category: "Camera Motion" },
  ],
  contentTypes: [
    { id: "video", label: "Video Commercial" },
    { id: "animation", label: "Generative Animation" },
    { id: "still", label: "Visual Stills & Key Visuals" },
    { id: "motion", label: "Motion Graphics" },
  ],
};

function cloneDeep(obj) {
  return JSON.parse(JSON.stringify(obj));
}

class PersistentDB {
  constructor() {
    this.ensureDataDir();
    this.loadOrSeed();
  }

  ensureDataDir() {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  loadOrSeed() {
    if (existsSync(DB_FILE)) {
      try {
        const raw = readFileSync(DB_FILE, "utf-8");
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.users) && Array.isArray(parsed.creators)) {
          this.users = parsed.users;
          this.creators = parsed.creators;
          this.briefs = parsed.briefs || [];
          this.communicationRequests = parsed.communicationRequests || [];
          this.threads = parsed.threads || [];
          this.transactions = parsed.transactions || [];
          this.trackers = parsed.trackers || [];
          this.rightsCertificates = parsed.rightsCertificates || [];
          this.auditLogs = parsed.auditLogs || [];
          this.applications = parsed.applications || cloneDeep(SEED_APPLICATIONS);
          this.verifications = parsed.verifications || cloneDeep(SEED_VERIFICATIONS);
          this.savedCreators = parsed.savedCreators || cloneDeep(SEED_SAVED_CREATORS);
          this.reports = parsed.reports || cloneDeep(SEED_REPORTS);
          this.categories = parsed.categories || cloneDeep(SEED_CATEGORIES);
          this.revokedTokens = new Set();
          return;
        }
      } catch (err) {
        console.warn("Could not read db.json, re-seeding database:", err.message);
      }
    }

    this.reset();
  }

  async initMySQL() {
    try {
      await initMySQLTables({
        users: this.users,
        creators: this.creators,
        briefs: this.briefs,
        communicationRequests: this.communicationRequests,
        threads: this.threads,
        transactions: this.transactions,
        trackers: this.trackers,
        rightsCertificates: this.rightsCertificates,
        auditLogs: this.auditLogs,
        applications: this.applications,
        verifications: this.verifications,
        savedCreators: this.savedCreators,
        reports: this.reports,
        categories: this.categories,
      });

      // Reload collections from MySQL
      const [u, c, b, a, tx] = await Promise.all([
        fetchCollectionFromMySQL("users").catch(() => null),
        fetchCollectionFromMySQL("creators").catch(() => null),
        fetchCollectionFromMySQL("briefs").catch(() => null),
        fetchCollectionFromMySQL("applications").catch(() => null),
        fetchCollectionFromMySQL("wallet_transactions").catch(() => null),
      ]);

      if (u && u.length) this.users = u;
      if (c && c.length) this.creators = c;
      if (b && b.length) this.briefs = b;
      if (a && a.length) this.applications = a;
      if (tx && tx.length) this.transactions = tx;

      console.log(`🐬 [MySQL] Synchronized ${this.users.length} users, ${this.creators.length} creators, ${this.briefs.length} briefs from retake_db`);
    } catch (err) {
      console.warn("⚠️ [MySQL] initMySQL warning (falling back to cached store):", err.message);
    }
  }

  save() {
    try {
      this.ensureDataDir();
      const payload = {
        users: this.users,
        creators: this.creators,
        briefs: this.briefs,
        communicationRequests: this.communicationRequests,
        threads: this.threads,
        transactions: this.transactions,
        trackers: this.trackers,
        rightsCertificates: this.rightsCertificates,
        auditLogs: this.auditLogs,
        applications: this.applications,
        verifications: this.verifications,
        savedCreators: this.savedCreators,
        reports: this.reports,
        categories: this.categories,
      };
      writeFileSync(DB_FILE, JSON.stringify(payload, null, 2), "utf-8");
    } catch (err) {
      console.error("Failed to persist database to disk:", err);
    }
  }

  // ── Async Direct MySQL Mutators ─────────────────────────────────────────────
  async addBrief(brief) {
    this.briefs.unshift(brief);
    this.save();
    try {
      await syncBriefToMySQL(brief);
    } catch (err) {
      console.error("[MySQL] Failed to sync brief to MySQL:", err.message);
    }
    return brief;
  }

  async addUser(user) {
    this.users.push(user);
    this.save();
    try {
      await syncUserToMySQL(user);
    } catch (err) {
      console.error("[MySQL] Failed to sync user to MySQL:", err.message);
    }
    return user;
  }

  async updateUser(user) {
    const idx = this.users.findIndex((u) => u.id === user.id);
    if (idx !== -1) {
      this.users[idx] = { ...this.users[idx], ...user };
    }
    this.save();
    try {
      await syncUserToMySQL(user);
    } catch (err) {
      console.error("[MySQL] Failed to sync updated user to MySQL:", err.message);
    }
    return user;
  }

  async addCreator(creator) {
    this.creators.push(creator);
    this.save();
    try {
      await syncCreatorToMySQL(creator);
    } catch (err) {
      console.error("[MySQL] Failed to sync creator to MySQL:", err.message);
    }
    return creator;
  }

  async addApplication(app) {
    this.applications.unshift(app);
    this.save();
    try {
      await syncApplicationToMySQL(app);
    } catch (err) {
      console.error("[MySQL] Failed to sync application to MySQL:", err.message);
    }
    return app;
  }

  async addTransaction(tx) {
    this.transactions.unshift(tx);
    this.save();
    try {
      await syncTransactionToMySQL(tx);
    } catch (err) {
      console.error("[MySQL] Failed to sync transaction to MySQL:", err.message);
    }
    return tx;
  }

  reset() {
    this.users = cloneDeep(SEED_USERS);
    this.creators = cloneDeep(SEED_CREATORS);
    this.briefs = cloneDeep(SEED_BRIEFS);
    this.communicationRequests = cloneDeep(SEED_COMMUNICATION_REQUESTS);
    this.threads = cloneDeep(SEED_THREADS);
    this.transactions = cloneDeep(SEED_WALLET_TRANSACTIONS);
    this.trackers = cloneDeep(SEED_TRACKERS);
    this.rightsCertificates = cloneDeep(SEED_RIGHTS_CERTIFICATES);
    this.auditLogs = cloneDeep(SEED_AUDIT_LOGS);
    this.applications = cloneDeep(SEED_APPLICATIONS);
    this.verifications = cloneDeep(SEED_VERIFICATIONS);
    this.savedCreators = cloneDeep(SEED_SAVED_CREATORS);
    this.reports = cloneDeep(SEED_REPORTS);
    this.categories = cloneDeep(SEED_CATEGORIES);
    this.revokedTokens = new Set();
    this.save();
  }

  // ── User Helpers ────────────────────────────────────────────────────────────
  findUserById(id) {
    return this.users.find((u) => u.id === id) || null;
  }

  findUserByEmail(email) {
    if (!email) return null;
    return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // ── Creator Helpers ─────────────────────────────────────────────────────────
  findCreatorByHandle(handle) {
    if (!handle) return null;
    const norm = handle.toLowerCase().replace(/\./g, "-");
    if (norm === "creator-devin" || norm === "creator-dev" || norm === "devin") {
      const dev = this.creators.find((c) => c.id === "creator-dev" || c.handle === "dev-verma");
      if (dev) return dev;
    }
    if (norm === "creator-arjun" || norm === "arjun-patel" || norm === "arjun") {
      const arjun = this.creators.find((c) => c.id === "creator-arjun" || c.handle === "arjun-patel");
      if (arjun) return arjun;
    }
    return (
      this.creators.find(
        (c) =>
          c.handle.toLowerCase() === handle.toLowerCase() ||
          c.handle.toLowerCase() === norm ||
          c.id.toLowerCase() === handle.toLowerCase()
      ) || null
    );
  }

  findCreatorById(id) {
    if (!id) return null;
    return this.creators.find((c) => c.id === id || c.handle === id) || null;
  }

  // ── Tracker Helpers ─────────────────────────────────────────────────────────
  findTrackerByBriefId(briefId) {
    return this.trackers.find((t) => t.briefId === briefId) || null;
  }

  // ── Audit Log Helper ────────────────────────────────────────────────────────
  addAuditLog(tag, actor, message, severity = "info") {
    this.auditLogs.unshift({
      id: `log_${Date.now()}`,
      timestamp: new Date().toISOString(),
      tag,
      severity,
      actor,
      message,
    });
    this.save();
  }
}

export const db = new PersistentDB();
