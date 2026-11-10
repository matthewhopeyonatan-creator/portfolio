/**
 * Full case studies shown in the project popup (full screen). Each section becomes an entry in the
 * "Aisle Directory" tracker; blocks render top to bottom. Image sizes are the files' pixel sizes
 * (used for their aspect ratio). Copy carried over from the old portfolio.
 */

export type CaseImage = { src: string; w: number; h: number; alt: string };

export type CaseBlock =
  | { type: "logos"; images: CaseImage[] }
  | { type: "link"; text: string; href: string }
  // ── CrowdVolt-style blocks (Figma 64:381) ──
  // a labelled group: small uppercase label (red for a section's opening label), then its blocks
  | { type: "group"; label?: string; accent?: boolean; blocks: CaseBlock[] }
  // big 48px statement with an optional 24px line under it (either can stand alone; a blank
  // line in the body starts a new paragraph)
  | { type: "callout"; text?: string; body?: string; /** in a bordered card (Figma 316:340) */ boxed?: boolean }
  // live website in a rounded window
  | { type: "embed"; url: string; title: string; ratio: number }
  // step diagram: labels over dots, optional "+FRICTION" tags after given steps (0-based)
  | {
      type: "flow";
      steps: string[];
      frictionAfter?: number[];
      /** loop: dots start as outlines and fill in one by one; these steps turn red (skipped) */
      skip?: number[];
      /** loop the ball along the steps even with none skipped */
      loop?: boolean;
    }
  // images with captions under them, side by side when more than one
  | {
      type: "figures";
      items: {
        image: CaseImage;
        caption?: string;
        /** shown as a live, animated rebuild instead of the still (ReviewCheckboxes) */
        live?: "review-checkboxes";
      }[];
      rise?: boolean;
    }
  // a row of bordered cards: bold label + medium title over a big light line, centred (Figma 131:232)
  | {
      type: "blockers";
      items: { label: string; title: string; text: string; w: number }[];
      /** a longer line per card: set at the 24px body size instead of 36 */
      small?: boolean;
    }
  // a photo beside a stack of bordered cards (bold title, big light line), caption under (Figma 135:252)
  | {
      type: "sketch";
      image?: CaseImage;
      caption: string;
      items: { title: string; text: string }[];
    }
  // phone screens built in code, in a bordered frame (components/TicketmasterPhones.tsx)
  | {
      type: "phones";
      screens: ("explore-4" | "explore-6" | "final-sell" | "final-delivery" | "status-one" | "status-batch")[];
    }
  // Shmood's onboarding screens rebuilt in code, two to a row (components/ShmoodScreens.tsx)
  | { type: "screens"; screens: ("welcome" | "story" | "aesthetic" | "designer")[] }
  // Shmood's final dashboard rebuilt in code, rising in like a figure (components/ShmoodDashboard.tsx)
  | { type: "dashboard" }
  // a 3-across grid of 3:4 graphics that sweep up into view row by row (Figma 152:2372)
  | { type: "gallery"; images: CaseImage[] }
  // a 48px heading over a stack of bordered 36px lines (Figma 166:2459); spaced: 24 apart, not 16
  | { type: "wins"; title?: string; items: string[]; spaced?: boolean }
  // three columns of bordered 36px cards, the picked ones filled in (Figma 318:3357)
  | { type: "chips"; items: { text: string; on?: boolean }[] }
  // The Inquirer's iteration frames, rebuilt in code (components/InquirerProcess.tsx)
  | { type: "inq-midfi" | "inq-finalish"; reasons: string[] }
  // a row of bordered cards: an optional bold uppercase title over a light line
  | { type: "boxes"; items: { title?: string; text: string }[] }
  // closing 48px lines, a blank line apart, 60 under what comes before (Figma 166:3336)
  | {
      type: "statement";
      lines: string[];
      /** the last line's closing word links out (e.g. "here" → the full case study) */
      link?: { word: string; href: string };
    }
  // The Inquirer's "Philly For You" feed and paywall rebuilt in code (components/PhillyForYou.tsx)
  | { type: "philly" }
  // a not-yet-written section
  | { type: "placeholder" };

export type CaseSection = {
  name: string;
  blocks: CaseBlock[];
  /** the section opens with its own label (e.g. a red "OVERVIEW"), so skip the generic "[n] Name" one */
  ownLabel?: boolean;
};

const img = (n: string, w: number, h: number, alt: string): CaseImage => ({
  src: `/projects/shmood/${n}.webp`,
  w,
  h,
  alt,
});

