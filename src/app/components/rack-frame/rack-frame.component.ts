import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  CdkDragDrop,
  CdkDragStart,
  moveItemInArray,
  transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CreateGridService } from 'src/app/services/create-grid.service';
import { GameLogicService } from 'src/app/services/game-logic.service';
import { Subscription } from 'rxjs';
import { SourceService } from 'src/app/services/source.service';
import { BoardValidatorService } from 'src/app/services/board-validator.service';

@Component({
  selector: 'app-rack-frame',
  templateUrl: './rack-frame.component.html',
  styleUrls: ['./rack-frame.component.scss'],
})
export class RackFrameComponent implements OnInit, OnDestroy {
  squareIds: string[] = Array(225)
    .fill('')
    .map((x, i) => x + 'square' + i);

  tiles: any[] = [];

  rackSubscription: Subscription | undefined;

  bodyElement: HTMLElement = document.body;

  dragStart(event: CdkDragStart) {
    this.bodyElement.classList.add('inheritCursors');
    this.bodyElement.style.cursor = 'grabbing';
  }

  drop(event: CdkDragDrop<string[]>) {
    this.bodyElement.classList.remove('inheritCursors');
    this.bodyElement.style.cursor = 'unset';
    if (event.previousContainer === event.container) {
      moveItemInArray(
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    } else {
      let tileData: any = event.previousContainer.data[0];
      if (tileData.content.points === 0) tileData.content.letter = '';
      transferArrayItem(
        event.previousContainer.data,
        event.container.data,
        event.previousIndex,
        event.currentIndex
      );
    }
    setTimeout(() => {
      this.gridService.updateGameState(document);
      this.source.isValidMove = this.validate.validate(
        this.gridService.gridState,
        this.source,
        true,
        document
      );
    }, 0);
  }

  constructor(
    private gridService: CreateGridService,
    private gameService: GameLogicService,
    private validate: BoardValidatorService,
    private source: SourceService
  ) {}

  ngOnInit(): void {
    this.rackSubscription = this.source.currentPlayerRack.subscribe(
      (tiles) => (this.tiles = tiles)
    );
    this.gameService.serverCheck(this.source, document);
  }

  ngOnDestroy(): void {
    this.rackSubscription?.unsubscribe();
  }
}
