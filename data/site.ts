// Site-wide links. Placeholders point at the current Framer site until the new pages exist.
export const navLinks = [
  { label: "about", href: "https://matthew-hope.com/about" },
  { label: "projects", href: "#seasonal-picks" },
  { label: "graphics", href: "https://matthew-hope.com/#pantry" },
];

// "your cart" — wired to email for now.
export const cartLink = {
  label: "your cart",
  href: "mailto:matthew.hope.yonatan@gmail.com",
  ariaLabel: "Get in touch by email",
};

export type Project = {
  slug: string;
  title: string;
  subtitle: string;
  tags: string[];
  href: string;
  image: { src: string; width: number; height: number; alt: string };
};

const tray = { src: "/home/tray.webp", width: 1362, height: 932 };

// Order = grid order (left→right, top→bottom).
// The design repeats CrowdVolt + Inquirer in row 2 as placeholders — swap those for new projects.
export const projects: Project[] = [
  {
    slug: "crowdvolt",
    title: "CrowdVolt",
    subtitle: "Multi-role design",
    tags: ["Consumer product", "Startup", "Front end code", "Graphics"],
    href: "https://matthew-hope.com/crowdvolt",
    image: { ...tray, alt: "Blue foam grocery tray" },
  },
  {
    slug: "inquirer",
    title: "The Philadelphia Inquirer",
    subtitle: "News media personalization",
    tags: ["Consumer product", "Personalization", "User research", "Feature creation"],
    href: "https://matthew-hope.com/inky",
    image: { ...tray, alt: "Blue foam grocery tray" },
  },
  {
    slug: "crowdvolt-2",
    title: "CrowdVolt",
    subtitle: "Multi-role design",
    tags: ["Consumer product", "Startup", "Front end code", "Graphics"],
    href: "https://matthew-hope.com/crowdvolt",
    image: { ...tray, alt: "Blue foam grocery tray" },
  },
  {
    slug: "inquirer-2",
    title: "The Philadelphia Inquirer",
    subtitle: "News media personalization",
    tags: ["Consumer product", "Personalization", "User research", "Feature creation"],
    href: "https://matthew-hope.com/inky",
    image: { ...tray, alt: "Blue foam grocery tray" },
  },
];
