import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import {
  animate,
  state,
  style,
  transition,
  trigger,
} from '@angular/animations';

import {
  HistoryEntry,
  DefinitionElement,
} from 'src/app/interfaces/history-entry';
import { SourceService } from 'src/app/services/source.service';

// import { def } from '../../../../../../mockHistoryEntries'; //? use to emulate local mock data

@Component({
  selector: 'app-history-table',
  templateUrl: './history-table.component.html',
  styleUrls: ['./history-table.component.scss'],
  animations: [
    trigger('detailExpand', [
      state('collapsed', style({ height: '0px', minHeight: '0' })),
      state('expanded', style({ height: '*' })),
      transition(
        'expanded <=> collapsed',
        animate('700ms cubic-bezier(0.4, 0.0, 0.2, 1)')
      ),
    ]),
    trigger('fadeInOut', [transition('* <=> void', animate(0))]),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistoryTableComponent implements OnInit, AfterViewInit {
  constructor(private source: SourceService, private cd: ChangeDetectorRef) {}

  @ViewChildren('td') td: QueryList<ElementRef>;

  firstTurn = this.source.firstTurn;
  gameOver = this.source.gameOver;

  displayedColumns = ['move', 'opponent', 'player'];

  dataSource: HistoryEntry[] = this.source.history;
  // dataSource: HistoryEntry[] = def; //? mock data for testing located in mockHistoryEntries.ts

  lastEntry: any = this.source.history[this.source.history.length - 1];
  // lastEntry: any = def[def.length - 1]; //? mock data for testing located in mockHistoryEntries.ts

  log(...rest) {
    console.log(...rest);
  }

  expandedElement: DefinitionElement[] | null;

  isExpansionDetailRow = (i: number, row: any) => {
    if (i == 0)
      console.log(this.source.history, this.dataSource, this.lastEntry);

    if (!row.points) return false;
    return true;
  };

  trackByFn(index, item) {
    return index; // or item.id
  }

  ngOnInit(): void {}
  ngAfterViewInit(): void {
    let el = this.td.toArray()[this.dataSource.length - 2]?.nativeElement;
    if (!el) return;
    setTimeout(() => {
      el.scrollIntoView({
        behavior: 'smooth',
      });
    }, 500);
  }
}
