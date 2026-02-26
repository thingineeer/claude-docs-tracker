import { redirect } from 'next/navigation';
import { format } from 'date-fns';

export default function ChangesPage() {
  redirect(`/changes/${format(new Date(), 'yyyy-MM-dd')}`);
}
