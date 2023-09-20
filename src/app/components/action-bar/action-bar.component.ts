import { AfterViewInit, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { take } from 'rxjs/operators';

import { BtnAttrs } from 'src/app/interfaces/btn-attrs';
import { SourceService } from 'src/app/services/source.service';
import { shuffle } from 'lodash-es';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalDialogComponent } from '../modal-dialog/modal-dialog.component';
import { CreateGridService } from 'src/app/services/create-grid.service';
import { GameLogicService } from 'src/app/services/game-logic.service';
import { BoardValidatorService } from 'src/app/services/board-validator.service';

import anime from 'animejs';

@Component({
	selector: 'app-action-bar',
	templateUrl: './action-bar.component.html',
	styleUrls: ['./action-bar.component.scss'],
})
export class ActionBarComponent implements OnInit, AfterViewInit, OnDestroy {
	constructor(
		public source: SourceService,
		public dialog: MatDialog,
		private gridService: CreateGridService,
		public gameService: GameLogicService,
		private validate: BoardValidatorService
	) {
		this.checkAndSetDarkMode(true);
	}

	closeDialog() {
		clearTimeout(this.source.modalTO);
		this.dialog.closeAll();
	}

	public _timeOut!: ReturnType<typeof setTimeout>;

	dialogRef!: MatDialogRef<any> | undefined;

	remainingTiles!: number;

	tiles: any[] = [];
	rackSubscription!: Subscription;

	squares!: any[];
	boardSubscription!: Subscription;

	btnAttributes!: BtnAttrs;
	btnAttributeSubscription!: Subscription;

	isChecked!: boolean;

	/* Body */
	body = document.querySelector('body');

	rematch() {
		window.location.reload();
	}

	mixTiles() {
		// this.closeDialog();
		// this.dialog.open(ModalDialogComponent, {
		//   disableClose: true,
		//   panelClass: 'loadingPanel',
		//   data: {
		//     type: 'loading',
		//     message: 'loading words...',
		//   },
		// }); //? uncomment to test svg loading animation
		if (this.tiles.length < 2) return;

		let shuffledRack =
			this.tiles.length === 2 ? this.tiles.reverse() : shuffle(this.tiles);

		this.source.changePlayerRack(shuffledRack);
	}

	showBagContent() {
		if (!this.source.playersTurn && !this.source.gameOver) return;
		this.closeDialog();

		this.dialog.open(ModalDialogComponent, {
			data: {
				type: 'bag',
			},
		});
	}

	showSettings() {
		if (!this.source.playersTurn && !this.source.gameOver) return;
		this.closeDialog();

		this.dialog.open(ModalDialogComponent, {
			maxWidth: '75vh',
			width: '75%',
			data: {
				type: 'settings',
			},
		});
	}

	prePass(
		wasClicked: boolean | undefined,
		isSwap: boolean | void,
		isAI: boolean | undefined,
		legalClick: boolean | void
	) {
		if (legalClick === false) return;
		this.closeDialog();

		const dialogRef = this.dialog.open(ModalDialogComponent, {
			data: {
				type: 'confirmPass',
			},
		});

		dialogRef
			.afterClosed()
			.pipe(take(1))
			.subscribe((result) => {
				if (!result) {
					return;
				}
				this.gameService.pass(wasClicked, isSwap, isAI, legalClick, document);
				this.zoomOut();
			}, console.error);
	}

	passPlay(action: string) {
		if (!this.source.playersTurn && !this.source.gameOver) return;

		if (action === 'Pass') {
			this.prePass(true, false, false, this.source.playersTurn);

			return;
		}

		let notPlayable = this.gameService.play(false, document);
		if (notPlayable) return;
		this.zoomOut();
	}

	swapRecall(action: string | string[]) {
		if (!this.source.playersTurn && !this.source.gameOver) return;

		if (action.includes('Recall')) {
			let tilesToReturn: any[] = [];
			let newBoard = this.squares.map((square) => {
				if (square.data[0]?.class.includes('hot')) {
					if (square.data[0].content.points === 0) {
						square.data[0].content.letter = '';
					}

					tilesToReturn.push(square.data[0]);
					return { data: [] };
				}
				return square;
			});

			this.source.changeBoard(newBoard);
			this.source.changePlayerRack([...this.tiles, ...tilesToReturn]);

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

			this.zoomOut();

			return;
		}

		this.closeDialog();

		let dialogRef = this.dialog.open(ModalDialogComponent, {
			maxWidth: '75vh',
			minWidth: '42vh',
			id: 'swapModal',
			data: {
				type: 'swap',
				bagLength: this.source.bag.length,
			},
		});
		dialogRef
			.afterClosed()
			.pipe(take(1))
			.subscribe((result) => {
				if (!result) return;

				this.gameService.pass(true, true, false, undefined, document);
			}, console.error);
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
	zoomIn() {
		if (this.source.isZoomed) return;
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };
		let $board = document.querySelector('#board')!;
		let centerSquare = document.querySelector('[data-location="7,7"]')!;
		$board.classList.add('zoomedIn');
		centerSquare.scrollIntoView({ block: 'center', inline: 'center' });
		this.source.isZoomed = true;

		btnAttrs.zoomBtn.isIn = false;

		this.source.changeBtnAttr(btnAttrs);
	}

