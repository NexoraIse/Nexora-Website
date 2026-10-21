export interface LearningResource {
  id: string;
  title: string;
  subject: string;
  semester?: number | string;
  category: "notes" | "question_papers" | "tutorials" | "syllabus" | "general";
  description: string;
  fileType?: "PDF" | "DOCX" | "ZIP" | "LINK";
  fileUrl?: string;
  uploadedAt: string;
  tags?: string[];
}

export interface ExamSchedule {
  id: string;
  title: string;
  subject: string;
  subjectCode: string;
  semester: number | string;
  examType: "Internal Assessment" | "Semester End Exam" | "Lab Examination" | "Improvement";
  date: string; // ISO date string (YYYY-MM-DD or full timestamp)
  time: string;
  venue?: string;
  isPublished: boolean;
}

export interface SkillResource {
  id: string;
  title: string;
  category: "Programming" | "Web Development" | "UI/UX Design" | "AI & Data Science" | "Communication & Soft Skills";
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  estimatedTime?: string;
  externalLink: string;
  provider: string;
  tags: string[];
}

// Curated academic resources for Nexora ISE students
export const INITIAL_STUDY_MATERIALS: LearningResource[] = [
  {
    id: "mat-1",
    title: "Data Structures & Applications - Complete Unit-wise Notes",
    subject: "Data Structures & Applications",
    semester: 3,
    category: "notes",
    description: "Handwritten & structured lecture notes covering Stacks, Queues, Linked Lists, Trees, and Graphs with C implementations.",
    fileType: "PDF",
    fileUrl: "https://www.w3schools.com/dsa/",
    uploadedAt: "2026-03-28",
    tags: ["DSA", "C", "Core"]
  },
  {
    id: "mat-2",
    title: "Operating Systems - Process Synchronization & Memory Management",
    subject: "Operating Systems",
    semester: 4,
    category: "notes",
    description: "Detailed breakdown of Semaphores, Deadlock detection, Virtual Memory, Paging, and Page replacement algorithms.",
    fileType: "PDF",
    fileUrl: "https://pages.cs.wisc.edu/~remzi/OSTEP/",
    uploadedAt: "2026-03-24",
    tags: ["OS", "Theory", "Memory"]
  },
  {
    id: "mat-3",
    title: "Database Management Systems - SQL Queries & Normalization Guide",
    subject: "Database Management Systems",
    semester: 4,
    category: "notes",
    description: "Comprehensive cheat-sheet covering 1NF to BCNF normal forms, complex SQL joins, triggers, and ER diagrams.",
    fileType: "PDF",
    fileUrl: "https://www.postgresql.org/docs/current/tutorial.html",
    uploadedAt: "2026-03-20",
    tags: ["DBMS", "SQL", "Database"]
  },
  {
    id: "mat-4",
    title: "Design & Analysis of Algorithms - Previous 3-Year VTU Question Papers",
    subject: "Design and Analysis of Algorithms",
    semester: 4,
    category: "question_papers",
    description: "Compiled semester-end question papers with solved answers for Divide & Conquer, Greedy, and Dynamic Programming.",
    fileType: "PDF",
    fileUrl: "#",
    uploadedAt: "2026-03-15",
    tags: ["DAA", "QP", "Algorithms"]
  },
  {
    id: "mat-5",
    title: "Computer Networks - OSI & TCP/IP Protocols Quick Reference",
    subject: "Computer Networks",
    semester: 5,
    category: "notes",
    description: "Routing algorithms, subnetting calculation workbook, TCP three-way handshake, and socket programming principles.",
    fileType: "PDF",
    fileUrl: "https://beej.us/guide/bgnet/",
    uploadedAt: "2026-03-12",
    tags: ["Networks", "Protocols", "Sockets"]
  },
  {
    id: "mat-6",
    title: "Software Engineering & Project Management - Model QP & Solutions",
    subject: "Software Engineering",
    semester: 5,
    category: "question_papers",
    description: "Agile methodologies, Scrum ceremonies, SRS documentation templates, and past exam questions.",
    fileType: "PDF",
    fileUrl: "#",
    uploadedAt: "2026-03-05",
    tags: ["SE", "Agile", "QP"]
  }
];