// laid out the CrowdVolt way: a red label opening each section, labelled groups of a big
// statement over a lighter line, bordered boxes instead of bullet lists, figures that rise in
const fig = (image: CaseImage, caption?: string) => ({ image, caption });

const shmood: CaseSection[] = [
  {
    name: "Context",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Context",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "How might we create a onboarding process that communicates high design standards and unify the platform's various products?",
            body: "The main goal is streamlining and maximizing the startup’s features and value propositions, in a non-traditional way.",
          },
          {
            type: "wins",
            items: [
              "Creating an improved onboarding experience to get users excited to use the platform",
              "Identifying areas of opportunity to ideate new features and build the best platform for designers",
            ],
          },
        ],
      },
      {
        type: "group",
        label: "What is Shmood?",
        blocks: [
          {
            type: "callout",
            text: "A project management tool that bridges the gap between designers and clients",
            body: "Shmood offers a unified platform where creativity thrives through centralized resources, smart communication, and AI-powered feedback synthesis. Backed by Entrepreneurs First.",
          },
        ],
      },
    ],
  },
  {
    name: "Research",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Research",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "We conducted interviews with 30 creatives in over 10 industries",
            body: "We wanted to gain insights on the how visual designers work with their clients (What’s efficient? What’s not?), the pain points in seeking and receiving feedback, and designers’ comfort with AI in creative workflows.",
          },
          {
            type: "blockers",
            small: true,
            items: [
              {
                label: "Insight 1",
                title: "Feedback is Scattered",
                text: "Designers expressed frustration in how unorganized and inefficient the feedback process can be.",
                w: 560,
              },
              {
                label: "Insight 2",
                title: "Communication is Key",
                text: "“Can you make it pop?” a designer’s worst nightmare in the form of feedback. Clients often struggle articulating what they want.",
                w: 560,
              },
              {
                label: "Insight 3",
                title: "Emphasizing UVP",
                text: "Shmood’s onboarding process must be compelling and personalized to connect with new users and gain loyalty.",
                w: 560,
              },
              {
                label: "Insight 4",
                title: "Ensuring Trust in AI",
                text: "Designers are skeptical about AI generating creative work, citing concerns over style, misinterpretation, and ethics.",
                w: 560,
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Competitor Analysis",
        blocks: [
          {
            type: "callout",
            text: "We wanted to maintain Shmood’s unique value proposition",
            body: "We researched 6+ companies that provide project management solutions for creatives and found some opportunity areas for Shmood:",
          },
          {
            type: "boxes",
            items: [
              {
                title: "AI used to optimize feedback",
                text: "Most platforms collect feedback but fail to organize it into actionable insights or address the communication gap between designers and clients. Thoughtful AI integration could revolutionize this process.",
              },
              {
                title: "Centralizing creative tools",
                text: "Designers usually incorporate multiple digital tools into their workflow. With Shmood, they can centralize designs, collect feedback, manage their projects, and case their work all in one seamless platform.",
              },
              {
                title: "Client and designer-friendly",
                text: "Allowing easy and straightforward user experiences for both designers and their clients so that designers can focus on delivering high quality work, while clients can quickly leave helpful feedback and oversee progress.",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Onboarding",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Onboarding",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "I took ownership over Shmood’s onboarding experience and user dashboard",
            body: "I wanted to present Shmood’s creative and quirky energy to capture new and prospecting users. As our team was also able to create multitudes of new products for Shmood, I was also responsible for creating a centralized system that will house all of the products efficiently.",
          },
        ],
      },
      {
        type: "group",
        label: "Onboarding Experience",
        blocks: [
          {
            type: "callout",
            text: "From the team’s user research and ideation, I was able to identify 3 core value that the onboarding experience had to have",
          },
          {
            type: "boxes",
            items: [
              { text: "User Engagement" },
              { text: "Clear Value Proposition" },
              { text: "For Designers, By Designers" },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Ideation",
        blocks: [
          {
            type: "callout",
            text: "I started dreaming.*ੈ✩‧₊˚.. and ideating...",
            body: "As I began ideating solutions to address user pain points and flow requirements, I was unafraid to challenge convention and aimed to push for creative solutions. This is how I created my low-fis.",
          },
          {
            type: "figures",
            rise: true,
            items: [
              fig(
                img(
                  "06",
                  1668,
                  2157,
                  "Lo-fi sketch: after-initial onboarding and a physical Shmood board",
                ),
                "Tell a story: physical cards with original designs or designs that is made by the Shmood community",
              ),
              fig(
                img(
                  "07",
                  1668,
                  2157,
                  "Lo-fi sketch: onboarding animation and Shmood board",
                ),
                "Communicate value: an onboarding video that clearly states the value proposition of Shmood to new users",
              ),
              fig(
                img(
                  "08",
                  1668,
                  2157,
                  "Lo-fi sketch: physical care package with merch, cards and stickers",
                ),
                "Personalization: adding customizable experiences through physical designer care package, cards, onboarding survey",
              ),
            ],
          },
        ],
      },
      {
        type: "group",
        label: "*ੈ✩‧₊˚Brand Vision Ideation*ੈ✩‧₊˚",
        blocks: [
          {
            type: "figures",
            rise: true,
            items: [fig(img("09", 2000, 553, "Brand vision mood board"))],
          },
        ],
      },
      {
        type: "group",
        label: "Final Onboarding Experience",
        blocks: [
          {
            type: "callout",
            text: "A cohesive product story that makes early access users feel welcomed in a community",
            body: "My objective for designing the onboarding flow was to communicate a cohesive product story for early access users to easily understand Shmood’s mission, features, differentiation, and impact, while making them feel welcomed in a community.\n\nAs observed through our user interviews and analysis of competing product onboarding flows, I needed to prioritize conciseness, creativity and wit in both the visual design, and UX. I also had to work within the constraints of what is feasible and realistic for the company at this scale.",
          },
        ],
      },
      {
        type: "group",
        label: "Introduction",
        blocks: [
          {
            type: "callout",
            body: "After sign in, the animated onboarding flow is initiated with the user being welcomed into Shmood’s world. This flow is fully automated and made to welcome users.",
          },
          { type: "screens", screens: ["welcome", "story"] },
        ],
      },
      {
        type: "group",
        label: "Questionnaire",
        blocks: [
          {
            type: "callout",
            body: "I elevated the generic questionnaire form into an interactive and compelling experience where users indicate their preferences and background in regards to creativity.",
          },
          { type: "screens", screens: ["aesthetic", "designer"] },
        ],
      },
      {
        type: "group",
        label: "Digital Personalized Cards",
        blocks: [
          {
            type: "callout",
            text: "Introducing Shmood IDs",
            body: "I invented a new paradigm to represent the different abstract creative archetypes. I settled on using fruit as a cute and concise way to associate each type of designer with the connotations they bring to the table. Through this creative approach, I wanted to foster user curiosity and platform loyalty.",
          },
          {
            type: "figures",
            rise: true,
            items: [
              fig({
                src: "/projects/shmood/ids/front.svg",
                w: 1085,
                h: 676,
                alt: "Shmood ID card, front: Name Name, Early Access Member",
              }),
              fig({
                src: "/projects/shmood/ids/back.svg",
                w: 1395,
                h: 869,
                alt: "Shmood ID card, back: Shmood logo, name, join date and a lemon",
              }),
            ],
          },
        ],
      },
    ],
  },
  {
    name: "User Dashboard",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "User Dashboard",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "Feedback, design files and Shmood boards in one unified workspace",
            body: "In order to address the issue of disorganized workflows in projects, I designed a dashboard that integrated feedback, design files, and Shmood boards (Shmood’s version of ideation mood boards) in a unified workspace. This supported designers by:",
          },
          {
            type: "wins",
            items: [
              "Providing a high level overview of project progress and key action items",
              "Insuring streamlined access to all necessary resources, all in one place",
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Initial Ideas",
        blocks: [
          {
            type: "callout",
            body: "I decided to create a dashboard with widgets for each part of the project and feedback process, aiming to display as much related information as possible. This included the following widgets:",
          },
          {
            type: "boxes",
            items: [
              { text: "Project Goals & Timeline" },
              { text: "Feedback Center" },
              { text: "Client Overview" },
            ],
          },
          {
            type: "boxes",
            items: [
              { text: "Ideation Center" },
              { text: "Your Notes" },
              { text: "Design Files" },
            ],
          },
          {
            type: "figures",
            rise: true,
            items: [
              fig({
                src: "/projects/shmood/dashboard/initial-empty.webp",
                w: 1200,
                h: 1095,
                alt: "Shmood's initial dashboard before any feedback has come in",
              }),
              fig({
                src: "/projects/shmood/dashboard/initial-full.webp",
                w: 1200,
                h: 1095,
                alt: "Shmood's initial dashboard filled in with notes, design files and feedback",
              }),
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Final Dashboard Prototype",
        blocks: [
          {
            type: "callout",
            body: "However, I realized that too many widgets on the dashboard can lead to a cognitive overload for the users, distracting users from the key tasks and Shmood’s value proposition: Feedback Forms and Shmood Boards.\n\nI decided to keep the relevant widgets and consolidate others to make a more impactful dashboard experience.",
          },
          {
            type: "boxes",
            items: [
              {
                title: "Project Overview",
                text: "Provides designers with a clear and concise view of project progress",
              },
              {
                title: "Your Files",
                text: "Easily access all key design files and assets",
              },
            ],
          },
          {
            type: "boxes",
            items: [
              {
                title: "Feedback Center",
                text: "Share and receive feedback from clients in a streamlined way",
              },
              {
                title: "Your Boards",
                text: "A space for designers to ideate, create Shmood boards, and case their work",
              },
            ],
          },
          // the final dashboard rebuilt in code (components/ShmoodDashboard.tsx, Figma 206:3616)
          { type: "dashboard" },
        ],
      },
    ],
  },
  {
    name: "Impacts",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Impacts",
        accent: true,
        blocks: [
          {
            type: "wins",
            title: "Design Impacts",
            items: [
              "My designs along with the team's entire design ecosystem was validated by Shmood's lead engineer and CEO for further implementation.",
              "Creation of dashboard decreased friction in understanding when tested by the internal design team.",
              "The onboarding I created was received well by designers in Shmood and Cornell University and had 34/37 people understanding the value proposition of the platform.",
            ],
          },
        ],
      },
      {
        type: "group",
        blocks: [
          {
            type: "callout",
            text: "Final Reflections",
            body: "I was able to explore and soar through the world of creative expression, yet also ground myself with data driven designs. Through the features I have ownership over, I learned so much about the balance between aesthetics and functionality. If I had more time with this project, I would",
          },
          {
            type: "wins",
            items: [
              "Measure the impacts through user testing.",
              "Explore more of in the physical space to see how it can be done regardless of constraints.",
              "Create for non traditional designers, especially for the onboarding as I want my onboarding experience to be effective and appealing to groups beyond who we interviewed.",
            ],
          },
        ],
      },
      {
        type: "statement",
        lines: [
          "Special thanks to Malvika, Jordan, and Daniel, as well as my team that has supported my growth as a product designer in this project :)",
        ],
      },
      {
        type: "link",
        text: "Check out the full case study on Behance ↗",
        href: "https://www.behance.net/gallery/217571883/Shmood-x-DCC-FA24",
      },
    ],
  },
];

const cv = (n: string, alt: string): CaseImage => ({
  src: `/projects/crowdvolt/${n}.webp`,
  w: 1512,
  h: 743,
  alt,
});

const bidSteps = [
  "I want to buy for $40",
  "I’ll sell for $40",
  "Confirm",
  "Transaction complete",
];

// Figma 64:381 — Matthew's copy, as written there
const crowdvolt: CaseSection[] = [
  {
    name: "Context",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Context",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "At a startup, I designed product features from scratch and took over others partway through. I also made graphics, ran social media, and helped plan events",
            body: "CrowdVolt is a peer-to-peer ticket marketplace. Rather than holding inventory, it connects buyers with verified sellers, and tickets move straight from the seller’s account to the buyer’s.",
          },
        ],
      },
      {
        type: "group",
        label: "What is CrowdVolt",
        blocks: [
          {
            type: "callout",
            text: "An EDM ticket marketplace backed by YC, that connects users to each other through a community-forward platform",
            body: "CrowdVolt is a peer-to-peer ticket marketplace. Rather than holding inventory, it connects buyers with verified sellers, and tickets move straight from the seller’s account to the buyer’s.",
          },
          {
            type: "embed",
            url: "https://www.crowdvolt.com",
            title: "crowdvolt.com",
            ratio: 1314 / 820, // a taller window than Figma's 547, so more of the site shows
          },
        ],
      },
    ],
  },
  {
    name: "Bid Warning",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Bid Warning",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "Redesigning a core flow that allows users to place bids on tickets they want to buy",
          },
        ],
      },
      {
        type: "group",
        label: "The Problem",
        blocks: [
          {
            type: "callout",
            text: "Once a buyer places a bid and a seller matches it, the transaction is automatically processed",
            body: "Causes high user confusion since users are accustomed to secondary confirmation whether they want to buy the ticket or not",
          },
          { type: "flow", steps: bidSteps, skip: [2] },
        ],
      },
      {
        type: "group",
        label: "Decision Making",
        blocks: [
          {
            type: "callout",
            text: "This was causing a lot of pressure on the operations team, there was not much time to conduct a full design process",
            body: "After identifying the core part of the problem, I realize that there are 2 areas that friction can be added to",
          },
          { type: "flow", steps: bidSteps, frictionAfter: [0, 1] },
          {
            type: "callout",
            text: "Final decision was to add friction while buyer is placing the bid",
            body: "Adding friction after the sale would make buyers come back to the platform to confirm it. That extra step could put them off, and some would drop off before finishing the purchase.",
          },
        ],
      },
      {
        type: "group",
        label: "Iterations",
        blocks: [
          {
            type: "callout",
            text: "Should the friction be added as a separate page or embedded in the current flow?",
            body: "After identifying the core part of the problem, I realize that there are 2 areas that friction can be added to",
          },
          {
            type: "figures",
            items: [
              {
                image: cv(
                  "bid-warning-page",
                  "Bid warning as a separate page: You’re about to make an offer",
                ),
                caption: "Seperate warning page",
              },
              {
                image: cv(
                  "bid-checkbox",
                  "Bid warning embedded in the review page as checkboxes",
                ),
                caption: "Embed to current page as checkbox",
                // zooms in on the checkboxes, ticks them, zooms back out — on a loop
                live: "review-checkboxes",
              },
            ],
          },
        ],
      },
      {
        type: "group",
        blocks: [
          {
            type: "callout",
            text: "Using Post Hog heat maps and recordings to see user behavior",
            body: "Users currently spend no attention or time on checkboxes, adding another one adds basically no friction to the process.",
          },
          {
            type: "figures",
            items: [
              {
                image: cv(
                  "bid-heatmap",
                  "Mock heat map of the review page: attention on totals and the Place Offer button, none on the checkbox text",
                ),
                caption:
                  "Mock heat map depicting users not reading checkbox information (real heat map may not be displayed)",
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Final Design Decision",
        blocks: [
          {
            type: "callout",
            text: "The bid warning should live as a separate page to introduce the right amount of friction without adding another user flow",
          },
          {
            type: "figures",
            items: [
              {
                image: cv(
                  "bid-final",
                  "Final bid warning page: You’re about to make an offer",
                ),
                caption: "Final implemented design",
              },
            ],
          },
        ],
      },
    ],
  },
  // still to come (named in the Figma Aisle Directory)
  // Figma 129:100
  {
    name: "Ticketmaster Flow",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Ticketmaster Flow",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "Simplifying a complicated ticket transfer process that involves external systems",
            body: "Since CrowdVolt connects users through their external wallets, the UX differs depending on where the user’s tickets live and how ticket transfers work on that platform. Ticketmaster has an especially complicated process since they do not allow auto-transfer of tickets in some scenarios.",
          },
        ],
      },
      {
        type: "group",
        label: "The Problem",
        blocks: [
          {
            type: "callout",
            text: "The manual ticket transfer process is complicated, but we need it to be smooth for the user",
            body: "The manual transfer process involves sending tickets to the CrowdVolt inventory and CrowdVolt sends it to the buyer",
          },
          {
            type: "flow",
            steps: [
              "Seller’s Ticketmaster Account",
              "CrowdVolt Inventory",
              "Buyer’s Ticketmaster Account",
            ],
            loop: true,
          },
          {
            type: "blockers",
            items: [
              {
                label: "Blocker 1",
                title: "Send all tickets at once",
                text: "Fast for the seller, but the tickets can only be sold together as one bundle.",
                w: 270,
              },
              {
                label: "Blocker 2",
                title: "Send individual tickets",
                text: "Each ticket can sell on its own, but every ticket needs its own email, which gets messy",
                w: 293,
              },
              {
                label: "Blocker 3",
                title: "Make tickets sellable",
                text: "Sells best, because buyers can pick how many they want, but it takes more steps",
                w: 309,
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "The Drawing Board",
        blocks: [
          {
            type: "callout",
            text: "I started mapping out the happy path to understand the optimal user flow",
            body: "Our platform is used in many different real-world situations, so I prioritized the factors that matter most in each one",
          },
          {
            type: "sketch",
            image: {
              src: "/projects/crowdvolt/tm-sketch.webp",
              w: 700,
              h: 511,
              alt: "Hand-drawn lo-fi user flow sketch of the ticket transfer screens",
            },
            caption: "Sample lo-fi user flow",
            items: [
              {
                title: "Users often buy last-minute at a busy venue",
                text: "Efficient flow",
              },
              {
                title: "Users do not read fine-print",
                text: "Ease of comprehension",
              },
              {
                title: "Users are protective to personal info",
                text: "Trust built into flow",
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Exploration",
        blocks: [
          {
            type: "callout",
            text: "The existing system used text-based instructions which conflicted with ease of comprehension and an efficient flow",
            body: "I iterated on visual based artifacts to help users understand how the grouping of their tickets would affect their sales. My initial exploration included a comprehensive visual multiple choice system that gives the user full liberty on how they want to sell their tickets.",
          },
          { type: "phones", screens: ["explore-4", "explore-6"] },
          {
            type: "callout",
            text: "The major problem:",
            body: "Giving the users full liberty also means they would have to fully comprehend the system. This conflicts with ease of comprehension and a fast flow, which will cause users to inherently not trust the flow since they need to go through so much copy and decision making.",
          },
        ],
      },
      {
        type: "group",
        label: "Final Design Decision",
        blocks: [
          {
            type: "callout",
            text: "The final design implementation includes predetermined choices and plain language",
            body: "Preventing confusion and having a quick flow was the priority, so I had to give users just the right amount of autonomy and also use plain language that make the use feel assured and understood.",
          },
          { type: "phones", screens: ["final-sell", "final-delivery"] },
          {
            type: "callout",
            text: "I created a post-listing feedback center which helps users understand and troubleshoot their ticket transfer status",
            body: "This screen is necessary to put in a user’s listings page as users need to know if their transfers are successful, if they want to pick up the transfer process at a later time, or if they want to troubleshoot a transfer error. This reduces the traffic on our help center and increases a user’s sense of trust and security.",
          },
          // Figma 14873:1228 / 14886:3593 (CrowdVolt web file)
          { type: "phones", screens: ["status-one", "status-batch"] },
        ],
      },
      {
        type: "group",
        label: "Post-Launch Care",
        blocks: [
          {
            type: "callout",
            text: "We launched a beta and watched how initial users navigated the new flow",
            body: "This resulted in minor copy changes and changes in the actual ticket transfer instruction to increase trustability. Having post-launch iteration is super important to make sure our intentions come across the way we intended to.",
          },
        ],
      },
    ],
  },
  // Figma 152:1476
  {
    name: "Graphics",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Graphics",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "A collection of visual assets I created for CrowdVolt",
            body: "Being at a startup means I have to take on multiple roles, one of which I had large ownership over was graphics and social media. The following are examples of visual assets I created for social media, print, and interface purposes.",
          },
        ],
      },
      {
        type: "gallery",
        images: [
          "Solara poster",
          "Head Trip festival lineup poster",
          "Carlita artist of the month graphic",
          "Solomun special event at Pacha poster",
          "Solara with 2nd Wave artist spotlight",
          "New Music Friday graphic",
          "Rüfüs Du Sol artist of the month graphic",
          "What to expect event graphic",
          "Buddy Buddy coffee hiring poster",
          "Volt Radio monthly recap graphic",
          "Solid Grooves giveaway graphic",
          "Brunello artist of the month graphic",
          "CrowdVolt Re:wind underground SF poster",
          "Rave essentials graphic",
          "CrowdVolt Re:wind at Nook SF poster",
          "Solara venue spotlight at Bogart House poster",
          "CrowdVolt SF $5 off your next purchase poster",
          "Solomun two GA tickets giveaway poster",
        ].map((alt, i) => ({
          src: `/projects/crowdvolt/graphics/g${String(i + 1).padStart(2, "0")}.webp`,
          w: 1080,
          h: 1440,
          alt,
        })),
      },
    ],
  },
  // Figma 166:2428
  {
    name: "Play",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Play",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "The design team, myself and my supervisor, spearheaded a 300 RSVP app launch party, from ideation to execution.",
          },
        ],
      },
      {
        type: "gallery",
        images: [
          "CrowdVolt neon sign over the bar, lit by rows of candles",
          "The launch party bar under hanging plants and the CrowdVolt sign",
          "CrowdVolt merch rail under red light",
          "Two guests taking a mirror selfie under the pink CrowdVolt neon",
          "Red-lit entrance hallway with a glowing mirror",
          "Guests in the dark watching a lit-up screen",
        ].map((alt, i) => ({
          src: `/projects/crowdvolt/play/p0${i + 1}.webp`,
          w: 1080,
          h: 1440,
          alt,
        })),
      },
    ],
  },
  {
    name: "Impacts",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Impacts",
        accent: true,
        blocks: [
          {
            type: "wins",
            title: "Personal Wins",
            items: [
              "My first design internship, extending all the way to 9 months",
              "Learned how to deliver my designs through front-end code",
              "Conquered my fear of motion graphics in After Effects and Figma Motion",
            ],
          },
          {
            type: "wins",
            title: "Impacts",
            items: [
              "Decreased user confusion through 3 different owned flows",
              "Increased social media followers by 10,000 with over 1 million engagements",
              "Redesigned the empty state UI for the entirety of the web and app product",
              "Helped shape the flow of design critique and design workflows in the company",
            ],
          },
        ],
      },
      {
        type: "statement",
        lines: [
          "If you’re reading this, special thanks to the CrowdVolt team and Sana for helping me grow so much.",
          "EVERYONE DOWNLOAD THE APP!",
        ],
      },
    ],
  },
];

