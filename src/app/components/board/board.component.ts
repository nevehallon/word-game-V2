import { AfterViewInit, Component, OnInit } from '@angular/core';
import {
	CdkDrag,
	CdkDragDrop,
	CdkDragStart,
	CdkDropList,
	moveItemInArray,
	transferArrayItem,
} from '@angular/cdk/drag-drop';
import { CreateGridService } from 'src/app/services/create-grid.service';
import { BoardValidatorService } from 'src/app/services/board-validator.service';
import { SourceService } from 'src/app/services/source.service';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { BtnAttrs } from 'src/app/interfaces/btn-attrs';
import { MatDialog } from '@angular/material/dialog';
import { ModalDialogComponent } from '../modal-dialog/modal-dialog.component';

@Component({
	selector: 'app-board',
	templateUrl: './board.component.html',
	styleUrls: ['./board.component.scss'],
})
export class BoardComponent implements OnInit, AfterViewInit {
	isZoomed: boolean = false;

	Math = Math;
	squares: any[] = [];
	// = Array(225)
	//   .fill('')
	//   .map(() => ({ data: [] }));

	btnAttributes!: BtnAttrs;
	btnAttributeSubscription!: Subscription;

	multiplier(num: number) {
		return {
			tw: this.source.tw.includes(num) ? true : false,
			dw: this.source.dw.includes(num) ? true : false,
			tl: this.source.tl.includes(num) ? true : false,
			dl: this.source.dl.includes(num) ? true : false,
		};
	}

	private touchTime = 0;

	zoomAction(e: MouseEvent) {
		if (this.touchTime == 0) {
			// set first click
			this.touchTime = new Date().getTime();
		} else {
			// compare first click to this click and see if they occurred within double click threshold
			if (new Date().getTime() - this.touchTime < 800) {
				// double click occurred
				this.touchTime = 0;
				if (!this.source.isZoomed) {
					return this.zoomIn(e.target as HTMLElement);
				}
				return this.zoomOut();
			} else {
				// not a double click so set as a new first click
				this.touchTime = new Date().getTime();
			}
		}
	}

	zoomOut() {
		if (!this.source.isZoomed) return;
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };

		let $board = document.querySelector('#board')!;

		$board.classList.remove('zoomedIn');
		this.source.isZoomed = false;

		btnAttrs.zoomBtn.isIn = true;

		this.source.changeBtnAttr(btnAttrs);
	}

	zoomIn(target: HTMLElement, overRide: boolean = false) {
		if (this.source.isZoomed && !overRide) return;
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };
		let $board = document.querySelector('#board')!;
		$board.classList.add('zoomedIn');
		this.source.isZoomed = true;
		btnAttrs.zoomBtn.isIn = false;
		this.source.changeBtnAttr(btnAttrs);

		if (overRide) {
			return target.scrollIntoView({
				behavior: 'smooth',
				block: 'center',
				inline: 'center',
			});
		}
		target.scrollIntoView({ block: 'center', inline: 'center' });
	}

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
			transferArrayItem(
				event.previousContainer.data,
				event.container.data,
				event.previousIndex,
				event.currentIndex
			);
		}
		this.repaintBoard();
		setTimeout(() => {
			this.zoomIn(event.container.element.nativeElement, true);

			let data: any = event.container.data[0];

			if (data.content.letter === '') {
				this.dialog.closeAll();
				const dialogRef = this.dialog.open(ModalDialogComponent, {
					maxWidth: '99vw',
					id: 'swapModal',
					disableClose: true,
					data: {
						type: 'blankOptions',
						tileInfo: data,
					},
				});

				dialogRef
					.afterClosed()
					// .pipe(take(1))
					.subscribe(
						(result) => {
							if (result === false) {
								let index = +event.container.element.nativeElement.getAttribute(
									'data-number'
								)!;
								this.squares[index].data = [];
								this.zoomOut();
								return this.source.changeBoard(this.squares);
							}
							data.content = result;
							this.source.changeBoard(this.squares);
							this.zoomIn(event.container.element.nativeElement, true);
						},
						console.error,
						() => this.repaintBoard()
					);
				return;
			}

			this.source.changeBoard(this.squares);
		}, 0);
	}

	repaintBoard() {
		setTimeout(() => {
			this.source.isValidMove = false;
			this.gridService.updateGameState(document);
			this.source.isValidMove = this.validate.validate(
				this.gridService.gridState,
				this.source,
				true,
				document
			);
		}, 0);
	}

	onlyOneTile(item: CdkDrag, list: CdkDropList) {
		if (list.data.length === 1) return false;
		return true;
	}

	constructor(
		private gridService: CreateGridService,
		private source: SourceService,
		public dialog: MatDialog,
		private validate: BoardValidatorService
	) {
		validate.init(this.source);
		this.isZoomed = this.source.isZoomed;
	}

	boardSubscription: Subscription | undefined;

	ngOnInit(): void {
		this.boardSubscription = this.source.currentBoard.subscribe(
			(squares: any[]) => {
				this.squares = squares;
				// if (this.gameService.lettersUsed === 0) return;
				// setTimeout(() => {
				//   this.gridService.updateGameState(document);
				// }, 0);
			}
		);
		this.btnAttributeSubscription = this.source.currentBtnAttr.subscribe(
			(attrs) => {
				this.btnAttributes = attrs;
				// setTimeout(() => {
				//   this.onOff = false;
				// }, 0);
				// setTimeout(() => {
				//   this.onOff = true;
				// }, 0);
			}
		);
	}

	ngOnDestroy(): void {
		this.btnAttributeSubscription?.unsubscribe();
		this.boardSubscription?.unsubscribe();
	}

	ngAfterViewInit(): void {
		this.gridService.updateGameState(document);
	}
}
