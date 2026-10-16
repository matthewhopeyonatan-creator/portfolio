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
};

// Order = grid order (left→right, top→bottom).
export const projects: Project[] = [
  {
    slug: "crowdvolt",
    title: "CrowdVolt",
    subtitle: "Multi-role design",
    tags: ["Consumer product", "Startup", "Front end code", "Mobile & web"],
    href: "https://matthew-hope.com/crowdvolt",
  },
  {
    slug: "inquirer",
    title: "The Philadelphia Inquirer",
    subtitle: "News media personalization",
    tags: ["Consumer product", "Personalization", "User research", "Mobile app"],
    href: "https://matthew-hope.com/inky",
  },
  {
    slug: "shmood",
    title: "Shmood",
    subtitle: "Onboarding and dashboard for creatives",
    tags: ["Consumer product", "Startup", "AI product", "Web"],
    href: "https://matthew-hope.com/shmood",
  },
  {
    slug: "crave",
    title: "Crave",
    subtitle: "Redefining the dining experience",
    tags: ["Consumer product", "0 → 1", "Personal project", "Mobile app"],
    href: "https://matthew-hope.com/crave",
  },
];
