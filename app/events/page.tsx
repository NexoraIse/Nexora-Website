import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import EventsPageContent from '@/components/events/EventsPageContent';
import ContourBackdrop from '@/components/ContourBackdrop';
import { getAllEvents } from '@/lib/events-data';

export const metadata: Metadata = {
  title: 'Events & Hackathons | Nexora ISE Club',
  description:
    'Explore hackathons, technical symposiums, AI workshops, cybersecurity competitions, and project exhibitions hosted by the Nexora Information Science and Engineering Club.',
  keywords: [
    'Nexora',
    'ISE Club',
    'Events',
    'Hackathon',
    'Code Wars',
    'TechNova',
    'AI Unleashed',
    'WebCraft',
    'Cyber Quest',
    'InnovateX',
  ],
  openGraph: {
    title: 'Events | Nexora ISE Club',
    description:
      'Where Ideas Become Innovation. Explore upcoming student technical events at Nexora ISE Club.',
    type: 'website',
  },
};

export default function EventsPage() {
  const events = getAllEvents();

  return (
    <main className="relative min-h-screen w-full isolate bg-[var(--theme-bg-main,#060913)] text-[var(--theme-bg-hero,#dce6ef)]">
      <ContourBackdrop />

      <Navbar />

      <div className="relative z-10">
        <EventsPageContent initialEvents={events} />
      </div>

      <Footer />
    </main>
  );
}
