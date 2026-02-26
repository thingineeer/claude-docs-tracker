import type { Metadata } from 'next';
import { CalendarView } from '@/components/calendar-view';

export const metadata: Metadata = {
  title: 'Calendar',
  description: 'Monthly calendar view of Claude documentation changes',
};

export default function CalendarPage() {
  return (
    <div className="space-y-6">
      <section className="text-center pt-4 pb-2">
        <h1 className="text-2xl font-bold tracking-tight">Calendar</h1>
        <p className="text-muted text-sm mt-1">
          Monthly overview of documentation changes
        </p>
      </section>
      <CalendarView />
    </div>
  );
}
