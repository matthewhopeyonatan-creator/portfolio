/**
 * Full case studies shown in the project popup (full screen). Each section becomes an entry in the
 * "Aisle Directory" tracker; blocks render top to bottom. Image sizes are the files' pixel sizes
 * (used for their aspect ratio). Copy carried over from the old portfolio.
 */

export type CaseImage = { src: string; w: number; h: number; alt: string };

export type CaseBlock =
  | { type: "h"; text: string } // heading inside a section
  | { type: "sub"; text: string } // smaller heading
  | { type: "kicker"; text: string } // small label
  | { type: "lead"; text: string } // big statement line
  | { type: "p"; text: string }
  | { type: "list"; items: string[] }
  | { type: "chips"; items: string[] }
  | { type: "img"; image: CaseImage }
  | { type: "row"; images: CaseImage[] } // side by side
  | { type: "logos"; images: CaseImage[] }
  | {
      type: "cards";
      items: { title: string; text: string; image?: CaseImage }[];
    }
  | { type: "link"; text: string; href: string }
  // ── CrowdVolt-style blocks (Figma 64:381) ──
  // a labelled group: small uppercase label (red for a section's opening label), then its blocks
  | { type: "group"; label?: string; accent?: boolean; blocks: CaseBlock[] }
  // big 48px statement with an optional 24px line under it
  | { type: "callout"; text: string; body?: string }
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
  | { type: "figures"; items: { image: CaseImage; caption?: string }[] }
  // a row of bordered cards: bold label + medium title over a big light line, centred (Figma 131:232)
  | { type: "blockers"; items: { label: string; title: string; text: string; w: number }[] }
  // a photo beside a stack of bordered cards (bold title, big light line), caption under (Figma 135:252)
  | {
      type: "sketch";
      image?: CaseImage;
      caption: string;
      items: { title: string; text: string }[];
    }
  // phone screens built in code, in a bordered frame (components/TicketmasterPhones.tsx)
  | { type: "phones"; screens: ("explore-4" | "explore-6" | "final-sell" | "final-delivery")[] }
  // a 3-across grid of 3:4 graphics that sweep up into view row by row (Figma 152:2372)
  | { type: "gallery"; images: CaseImage[] }
  // a 48px heading over a stack of bordered 36px lines (Figma 166:2459)
  | { type: "wins"; title: string; items: string[] }
  // closing 48px lines, a blank line apart, 60 under what comes before (Figma 166:3336)
  | { type: "statement"; lines: string[] }
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

