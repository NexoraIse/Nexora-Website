/**
 * =============================================================================
 * NEXORA CLUB - HOMEPAGE GALLERY DATA CONFIGURATION
 * =============================================================================
 * 
 * Maintainer Guide:
 * To add or replace photos:
 * 1. Place your photo file (.jpg, .png, .webp, or .svg) inside /public/gallery/
 * 2. Add or update the corresponding entry in GALLERY_ROWS below.
 * 3. Make sure to provide meaningful, descriptive `alt` text for accessibility.
 * 
 * Rows alternate animation directions:
 * - Row 1 & Row 3: Move from Right to Left
 * - Row 2 & Row 4: Move from Left to Right
 */

export interface GalleryItem {
  id: string;
  title: string;
  caption: string;
  category: string;
  date: string;
  location?: string;
  src: string;
  alt: string;
  aspectRatio: string;
  width: number;
  height: number;
}

export const GALLERY_ROWS: GalleryItem[][] = [
  // ---------------------------------------------------------------------------
  // ROW 1: Right-to-Left (Animation: galleryMarqueeLeft)
  // ---------------------------------------------------------------------------
  [
    {
      id: 'gal-ai-vision',
      title: 'AI & Computer Vision Workshop',
      caption: 'Students building real-time object detection models and convolutional neural networks in the ISE computer vision lab.',
      category: 'Workshop',
      date: 'March 2026',
      location: 'ISE Research Lab, AJIET',
      src: '/gallery/ai-vision-lab.svg',
      alt: 'Computer vision workshop terminal showing object detection bounding boxes, neural network layers, and real-time tensor inference',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-ise-lab',
      title: 'ISE Computer Lab & Workstations',
      caption: 'Hands-on practical development sessions and coding labs equipped with modern high-performance workstations.',
      category: 'Community',
      date: 'Academic Year 2025–26',
      location: 'Department of ISE, AJIET',
      src: '/faculty/lab-classroom.jpg',
      alt: 'ISE departmental computer lab classroom showing student workstations, monitors, and laboratory facilities',
      aspectRatio: 'aspect-[4/3]',
      width: 600,
      height: 450,
    },
    {
      id: 'gal-hackathon-arena',
      title: '24-Hour Code Sprint',
      caption: 'Teams collaborating overnight to prototype full-stack solutions, distributed databases, and automated tools.',
      category: 'Hackathon',
      date: 'February 2026',
      location: 'Campus Tech Arena',
      src: '/gallery/hackathon-arena.svg',
      alt: 'Hackathon dual terminal screen displaying git branch merges, algorithmic challenges, and countdown timers',
      aspectRatio: 'aspect-[4/3]',
      width: 800,
      height: 600,
    },
    {
      id: 'gal-peer-mentorship',
      title: 'Senior-Junior Peer Pairing',
      caption: '1-on-1 career navigation, code reviews, and roadmap guidance hosted by graduating seniors.',
      category: 'Community',
      date: 'January 2026',
      location: 'Innovation Hub',
      src: '/gallery/peer-mentorship.svg',
      alt: 'Peer mentorship diagram displaying senior and junior collaborative learning connections and roadmap badges',
      aspectRatio: 'aspect-square',
      width: 600,
      height: 600,
    },
    {
      id: 'gal-cloud-devops',
      title: 'Cloud Architecture & DevOps Masterclass',
      caption: 'Deploying containerized microservices and automated CI/CD pipelines to scalable cloud environments.',
      category: 'Workshop',
      date: 'November 2025',
      location: 'Seminar Hall 2',
      src: '/gallery/cloud-devops.svg',
      alt: 'Kubernetes cloud cluster topology with containerized pods, ingress load balancing, and deployment metrics',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-project-exhibition',
      title: 'Capstone Innovation Expo',
      caption: 'Final-year engineering capstone prototypes and IoT inventions demonstrated before an external industry jury.',
      category: 'Exhibition',
      date: 'December 2025',
      location: 'Central Quadrangle',
      src: '/gallery/project-exhibition.svg',
      alt: 'Capstone engineering exhibition blueprint showing jury evaluation scores, prototype schematics, and patent metrics',
      aspectRatio: 'aspect-[3/2]',
      width: 750,
      height: 500,
    },
  ],

  // ---------------------------------------------------------------------------
  // ROW 2: Left-to-Right (Animation: galleryMarqueeRight)
  // ---------------------------------------------------------------------------
  [
    {
      id: 'gal-inauguration',
      title: 'Nexora Club Grand Inaugural Summit',
      caption: 'Inauguration of the Nexora ISE technical club with departmental faculty, leadership, and student keynote speakers.',
      category: 'Community',
      date: 'October 2025',
      location: 'Main Auditorium',
      src: '/gallery/inauguration-ceremony.svg',
      alt: 'Grand auditorium stage with spotlight beams, Nexora club inaugural keynote display, and audience silhouettes',
      aspectRatio: 'aspect-[21/9]',
      width: 840,
      height: 360,
    },
    {
      id: 'gal-robotics-iot',
      title: 'Embedded Systems & Robotics Lab',
      caption: 'Wiring microcontrollers, testing analog sensors, and calibrating autonomous motor drivers.',
      category: 'Workshop',
      date: 'January 2026',
      location: 'Hardware Systems Lab',
      src: '/gallery/robotics-iot.svg',
      alt: 'Microcontroller hardware circuit board schematic with ESP32 chip pinouts and live oscilloscope waveforms',
      aspectRatio: 'aspect-[3/2]',
      width: 750,
      height: 500,
    },
    {
      id: 'gal-code-wars-flagship',
      title: 'Code Wars Algorithmic Arena',
      caption: 'High-stakes speed programming challenge pitting algorithms against rigorous automated test suites.',
      category: 'Competition',
      date: 'March 2026',
      location: 'Tech Hub Online Arena',
      src: '/events/code-wars.svg',
      alt: 'Code Wars competition illustration with cyber terminal windows, circuit traces, and programming syntax',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-mobile-hack',
      title: 'Mobile App Buildathon',
      caption: 'Rapid cross-platform mobile prototyping using React Native, Expo, and modern gesture interfaces.',
      category: 'Hackathon',
      date: 'November 2025',
      location: 'Lab Classroom 3',
      src: '/gallery/mobile-app-hack.svg',
      alt: 'Smartphone app wireframe mockup with navigation bar, profile feeds, and clean mobile component architecture',
      aspectRatio: 'aspect-square',
      width: 600,
      height: 600,
    },
    {
      id: 'gal-alumni-talk',
      title: 'Alumni Tech Dialogue & Fireside Chat',
      caption: 'Graduates working at top global tech companies sharing architectural lessons and engineering insights.',
      category: 'Community',
      date: 'February 2026',
      location: 'Virtual + Seminar Hall',
      src: '/gallery/alumni-tech-talk.svg',
      alt: 'Fireside chat panel graphic highlighting alumni in tech, system design topics, and interactive Q&A badges',
      aspectRatio: 'aspect-[4/3]',
      width: 800,
      height: 600,
    },
    {
      id: 'gal-data-science',
      title: 'Data Science & Predictive Analytics',
      caption: 'Exploratory data analysis, statistical regression curves, and clustering models using Python libraries.',
      category: 'Workshop',
      date: 'December 2025',
      location: 'ISE Data Lab',
      src: '/gallery/data-science-summit.svg',
      alt: 'Data science laboratory chart with regression curves, scatter plots, and mathematical metric metrics',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
  ],

  // ---------------------------------------------------------------------------
  // ROW 3: Right-to-Left (Animation: galleryMarqueeLeft)
  // ---------------------------------------------------------------------------
  [
    {
      id: 'gal-cyber-ctf',
      title: 'Cyber Quest Capture The Flag (CTF)',
      caption: 'Ethical hacking tournament exploring binary exploitation, web security vulnerabilities, and cryptography.',
      category: 'Competition',
      date: 'January 2026',
      location: 'Cyber Defense Lab',
      src: '/gallery/cyber-security-ctf.svg',
      alt: 'Cybersecurity shield with lock glyph, packet sniffer log output, and cryptographic CTF flag strings',
      aspectRatio: 'aspect-[4/3]',
      width: 800,
      height: 600,
    },
    {
      id: 'gal-open-source',
      title: 'Open Source Community Sprint',
      caption: 'Contributing bug fixes, writing technical documentation, and opening first pull requests on GitHub.',
      category: 'Community',
      date: 'October 2025',
      location: 'Campus Tech Hub',
      src: '/gallery/open-source-day.svg',
      alt: 'Git branch network visual with commit nodes, merged pull request badges, and contributor metrics',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-campus-grounds',
      title: 'AJIET Campus & Tech Hub Grounds',
      caption: 'The vibrant campus environment where technical minds meet, collaborate, and innovate daily.',
      category: 'Community',
      date: '2025–2026',
      location: 'AJIET Campus, Mangaluru',
      src: '/ajiet.jpg',
      alt: 'Photograph of the AJ Institute of Engineering and Technology academic campus building and green grounds',
      aspectRatio: 'aspect-[4/3]',
      width: 600,
      height: 450,
    },
    {
      id: 'gal-ui-ux',
      title: 'UI/UX Design Systems Workshop',
      caption: 'Figma wireframing, crafting WCAG AAA accessible design tokens, and interactive prototyping.',
      category: 'Workshop',
      date: 'December 2025',
      location: 'Design Studio Lab',
      src: '/gallery/ui-ux-design-lab.svg',
      alt: 'Figma canvas mockup with wireframe artboards, color palette tokens, and design system components',
      aspectRatio: 'aspect-[3/2]',
      width: 750,
      height: 500,
    },
    {
      id: 'gal-technova-symposium',
      title: 'TechNova Annual Technical Fest',
      caption: 'Department-wide technical symposium celebrating cutting-edge student projects and research papers.',
      category: 'Technical Fest',
      date: 'February 2026',
      location: 'College Campus',
      src: '/events/technova.svg',
      alt: 'TechNova annual tech symposium illustration with geometric neon tech accents and futuristic typography',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-tech-trivia',
      title: 'Inter-Department Tech Quiz Championship',
      caption: 'Fast-paced buzzer rounds on computer architecture, algorithms, tech history, and open-source trivia.',
      category: 'Competition',
      date: 'November 2025',
      location: 'Auditorium 2',
      src: '/gallery/tech-trivia-buzzer.svg',
      alt: 'Quiz championship buzzer podium with live scoreboard, team scores, and competitive timer countdown',
      aspectRatio: 'aspect-[4/3]',
      width: 800,
      height: 600,
    },
  ],

  // ---------------------------------------------------------------------------
  // ROW 4: Left-to-Right (Animation: galleryMarqueeRight)
  // ---------------------------------------------------------------------------
  [
    {
      id: 'gal-webcraft',
      title: 'Webcraft: Fullstack Next.js Sprint',
      caption: 'Mastering modern React Server Components, server actions, and high-performance Web APIs.',
      category: 'Workshop',
      date: 'February 2026',
      location: 'ISE Software Lab',
      src: '/gallery/web-development-sprint.svg',
      alt: 'Web development browser window mockup showing Next.js code editor and live rendered UI preview',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-game-dev',
      title: '48-Hour Game Dev Showcase',
      caption: 'Building 2D physics puzzles, custom shaders, and retro arcade titles using lightweight game engines.',
      category: 'Hackathon',
      date: 'January 2026',
      location: 'Media Labs',
      src: '/gallery/game-dev-showcase.svg',
      alt: 'Synthwave retro-futuristic grid with 48-hour game development jam banner and arcade start button',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-innovatex',
      title: 'InnovateX Project Showcase',
      caption: 'Student product innovations, software prototypes, and venture ideas presented to mentors.',
      category: 'Exhibition',
      date: 'December 2025',
      location: 'Tech Exhibition Hall',
      src: '/events/innovatex.svg',
      alt: 'InnovateX project exhibition banner illustration with modern tech motif and glowing neon highlights',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-blockchain',
      title: 'Cryptography & Distributed Systems Lab',
      caption: 'Deconstructing decentralized ledgers, cryptographic proofs, and peer-to-peer gossip protocols.',
      category: 'Workshop',
      date: 'November 2025',
      location: 'ISE Seminar Room',
      src: '/gallery/blockchain-lab.svg',
      alt: 'Distributed ledger blockchain blocks interconnected with cryptographic hashes and validation nodes',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
    {
      id: 'gal-awards-gala',
      title: 'Nexora Annual Excellence Awards',
      caption: 'Honoring outstanding student contributors, hackathon champions, and community project leads.',
      category: 'Community',
      date: 'March 2026',
      location: 'Main Auditorium',
      src: '/gallery/annual-awards-gala.svg',
      alt: 'Golden excellence trophy silhouette with confetti particles and Nexora annual awards ceremony text',
      aspectRatio: 'aspect-[21/9]',
      width: 840,
      height: 360,
    },
    {
      id: 'gal-ai-unleashed',
      title: 'AI Unleashed Symposium',
      caption: 'Exploring generative AI, large language models, and responsible AI system architecture.',
      category: 'Technical Fest',
      date: 'October 2025',
      location: 'Central Hall',
      src: '/events/ai-unleashed.svg',
      alt: 'AI Unleashed symposium illustration with neural networks, AI nodes, and radiant gradient energy',
      aspectRatio: 'aspect-[16/9]',
      width: 800,
      height: 450,
    },
  ],
];

/**
 * Flattened list of all gallery items for fast indexed lookup during Lightbox modal navigation.
 */
export const ALL_GALLERY_ITEMS: GalleryItem[] = GALLERY_ROWS.flat();