	showScoreHistory() {
		if (!this.source.playersTurn && !this.source.gameOver) return;

		if (
			this.source.history.length &&
			((this.source.history[this.source.history.length - 2]?.isAI ===
				undefined &&
				this.source.history.length > 1) ||
				this.source.history[this.source.history.length - 1]?.isAI === undefined)
		) {
			if (!this.dialogRef) {
				this.closeDialog();

				this.dialogRef = this.dialog.open(ModalDialogComponent, {
					disableClose: true,
					panelClass: 'loadingPanel',
					data: {
						type: 'loading',
						message: 'loading words...',
					},
				});
			}

			return (this._timeOut = setTimeout(() => {
				this.showScoreHistory();
			}, 500));
		}

		this.dialogRef = undefined;
		clearTimeout(this._timeOut);
		this.closeDialog();

		this.dialog.open(ModalDialogComponent, {
			id: 'historyModal',
			maxHeight: '95vh',
			height: '95vh',
			maxWidth: '75vh',
			width: '99vmin',
			data: {
				type: 'history',
			},
		});
		//show list of moves. who played what and how many points were earned
	}

	toggleThemes() {
		// Dark Mode Action
		let darkMode = localStorage.getItem('darkMode');

		darkMode ? this.disableDarkMode() : this.enableDarkMode();
	}

	// Enable Dark Mode
	enableDarkMode = (init: boolean = false) => {
		this.isChecked = false;
		localStorage.setItem('darkMode', 'true');
		if (init) return;
		return anime({
			targets: '.square',
			scale: [
				{ value: 0.1, easing: 'easeOutSine', duration: 500 },
				{ value: 1, easing: 'easeInOutQuad', duration: 1200 },
			],
			background: [
				{ value: '#4682b4', easing: 'easeInOutQuad', duration: 250 },
			],
			delay: anime.stagger(200, { grid: [15, 15], from: 'center' }),
			complete: (anim) => {
				this.body!.classList.add('dark-mode');
			},
		});
	};

	// Disable Dark Mode
	disableDarkMode = (init: boolean = false) => {
		this.isChecked = true;
		localStorage.setItem('darkMode', '');

		if (init) return;
		return anime({
			targets: '.square',
			scale: [
				{ value: 0.1, easing: 'easeOutSine', duration: 500 },
				{ value: 1, easing: 'easeInOutQuad', duration: 1200 },
			],
			background: [{ value: '#fff', easing: 'easeInOutQuad', duration: 250 }],
			delay: anime.stagger(200, { grid: [15, 15], from: 'center' }),
			complete: (anim) => {
				this.body!.classList.remove('dark-mode');
			},
		});
	};

	checkAndSetDarkMode(init: boolean = false) {
		let darkMode = localStorage.getItem('darkMode');

		darkMode = darkMode === null ? 'true' : darkMode; //? sets default to dark mode

		darkMode ? this.enableDarkMode(init) : this.disableDarkMode(init);
	}



	toggleDebug() {
		this.source.DEBUG_MODE = !this.source.DEBUG_MODE;
	}

	ngAfterViewInit(): void {
		setTimeout(() => {
			this.checkAndSetDarkMode();
		}, 0);
	}

	ngOnInit(): void {
		this.rackSubscription = this.source.currentPlayerRack.subscribe((tiles) => {
			this.tiles = tiles;
			if (!this.source.history.length) {
				this.remainingTiles = this.source.bag.length;
			}
		});
		this.btnAttributeSubscription = this.source.currentBtnAttr.subscribe(
			(attrs) => {
				this.btnAttributes = attrs;
			}
		);
		this.boardSubscription = this.source.currentBoard.subscribe(
			(squares: any[]) => {
				this.squares = squares;
				this.remainingTiles = this.source.bag.length;
			}
		);
	}

	ngOnDestroy(): void {
		this.rackSubscription.unsubscribe();
		this.btnAttributeSubscription.unsubscribe();
		this.boardSubscription.unsubscribe();
	}
}
