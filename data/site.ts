// Site-wide links. Placeholders point at the current Framer site until the new pages exist.
export const navLinks = [
  { label: "about", href: "https://matthew-hope.com/about" },
  { label: "projects", href: "#seasonal-picks" },
  { label: "graphics", href: "https://matthew-hope.com/#pantry" },
];

// Footer social links. TODO: add the X handle.
export const socialLinks = [
  { label: "Email", href: "mailto:matthew.hope.yonatan@gmail.com" },
  { label: "Instagram", href: "https://www.instagram.com/hoepey.ai" },
  { label: "X", href: "" },
];

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  href: string;
  /**
   * Project screenshot shown on the tray, under the plastic wrap (Figma: "content placeholder",
   * 487×274). Leave it out to show the red placeholder from the design.
   */
  cover?: { src: string; alt: string };
  /** looping, muted video: fills the tray on the homepage and the popup's header image */
  video?: string;
  /** colour of the shot when there's no cover or video (default: the design's red) */
  shot?: string;
  /** artwork laid on the shot, in Figma px of the 487 × 274 shot */
  shotArt?: { src: string; left: number; top: number; width: number }[];
  /** red "SOLD OUT · on sale soon" banner slapped across the package (case study not out yet) */
  soldOut?: boolean;
  /** logo sitting on the shot, bottom right, inside the plastic wrap */
  badge?: string;
  /** project popup (Figma "project overlay"): intro paragraph + the four facts under it */
  intro?: string;
  facts?: { timeline: string; role: string; type: string; team: string };
};

/** Sections of the full-screen case study, in order (also the "On this page" tracker). */
export const caseStudySections = [
  "The Challenge",
  "Solution",
  "Research Process",
  "Design Process",
  "Results",
];

// Order = grid order (left→right, top→bottom).
export const projects: Project[] = [
  {
    slug: "crowdvolt",
    title: "CrowdVolt",
    subtitle: "Multi-role design",
    tags: ["Consumer product", "Startup", "Front end code", "Mobile & web"],
    href: "https://matthew-hope.com/crowdvolt",
    video: "/projects/crowdvolt.mp4",
    intro:
      "CrowdVolt is an electronic music ticket marketplace. Over nine months, I worked across product, graphics, social media, and event planning. Being at an early-stage company meant I got to own pieces of a lot of different flows and jump between roles, and this page covers the highlights.",
    facts: {
      timeline: "Dec 2025 – Aug 2026",
      role: "Product Design Intern",
      type: "Professional",
      team: "Individual with supervision",
    },
  },
  {
    slug: "25madison",
    title: "25madison",
    subtitle: "Internal tool for streamlining branding",
    tags: ["B2B", "AI tool", "Internal tool", "Startup incubation"],
    href: "https://matthew-hope.com",
    // Figma 21:136 / 78:2301: dark shot under the wrap, "sold out" banner across the pack
    shot: "#111",
    // Figma 80:2345: the 25m mark at (62, 67) and the arcs from x200 on the 487 × 274 shot
    shotArt: [
      {
        src: "/projects/25madison-mark.svg",
        left: 62.014,
        top: 67,
        width: 100.988,
      },
      {
        src: "/projects/25madison-arcs.svg",
        left: 200.008,
        top: 0,
        width: 288,
      },
    ],
    soldOut: true,
  },
  {
    slug: "shmood",
    title: "Shmood",
    subtitle: "Onboarding and dashboard for creatives",
    tags: ["Consumer product", "Startup", "AI product", "Web"],
    href: "https://www.behance.net/gallery/217571883/Shmood-x-DCC-FA24",
    video: "/projects/shmood.mp4",
    intro:
      "Shmood is an AI-powered creative management tool: a project management platform that bridges the gap between designers and clients through centralized resources, smart communication, and AI-powered feedback synthesis. I owned its onboarding experience and user dashboard.",
    facts: {
      timeline: "Aug 2024 – Dec 2024",
      role: "Product Designer",
      type: "Professional",
      team: "2 PMs, 5 Product Designers",
    },
  },
  {
    slug: "inquirer",
    title: "The Philadelphia Inquirer",
    subtitle: "News media personalization",
    tags: [
      "Consumer product",
      "Personalization",
      "User research",
      "Mobile app",
    ],
    href: "https://matthew-hope.com/inky",
    video: "/projects/inquirer.mp4",
  },
];

/** Stickers that go in the cart when their story card is opened (keyed by their hero image). */
export const stickerItems = [
  {
    key: "sticker-crowdvolt",
    name: "Crowdvolt Sticker",
    src: "/home/sticker-crowdvolt-ycw24.webp",
  },
  {
    key: "sticker-jakarta",
    name: "Jakarta Sticker",
    src: "/home/sticker-jakarta.webp",
  },
  { key: "sticker-nyu", name: "NYU Sticker", src: "/home/sticker-nyu-2.webp" },
  {
    key: "sticker-cornell",
    name: "Cornell Sticker",
    src: "/home/sticker-cornell.webp",
  },
  {
    key: "sticker-design-meetup",
    name: "Design Meetup Sticker",
    src: "/home/sticker-design-meetup.webp",
  },
  {
    key: "sticker-fatboy",
    name: "Fatboy Sticker",
    src: "/home/sticker-fatboy.webp",
  },
];

/** Everything the cart can hold, in the order it lists them: projects, then stickers. */
export const cartCatalog: {
  key: string;
  name: string;
  image?: string;
  sticker?: boolean;
}[] = [
  ...projects.map((p) => ({
    key: p.slug,
    name: p.title,
    image: p.cover?.src,
  })),
  ...stickerItems.map((s) => ({
    key: s.key,
    name: s.name,
    // same art trimmed to its edges, so every sticker fills its cart square
    image: s.src.replace("/home/", "/cart/"),
    sticker: true,
  })),
];