// Published examination schedule
export const INITIAL_EXAMS: ExamSchedule[] = [
  {
    id: "exam-1",
    title: "Database Management Systems (21CS42)",
    subject: "Database Management Systems",
    subjectCode: "21CS42",
    semester: 4,
    examType: "Internal Assessment",
    date: "2026-04-18",
    time: "09:30 AM - 11:00 AM",
    venue: "ISE Block - Hall 204",
    isPublished: true
  },
  {
    id: "exam-2",
    title: "Design & Analysis of Algorithms (21CS43)",
    subject: "Design and Analysis of Algorithms",
    subjectCode: "21CS43",
    semester: 4,
    examType: "Internal Assessment",
    date: "2026-04-20",
    time: "09:30 AM - 11:00 AM",
    venue: "ISE Block - Hall 204",
    isPublished: true
  },
  {
    id: "exam-3",
    title: "Operating Systems (21CS44)",
    subject: "Operating Systems",
    subjectCode: "21CS44",
    semester: 4,
    examType: "Internal Assessment",
    date: "2026-04-22",
    time: "09:30 AM - 11:00 AM",
    venue: "ISE Block - Hall 205",
    isPublished: true
  },
  {
    id: "exam-4",
    title: "Full Stack Web Development Lab (21CSL46)",
    subject: "Web Development Lab",
    subjectCode: "21CSL46",
    semester: 4,
    examType: "Lab Examination",
    date: "2026-04-27",
    time: "02:00 PM - 05:00 PM",
    venue: "ISE Computing Lab 2",
    isPublished: true
  },
  {
    id: "exam-5",
    title: "Machine Learning (21CS61)",
    subject: "Machine Learning",
    subjectCode: "21CS61",
    semester: 6,
    examType: "Internal Assessment",
    date: "2026-04-19",
    time: "02:00 PM - 03:30 PM",
    venue: "ISE Seminar Hall",
    isPublished: true
  }
];

// Skill development courses
export const INITIAL_SKILLS: SkillResource[] = [
  {
    id: "skill-1",
    title: "Full-Stack Web Engineering with Next.js 15 & React",
    category: "Web Development",
    description: "Master React Server Components, Tailwind CSS, API routes, and modern web application deployment.",
    difficulty: "Intermediate",
    estimatedTime: "25 hours",
    externalLink: "https://nextjs.org/learn",
    provider: "Official Next.js Tutorial",
    tags: ["React", "Next.js", "TypeScript"]
  },
  {
    id: "skill-2",
    title: "Modern Database Design with PostgreSQL & Supabase",
    category: "Programming",
    description: "Learn relational data modeling, indexing for low-latency queries, Row Level Security (RLS), and edge functions.",
    difficulty: "Beginner",
    estimatedTime: "12 hours",
    externalLink: "https://supabase.com/docs/guides/getting-started",
    provider: "Supabase Docs & Guides",
    tags: ["PostgreSQL", "SQL", "Cloud"]
  },
  {
    id: "skill-3",
    title: "Data Structures & Algorithmic Problem Solving (LeetCode / NeetCode)",
    category: "Programming",
    description: "Structured roadmap to crack technical interviews, covering Arrays, Graphs, Dynamic Programming, and System Design basics.",
    difficulty: "Intermediate",
    estimatedTime: "40 hours",
    externalLink: "https://neetcode.io/roadmap",
    provider: "NeetCode Roadmap",
    tags: ["DSA", "Interviews", "Algorithms"]
  },
  {
    id: "skill-4",
    title: "UI/UX Design Systems & High-Fidelity Prototyping in Figma",
    category: "UI/UX Design",
    description: "Design accessible, futuristic dark-mode user interfaces, typography scales, wireframing, and interactive micro-interactions.",
    difficulty: "Beginner",
    estimatedTime: "15 hours",
    externalLink: "https://www.figma.com/resource-library/design-basics/",
    provider: "Figma Education",
    tags: ["Figma", "UI/UX", "Design Systems"]
  },
  {
    id: "skill-5",
    title: "Practical Machine Learning with Python & Scikit-Learn",
    category: "AI & Data Science",
    description: "Hands-on projects covering regression, classification, clustering, model evaluation, and feature engineering fundamentals.",
    difficulty: "Intermediate",
    estimatedTime: "30 hours",
    externalLink: "https://scikit-learn.org/stable/tutorial/index.html",
    provider: "Scikit-Learn Academy",
    tags: ["Python", "ML", "Data Science"]
  },
  {
    id: "skill-6",
    title: "Technical Writing & Open Source Contribution Guide",
    category: "Communication & Soft Skills",
    description: "Craft clear engineering documentation, write compelling pull requests, and contribute to production open-source repos.",
    difficulty: "Beginner",
    estimatedTime: "8 hours",
    externalLink: "https://opensource.guide/how-to-contribute/",
    provider: "GitHub Open Source Guides",
    tags: ["Git", "Communication", "Open Source"]
  }
];
