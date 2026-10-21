import type { AchievementItem } from '../types';

/**
 * Nexora ISE Club - Initial Real Achievements Dataset
 * Used as fallback data and database seeding source.
 * Add verified department hackathons, competition triumphs, and student awards here.
 */
const AJIET_ISE_SOURCE = 'https://www.ajiet.edu.in/department-ise.php';

export const INITIAL_ACHIEVEMENTS: AchievementItem[] = [
  {
    id: 'achievement-tech-japan-placement',
    title: 'Placement at Tech Japan',
    slug: 'tech-japan-placement-22-8-lpa',
    description:
      'The department reports a student placement at Tech Japan with a package of 22.8 LPA. The published achievement does not name the student.',
    category: 'Placement',
    competitionOrEvent: 'Tech Japan',
    awardOrPosition: 'Placed · 22.8 LPA',
    achievementDate: '2026-05-28T00:00:00.000Z',
    dateDisplay: 'May 28, 2026',
    image: 'https://www.ajiet.edu.in/aj-admin/photo/achiviment/6/57.jpg',
    externalUrl: AJIET_ISE_SOURCE,
    status: 'PUBLISHED',
  },
  {
    id: 'achievement-dentraze-kscst-exhibition',
    title: 'Dentraze selected for state-level exhibition',
    slug: 'dentraze-kscst-state-level-exhibition',
    description:
      'The Dentraze project was selected for the KSCST State-Level Exhibition and was guided by Prof. Arpitha Kumari G. The published achievement does not name the student team.',
    category: 'Student Project',
    competitionOrEvent: 'KSCST State-Level Exhibition',
    awardOrPosition: 'Selected for exhibition',
    achievementDate: '2026-05-26T00:00:00.000Z',
    dateDisplay: 'May 26, 2026',
    image: 'https://www.ajiet.edu.in/aj-admin/photo/achiviment/6/56.jpg',
    externalUrl: AJIET_ISE_SOURCE,
    status: 'PUBLISHED',
  },
  {
    id: 'achievement-cifra-2k25-hackathon',
    title: 'CIFRA 2K25 Hackathon — first place',
    slug: 'cifra-2k25-hackathon-first-place',
    description:
      'Final-year ISE students Mohammed Bashir Sheban, Mohammed Irfan, Mohammed Faheem, and Mohammad Sinan secured first place and INR 10,000 in the CIFRA 2K25 Hackathon.',
    studentOrTeamName:
      'Mohammed Bashir Sheban, Mohammed Irfan, Mohammed Faheem, and Mohammad Sinan',
    category: 'Hackathon',
    competitionOrEvent: 'CIFRA 2K25 Hackathon',
    awardOrPosition: '1st Place · INR 10,000',
    image: 'https://www.ajiet.edu.in/aj-admin/photo/achiviment/6/43.jpg',
    externalUrl: AJIET_ISE_SOURCE,
    status: 'PUBLISHED',
  },
  {
    id: 'achievement-oralcare-x-kscst',
    title: 'ORALCARE-X named Best Project of the Year',
    slug: 'oralcare-x-kscst-best-project',
    description:
      'ORALCARE-X received Best Project of the Year 2024-25 at the Annual State-Level Project Poster Presentation and Exhibition, part of the 48th Student Project Programme organized by KSCST at JNNCE, Shivamogga. The published achievement does not name the student team.',
    category: 'Project Award',
    competitionOrEvent: '48th Student Project Programme · KSCST',
    awardOrPosition: 'Best Project of the Year (2024-25)',
    dateDisplay: '2024-25',
    image: 'https://www.ajiet.edu.in/aj-admin/photo/achiviment/6/42.jpg',
    externalUrl: AJIET_ISE_SOURCE,
    status: 'PUBLISHED',
  },
  {
    id: 'achievement-daansethu-anveshan',
    title: 'DaanSethu places in the top 7 at Anveshan Fest',
    slug: 'daansethu-anveshan-fest-top-7',
    description:
      'DaanSethu, developed by Athin P B, B Nagendra Nayak, Darpan, and Likith M Shet under the guidance of Prof. Rakesh MR, secured a top-7 position at the state-level Anveshan Fest 2025.',
    studentOrTeamName: 'Athin P B, B Nagendra Nayak, Darpan, and Likith M Shet',
    category: 'Student Project',
    competitionOrEvent: 'State-Level Anveshan Fest 2025',
    awardOrPosition: 'Top 7 at state level',
    dateDisplay: '2025',
    image: 'https://www.ajiet.edu.in/aj-admin/photo/achiviment/6/33.jpg',
    externalUrl: AJIET_ISE_SOURCE,
    status: 'PUBLISHED',
  },
];