// Figma 316:264 — Matthew's copy, as written there
const inquirer: CaseSection[] = [
  {
    name: "Context",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Context",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "The Philadelphia Inquirer wanted to expand readership, enhance engagement, and diversify content.",
            body: "The Philadelphia Inquirer came to our team needing us to design a holistic experience for their new audio format news. This also came with the needs to appeal to users across different generations and comfortability with technology. Designing a holistic experience does not only mean slapping on an audio option on every article, but also thinking about other features that feed into it, including personalization.",
          },
        ],
      },
      {
        type: "group",
        label: "What is The Philadelphia Inquirer",
        blocks: [
          {
            type: "callout",
            text: "Pennsylvania’s largest media outlet",
            body: "The Philadelphia is the third longest running media outlet in the United States and the largest one in the Philadelphia Metropolitan Area and Pennsylvania. They have 170,000 active users and are constantly looking to keep up with the ever changing news landscape.",
          },
        ],
      },
    ],
  },
  {
    name: "The Problem",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "The Problem",
        accent: true,
        blocks: [
          {
            type: "callout",
            boxed: true,
            text: "Falling behind in the news industry",
            body: "Many news giants such as The NY Times, The Washington Post, and many more have started to incorporate audio and cross-device integration to keep up with the changing landscape of tech. This includes podcasts, text to speech, CarPlay, and many other forms of news that is outside the traditional text space. The Philadelphia Inquirer was falling behind and needed to keep up with this change.",
          },
          {
            type: "callout",
            boxed: true,
            text: "A dying viewership in Gen Z audiences",
            body: "A large percentage of their users fall in the age range of Millennial or older, with outdated systems and an overall reading crisis mainly to blame. They needed to re-engage with younger generations to maintain their spot as a Pennsylvania powerhouse.",
          },
          {
            type: "callout",
            boxed: true,
            text: "Introduction of a subscription-based service",
            body: "Readers weren’t hooked enough to pay. The Inquirer wanted its paywall to bring in more subscribers.",
          },
        ],
      },
    ],
  },
  {
    name: "Final Designs",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Final Designs",
        accent: true,
        blocks: [
          {
            type: "callout",
            text: "A daily feed of Philly news, cut down to swipeable stories picked for the user, limited through a pay-wall",
            body: "I owned Philly For You, a swipeable short-form feed of each day’s stories, picked for each reader. It gives younger and overwhelmed readers an easy way into the news, and every story leads to the full article. Non subscribed users will get hit with a paywall as a way for nudging users to subscribe to access these premium features.",
          },
        ],
      },
      { type: "philly" },
    ],
  },
  {
    name: "Research",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Research",
        accent: true,
        blocks: [
          {
            type: "group",
            label: "Competitor Analysis",
            blocks: [
              {
                type: "callout",
                text: "Before I honed down on engagement, our team looked at 30+ competitors to understand industry standards",
                body: "We found 9 features that were standard across the industry, and I honed down on personalized news, discovery, and content prioritization to drive my future iterations.",
              },
              {
                type: "chips",
                // row by row, as the three columns read across
                items: [
                  { text: "Personalized News", on: true },
                  { text: "Queues" },
                  { text: "Content-first", on: true },
                  { text: "Discovery", on: true },
                  { text: "Timestamps" },
                  { text: "Playlists" },
                  { text: "Audio Entry Points" },
                  { text: "Transcript Highlights" },
                  { text: "Widgets" },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "User Interviews",
        blocks: [
          {
            type: "callout",
            text: "We interviewed over 25 users of different age ranges to understand their perception on news consumption",
            body: "There were a plethora of insights that we found ranging from trust in AI to engagement, but these are the key findings that were core to my designs in personalization:",
          },
          {
            type: "wins",
            spaced: true,
            items: [
              "Gen Z users are often experience choice paralysis",
              "Gen Z users want more visual-forward features",
              "Millennial+ users seek multitasking abilities",
              "Users want to stay informed without much effort",
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Iterations",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Iterations",
        accent: true,
        blocks: [
          {
            type: "group",
            label: "Lo-fis",
            blocks: [
              {
                type: "callout",
                text: "Exploration starts on paper",
                body: "I started my process through sketches. At this point, the team was still figuring out what we needed to work on, so my iterations expanded beyond personalization. Pairing these lo-fi iterations with user research led me to spearhead the egagemtn layer.",
              },
              {
                type: "figures",
                rise: true,
                items: [
                  { image: { src: "/projects/inquirer/process/lofi-1.webp", w: 1600, h: 1132, alt: "Lo-fi sketches 1 and 2: a home screen and a visuals-first article layout" } },
                  { image: { src: "/projects/inquirer/process/lofi-2.webp", w: 1600, h: 1132, alt: "Lo-fi sketch 3: a daily round-up you swipe through" } },
                ],
              },
              {
                type: "figures",
                rise: true,
                items: [
                  { image: { src: "/projects/inquirer/process/lofi-3.webp", w: 644, h: 455, alt: "Lo-fi sketch 4: a For You page with news for you, news categories and previously listened" } },
                  { image: { src: "/projects/inquirer/process/lofi-4.webp", w: 642, h: 455, alt: "Lo-fi sketch 5: entry points from a normal news page into a pop-up" } },
                ],
              },
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Mid-fis",
        blocks: [
          {
            type: "callout",
            text: "I designed two options for the Inquirer to review, focusing on visual cues, engagement, and ease of use",
            body: "My first direction gave readers more control, with two layers of navigation: swipe across to change genres, and up or down to move through stories within it. Choosing their own path would have kept people more engaged and made the feed feel more personal. After reviewing it with the Inquirer team, we pulled it back for a few reasons:",
          },
          {
            type: "inq-midfi",
            reasons: [
              "The 2 pronged navigation was not familiar",
              "They did not have enough articles daily to fuel this many options",
              "Not visually appealing",
            ],
          },
        ],
      },
      {
        type: "group",
        label: "Final-ish Design",
        blocks: [
          {
            type: "callout",
            text: "I removed the 2 prong navigation and stuck to a linear feed",
            body: "News can feel overwhelming, so I wanted catching up to feel personal and familiar. I built on the short-form, swipe-through format most people already use regularly, so there’s nothing new to learn. There was on issue:",
          },
          { type: "inq-finalish", reasons: ["The Inquirer took only horizontal images"] },
        ],
      },
      {
        type: "group",
        label: "Final Design (Again)",
        blocks: [
          {
            type: "callout",
            text: "The final design touches on user needs of removing choice paralysis, being more visual, and being low effort",
            body: "This design was validated by the Inquirer team by fitting business needs, feasibility, and user needs. The designs were created based on the iPhone 4 screens, to make handoff to engineers smoother according to the Inquirer workflow.",
          },
          { type: "philly" },
        ],
      },
    ],
  },
  {
    name: "Impacts",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Impacts",
        accent: true,
        blocks: [
          {
            type: "wins",
            title: "Personal Wins",
            items: [
              "My first time using an established design system",
              "The design was fully validated by the Inquirer team",
              "I was able to be involved in creating a full case study for this project",
            ],
          },
          {
            type: "wins",
            title: "Impacts",
            items: [
              "The design was stored and then used to inspire features that are live on the Inquirer mobile app",
              "I still maintain conversation and involvement with the Inquirer team in future design endeavors",
            ],
          },
        ],
      },
      {
        type: "statement",
        lines: [
          "Special thanks to the Inquirer team for a fulfilling project!",
          "See the full case study here",
        ],
        link: { word: "here", href: "https://www.behance.net/gallery/229681591/Inquirer-x-DCC-SP25" },
      },
    ],
  },
];

export const caseStudies: Record<string, CaseSection[]> = { shmood, crowdvolt, inquirer };
