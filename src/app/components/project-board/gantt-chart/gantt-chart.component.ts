import { DatePipe, NgClass, NgStyle } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, Input, OnChanges, ViewChild } from '@angular/core';
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
export class GanttChartComponent implements OnChanges {
  @Input() tasks: Task[] = [];
  @Input() darkMode = false;
  @ViewChild('leftPane') leftPane?: ElementRef<HTMLDivElement>;
  @ViewChild('rightPane') rightPane?: ElementRef<HTMLDivElement>;
  readonly dayWidth = 32;
  readonly rowHeight = 40;
  readonly headerRowHeight = 28;
  sortKey: GanttSortKey = 'startDate';
  sortDirection: SortDirection = 'asc';
  rows: GanttRow[] = [];
  days: GanttDay[] = [];
  months: GanttSegment[] = [];
  weeks: GanttSegment[] = [];
  connectors: GanttConnector[] = [];
  todayOffset: number | null = null;
  private syncing = false;
  get headerHeight(): number { return this.headerRowHeight * 3; }
  get timelineWidth(): number { return this.days.length * this.dayWidth; }
  get timelineHeight(): number { return this.rows.length * this.rowHeight; }
  ngOnChanges(): void { this.buildTimeline(); }
  sortBy(key: GanttSortKey): void {
    if (this.sortKey === key) this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    else { this.sortKey = key; this.sortDirection = 'asc'; }
    this.rows = this.sortRows(this.rows);
  }
  sortIcon(key: GanttSortKey): string { return this.sortKey === key ? (this.sortDirection === 'asc' ? '▲' : '▼') : ''; }
  syncScroll(source: 'left' | 'right'): void {
    const from = source === 'left' ? this.leftPane : this.rightPane;
    const to = source === 'left' ? this.rightPane : this.leftPane;
    if (!from || !to) return;
    if (this.syncing) { this.syncing = false; return; }
    if (to.nativeElement.scrollTop !== from.nativeElement.scrollTop) {
      this.syncing = true;
      to.nativeElement.scrollTop = from.nativeElement.scrollTop;
    }
  }
  private buildTimeline(): void {
    const rows = (this.tasks ?? []).map((task) => this.toRow(task));
    if (!rows.length) { this.rows = []; this.days = []; this.months = []; this.weeks = []; this.todayOffset = null; return; }
    const minStart = new Date(Math.min(...rows.map((row) => row.start.getTime())));
    const maxEnd = new Date(Math.max(...rows.map((row) => row.end.getTime())));
    const timelineStart = addDays(startOfWeek(minStart), -7);
    const timelineEnd = addDays(endOfWeek(maxEnd), 7);
    this.days = this.buildDays(timelineStart, timelineEnd);
    this.months = this.buildMonths(this.days);
    this.weeks = this.buildWeeks(this.days);
    this.rows = this.sortRows(rows.map((row) => ({ ...row, offset: daysBetween(timelineStart, row.start) })));
    const today = startOfDay(new Date());
    this.todayOffset = today >= timelineStart && today <= timelineEnd ? daysBetween(timelineStart, today) : null;
    this.connectors = this.buildConnectors(this.rows);
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
  private sortRows(rows: GanttRow[]): GanttRow[] { const direction = this.sortDirection === 'asc' ? 1 : -1; return [...rows].sort((a, b) => this.compare(a, b) * direction || this.compareIds(a, b)); }
  private compare(a: GanttRow, b: GanttRow): number {
    switch (this.sortKey) {
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
