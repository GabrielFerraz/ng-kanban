import { DatePipe, NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import { TASK_TYPE_COLORS, Task } from '../../../models/task.model';
import { addDays, daysBetween, durationInDays, endOfWeek, getIsoWeek, isWeekend, parseIsoDate, startOfDay, startOfWeek } from '../../../utils/date.util';

export type GanttSortKey = 'id' | 'type' | 'title' | 'status' | 'startDate' | 'endDate' | 'duration';
export type SortDirection = 'asc' | 'desc';
export interface GanttRow { task: Task; start: Date; end: Date; duration: number; offset: number; color: string; }
export interface GanttDay { date: Date; label: number; weekend: boolean; today: boolean; }
export interface GanttSegment { label: string; days: number; }
export interface GanttConnector { path: string; blocked: boolean; }

@Component({
  selector: 'app-gantt-chart',
  standalone: true,
  imports: [NgClass, NgStyle, DatePipe],
  templateUrl: './gantt-chart.component.html',
  styleUrl: './gantt-chart.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GanttChartComponent {
  tasks = input<Task[]>([]);
  leftPane = viewChild<ElementRef<HTMLDivElement>>('leftPane');
  rightPane = viewChild<ElementRef<HTMLDivElement>>('rightPane');
  readonly dayWidth = 32;
  readonly rowHeight = 40;
  readonly headerRowHeight = 28;
  sortKey = signal<GanttSortKey>('startDate');
  sortDirection = signal<SortDirection>('asc');
  private syncing = false;
  headerHeight = computed(() => this.headerRowHeight * 3);
  private baseRows = computed(() => (this.tasks() ?? []).map((task) => this.toRow(task)));
  private timeline = computed(() => {
    const rows = this.baseRows();
    if (!rows.length) return null;
    const minStart = new Date(Math.min(...rows.map((row) => row.start.getTime())));
    const maxEnd = new Date(Math.max(...rows.map((row) => row.end.getTime())));
    const start = addDays(startOfWeek(minStart), -7);
    const end = addDays(endOfWeek(maxEnd), 7);
    return { start, end };
  });
  days = computed(() => { const timeline = this.timeline(); return timeline ? this.buildDays(timeline.start, timeline.end) : []; });
  months = computed(() => this.buildMonths(this.days()));
  weeks = computed(() => this.buildWeeks(this.days()));
  rows = computed(() => {
    const timeline = this.timeline();
    if (!timeline) return [];
    return this.sortRows(this.baseRows().map((row) => ({ ...row, offset: daysBetween(timeline.start, row.start) })));
  });
  connectors = computed(() => this.buildConnectors(this.rows()));
  todayOffset = computed(() => {
    const timeline = this.timeline();
    if (!timeline) return null;
    const today = startOfDay(new Date());
    return today >= timeline.start && today <= timeline.end ? daysBetween(timeline.start, today) : null;
  });
  timelineWidth = computed(() => this.days().length * this.dayWidth);
  timelineHeight = computed(() => this.rows().length * this.rowHeight);
  sortBy(key: GanttSortKey): void {
    if (this.sortKey() === key) this.sortDirection.update((direction) => (direction === 'asc' ? 'desc' : 'asc'));
    else { this.sortKey.set(key); this.sortDirection.set('asc'); }
  }
  sortIcon(key: GanttSortKey): string { return this.sortKey() === key ? (this.sortDirection() === 'asc' ? '▲' : '▼') : ''; }
  syncScroll(source: 'left' | 'right'): void {
    const from = source === 'left' ? this.leftPane() : this.rightPane();
    const to = source === 'left' ? this.rightPane() : this.leftPane();
    if (!from || !to) return;
    if (this.syncing) { this.syncing = false; return; }
    if (to.nativeElement.scrollTop !== from.nativeElement.scrollTop) {
      this.syncing = true;
      to.nativeElement.scrollTop = from.nativeElement.scrollTop;
    }
  }
  private toRow(task: Task): GanttRow {
    const today = startOfDay(new Date());
    const start = parseIsoDate(task.startDate) ?? today;
    const parsedEnd = parseIsoDate(task.endDate) ?? start;
    const end = parsedEnd < start ? start : parsedEnd;
    return { task, start, end, duration: durationInDays(start, end), offset: 0, color: TASK_TYPE_COLORS[task.type] ?? '#828fa3' };
  }
  private buildDays(from: Date, to: Date): GanttDay[] {
    const days: GanttDay[] = [];
    const today = startOfDay(new Date()).getTime();
    for (let i = 0; i <= daysBetween(from, to); i++) { const date = addDays(from, i); days.push({ date, label: date.getDate(), weekend: isWeekend(date), today: date.getTime() === today }); }
    return days;
  }
  private buildMonths(days: GanttDay[]): GanttSegment[] { return this.groupDays(days, (day) => day.date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })); }
  private buildWeeks(days: GanttDay[]): GanttSegment[] { return this.groupDays(days, (day) => `W${getIsoWeek(day.date)}`); }
  private groupDays(days: GanttDay[], labelFor: (day: GanttDay) => string): GanttSegment[] {
    const segments: GanttSegment[] = [];
    days.forEach((day) => { const label = labelFor(day); const current = segments[segments.length - 1]; if (current && current.label === label) current.days++; else segments.push({ label, days: 1 }); });
    return segments;
  }
  private sortRows(rows: GanttRow[]): GanttRow[] { const direction = this.sortDirection() === 'asc' ? 1 : -1; return [...rows].sort((a, b) => this.compare(a, b) * direction || this.compareIds(a, b)); }
  private compare(a: GanttRow, b: GanttRow): number {
    switch (this.sortKey()) {
      case 'id': return this.compareIds(a, b);
      case 'type': return a.task.type.localeCompare(b.task.type);
      case 'title': return a.task.title.localeCompare(b.task.title);
      case 'status': return a.task.status.localeCompare(b.task.status);
      case 'endDate': return a.end.getTime() - b.end.getTime();
      case 'duration': return a.duration - b.duration;
      default: return a.start.getTime() - b.start.getTime();
    }
  }
  private compareIds(a: GanttRow, b: GanttRow): number { return a.task.id.localeCompare(b.task.id, undefined, { numeric: true }); }
  private buildConnectors(rows: GanttRow[]): GanttConnector[] {
    const indexById = new Map(rows.map((row, index) => [row.task.id, index]));
    const connectors: GanttConnector[] = [];
    rows.forEach((row, toIndex) => {
      (row.task.dependencies ?? []).forEach((depId) => {
        const fromIndex = indexById.get(depId);
        if (fromIndex === undefined) return;
        const fromRow = rows[fromIndex];
        const x1 = (fromRow.offset + fromRow.duration) * this.dayWidth;
        const y1 = fromIndex * this.rowHeight + this.rowHeight / 2;
        const x2 = row.offset * this.dayWidth;
        const y2 = toIndex * this.rowHeight + this.rowHeight / 2;
        const midX = x1 + Math.max((x2 - x1) / 2, 12);
        connectors.push({
          path: `M ${x1} ${y1} C ${midX} ${y1}, ${midX} ${y2}, ${x2} ${y2}`,
          blocked: fromRow.end.getTime() >= row.start.getTime(),
        });
      });
    });
    return connectors;
  }
}
