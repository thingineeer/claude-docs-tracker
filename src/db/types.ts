export type ChangeType = 'added' | 'modified' | 'removed' | 'sidebar_changed';

export interface Page {
  id: string;
  url: string;
  domain: string;
  section: string | null;
  title: string;
  last_crawled_at: string | null;
  created_at: string;
}

export interface Snapshot {
  id: string;
  page_id: string;
  content_hash: string;
  content_text: string;
  sidebar_tree: Record<string, unknown> | null;
  crawled_at: string;
  created_at: string;
}

export interface Change {
  id: string;
  page_id: string;
  snapshot_before_id: string | null;
  snapshot_after_id: string;
  change_type: ChangeType;
  diff_html: string | null;
  diff_summary: string | null;
  detected_at: string;
  created_at: string;
}

export interface DailyReport {
  id: string;
  report_date: string;
  total_changes: number;
  new_pages: number;
  modified_pages: number;
  removed_pages: number;
  ai_summary: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      pages: {
        Row: Page;
        Insert: Omit<Page, 'id' | 'created_at'>;
        Update: Partial<Omit<Page, 'id'>>;
      };
      snapshots: {
        Row: Snapshot;
        Insert: Omit<Snapshot, 'id' | 'created_at'>;
        Update: Partial<Omit<Snapshot, 'id'>>;
      };
      changes: {
        Row: Change;
        Insert: Omit<Change, 'id' | 'created_at'>;
        Update: Partial<Omit<Change, 'id'>>;
      };
      daily_reports: {
        Row: DailyReport;
        Insert: Omit<DailyReport, 'id' | 'created_at'>;
        Update: Partial<Omit<DailyReport, 'id'>>;
      };
    };
  };
}
