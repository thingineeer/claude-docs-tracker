import { SidebarTreeDiff } from '@/components/sidebar-tree-diff';

export const revalidate = 3600;

export default function SidebarDiffPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">Sidebar Diff</h1>
        <p className="text-muted text-lg">Track documentation structure changes</p>
      </section>

      <section className="rounded-lg border border-border p-6">
        <h2 className="text-lg font-semibold mb-4">Documentation Structure Changes</h2>
        <SidebarTreeDiff added={[]} removed={[]} />
        <p className="text-sm text-muted mt-4">
          Sidebar structure changes will appear here once the crawler starts tracking.
        </p>
      </section>
    </div>
  );
}