const shmood: CaseSection[] = [
  {
    name: "Context",
    blocks: [
      { type: "h", text: "What is Shmood?" },
      {
        type: "p",
        text: "Shmood is a project management tool that bridges the gap between designers and clients, offering a unified platform where creativity thrives through centralized resources, smart communication, and AI-powered feedback synthesis.",
      },
      { type: "kicker", text: "Backed by" },
      {
        type: "logos",
        images: [
          img("02", 438, 110, "Entrepreneur First"),
          img("03", 480, 181, "Transpose Platform"),
          img("04", 394, 88, "Common Magic"),
        ],
      },
      { type: "h", text: "Project Context" },
      {
        type: "lead",
        text: "How might we simplify creative collaboration by uniting client feedback into a seamless workflow for designers?",
      },
      {
        type: "list",
        items: [
          "IDENTIFYING areas of opportunity to ideate new features and build the best platform for DESIGNERS.",
          "CREATING an improved homepage-to-platform experience To get users excited to use the platform.",
        ],
      },
      { type: "sub", text: "So what am I doing?" },
      {
        type: "p",
        text: "Streamlining and maximizing the startup's features and value propositions",
      },
    ],
  },
  {
    name: "Research",
    blocks: [
      { type: "h", text: "User Research" },
      {
        type: "lead",
        text: "Interviews with 30 creatives in over 10 industries",
      },
      {
        type: "p",
        text: "We wanted to gain insights on the how visual designers work with their clients (What’s efficient? What’s not?), the pain points in seeking and receiving feedback, and designers’ comfort with AI in creative workflows.",
      },
      {
        type: "img",
        image: img(
          "05",
          1504,
          604,
          "Four research insights: feedback is scattered, communication is key, emphasizing UVP, ensuring trust in AI",
        ),
      },
      { type: "h", text: "Competitor Analysis" },
      {
        type: "lead",
        text: "We wanted to MAINTAIN Shmood’s unique value proposition",
      },
      {
        type: "p",
        text: "We researched 6+ companies that provide project management solutions for creatives and found some opportunity areas for Shmood:",
      },
      {
        type: "cards",
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
  {
    name: "Design",
    blocks: [
      { type: "h", text: "Feature Ownership" },
      {
        type: "lead",
        text: "I took ownership over Shmood’s onboarding experience and user dashboard",
      },
      {
        type: "p",
        text: "I wanted to present Shmood’s creative and quirky energy to capture new and prospecting users. As our team was also able to create multitudes of new products for Shmood, I was also responsible for creating a centralized system that will house all of the products efficiently.",
      },
      { type: "h", text: "Onboarding Experience" },
      {
        type: "p",
        text: "From the team’s user research and ideation, I was able to identify 3 core value that the onboarding experience had to have",
      },
      {
        type: "chips",
        items: [
          "User Engagement",
          "Clear Value Proposition",
          "For Designers, By Designers",
        ],
      },
      { type: "lead", text: "I started dreaming.*ੈ✩‧₊˚.. and ideating..." },
      {
        type: "p",
        text: "As I began ideating solutions to address user pain points and flow requirements, I was unafraid to challenge convention and aimed to push for creative solutions.  This is how I created my low-fis.",
      },
      {
        type: "cards",
        items: [
          {
            title: "Tell a story",
            text: "Physical Cards with original designs or designs that is made by the Shmood community",
            image: img(
              "06",
              1668,
              2157,
              "Lo-fi sketch: after-initial onboarding and a physical Shmood board",
            ),
          },
          {
            title: "Communicate Value",
            text: "Onboarding video that clearly states the value proposition of Shmood to new users",
            image: img(
              "07",
              1668,
              2157,
              "Lo-fi sketch: onboarding animation and Shmood board",
            ),
          },
          {
            title: "Personalization",
            text: "Adding customizable experiences through physical designer care package, cards, onboarding survey",
            image: img(
              "08",
              1668,
              2157,
              "Lo-fi sketch: physical care package with merch, cards and stickers",
            ),
          },
        ],
      },
      { type: "kicker", text: "*ੈ✩‧₊˚Brand Vision Ideation*ੈ✩‧₊˚" },
      { type: "img", image: img("09", 2000, 553, "Brand vision mood board") },
      { type: "h", text: "Final Onboarding Experience" },
      {
        type: "p",
        text: "My objective for designing the onboarding flow was to communicate a cohesive product story for early access users to easily understand Shmood’s mission, features, differentiation, and impact, while making them feel welcomed in a community.",
      },
      {
        type: "p",
        text: "As observed through our user interviews and analysis of competing product onboarding flows, I needed to prioritize conciseness, creativity and wit in both the visual design, and UX. I also had to work within the constraints of what is feasible and realistic for the company at this scale.",
      },
      { type: "sub", text: "Introduction" },
      {
        type: "p",
        text: "After sign in, the animated onboarding flow is initiated with the user being welcomed into Shmood’s world. This flow is fully automated and made to welcome users.",
      },
      {
        type: "row",
        images: [
          img("10", 766, 471, "Onboarding: Welcome, Matthew"),
          img("11", 765, 470, "Onboarding: Your story shapes our design"),
        ],
      },
      { type: "sub", text: "Questionnaire" },
      {
        type: "p",
        text: "I elevated the generic questionnaire form into an interactive and compelling experience where users indicate their preferences and background in regards to creativity.",
      },
      {
        type: "row",
        images: [
          img("12", 478, 294, "Questionnaire: Which aesthetic speaks to you?"),
          img("13", 765, 470, "Questionnaire: What type of designer are you?"),
        ],
      },
      { type: "sub", text: "Digital Personalized Cards" },
      {
        type: "p",
        text: "Introducing Shmood IDs. I invented a new paradigm to represent the different abstract creative archetypes. I settled on using fruit as a cute and concise way to associate each type of designer with the connotations they bring to the table. Through this creative approach, I wanted to foster user curiosity and platform loyalty.",
      },
      {
        type: "row",
        images: [
          img("14", 406, 254, "Shmood ID card, back: Early Access Member"),
          img("15", 406, 254, "Shmood ID card, front, with a lemon"),
        ],
      },
      { type: "h", text: "User Dashboard" },
      {
        type: "p",
        text: "In order to address the issue of disorganized workflows in projects, I designed a dashboard that integrated feedback, design files, and Shmood boards (Shmood’s version of ideation mood boards) in a unified workspace. This supported designers by:",
      },
      {
        type: "list",
        items: [
          "Providing a high level overview of project progress and key action items",
          "Insuring streamlined access to all necessary resources, all in one place",
        ],
      },
      { type: "sub", text: "Initial Ideas" },
      {
        type: "p",
        text: "I decided to create a dashboard with widgets for each part of the project and feedback process, aiming to display as much related information as possible.",
      },
      { type: "p", text: "This included the following widgets:" },
      {
        type: "chips",
        items: [
          "Project Goals & Timeline",
          "Feedback Center",
          "Client Overview",
          "Ideation Center",
          "Your Notes",
          "Design Files",
        ],
      },
      {
        type: "img",
        image: img("16", 2000, 1761, "Initial dashboard with six widgets"),
      },
      { type: "sub", text: "Final Dashboard Prototype" },
      {
        type: "p",
        text: "However, I realized that too many widgets on the dashboard can lead to a cognitive overload for the users, distracting users from the key tasks and Shmood’s value proposition: Feedback Forms and Shmood Boards.",
      },
      {
        type: "p",
        text: "I decided to keep the relevant widgets and consolidate others to make a more impactful dashboard experience.",
      },
      {
        type: "list",
        items: [
          "Project Overview: Provides designers with a clear and concise view of project progress",
          "Your Files: Easily access all key design files and assets",
          "Feedback Center: Share and receive feedback from clients in a streamlined way",
          "Your Boards: A space for designers to ideate, create Shmood boards, and case their work",
        ],
      },
      {
        type: "img",
        image: img(
          "17",
          2000,
          1304,
          "Final dashboard prototype for a DCC Branding project",
        ),
      },
    ],
  },
  {
    name: "Reflecting",
    blocks: [
      { type: "h", text: "Design Impacts" },
      {
        type: "list",
        items: [
          "My designs along with the team's entire design ecosystem was validated by Shmood's lead engineer and CEO for further implementation.",
          "Creation of dashboard decreased friction in understanding when tested by the internal design team.",
          "The onboarding I created was received well by designers in Shmood and Cornell University and had 34/37 people understanding the value proposition of the platform.",
        ],
      },
      { type: "h", text: "Final Reflections" },
      {
        type: "p",
        text: "I was able to explore and soar through the world of creative expression, yet also ground myself with data driven designs. Through the features I have ownership over, I learned so much about the balance between aesthetics and functionality. If I had more time with this project, I would",
      },
      {
        type: "list",
        items: [
          "Measure the impacts through user testing. Since I had so many mid-fis and had to narrow down features, I would like to conduct A/B testing to see how these designs would play out in real life.",
          "Explore more of in the physical space to see how it can be done regardless of constraints.",
          "Create for non traditional designers, especially for the onboarding as I want my onboarding experience to be effective and appealing to groups beyond who we interviewed.",
        ],
      },
      {
        type: "p",
        text: "Special thanks to Malvika, Jordan, and Daniel, as well as my team that has supported my growth as a product designer in this project :)",
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
    name: "Overview",
    ownLabel: true,
    blocks: [
      {
        type: "group",
        label: "Overview",
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
            ratio: 1314 / 547,
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
            steps: ["Seller’s Ticketmaster Account", "CrowdVolt Inventory", "Buyer’s Ticketmaster Account"],
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
              { title: "Users often buy last-minute at a busy venue", text: "Efficient flow" },
              { title: "Users do not read fine-print", text: "Ease of comprehension" },
              { title: "Users are protective to personal info", text: "Trust built into flow" },
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

export const caseStudies: Record<string, CaseSection[]> = { shmood, crowdvolt };
