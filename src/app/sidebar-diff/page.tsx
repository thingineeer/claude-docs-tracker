import { SidebarTreeDiff } from '@/components/sidebar-tree-diff';

export const revalidate = 3600;

export default function SidebarDiffPage() {
  return (
    <div className="space-y-8">
      <section className="text-center py-8">
        <h1 className="text-3xl font-bold mb-2">Sidebar Diff</h1>
        <p className="text-muted text-lg">Track documentation structure changes</p>
      </section>

      <section className="rounded-lg border border-border p-8">
        <div className="flex flex-col items-center text-center max-w-md mx-auto">
          <svg className="w-16 h-16 text-muted/40 mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <h2 className="text-lg font-semibold mb-2">No Sidebar Changes Yet</h2>
          <p className="text-sm text-muted mb-4">
            크롤러가 문서 사이드바 구조를 수집하면 여기에 변경사항이 표시됩니다.
          </p>
          <div className="w-full rounded-lg bg-surface p-4 text-left text-xs space-y-2">
            <div className="flex items-center gap-2 text-muted">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>첫 수집 예정: 매일 KST 09:00</span>
            </div>
            <div className="flex items-center gap-2 text-muted">
              <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
              <span>수동 트리거: <code className="bg-background px-1 py-0.5 rounded font-mono">POST /api/crawl</code></span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
