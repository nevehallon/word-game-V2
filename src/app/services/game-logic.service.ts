import { Injectable } from '@angular/core';
import { pullAt, shuffle, cloneDeep } from 'lodash-es';
import { ComputeService } from './compute.service';
import { CreateGridService } from './create-grid.service';
import { BoardValidatorService } from './board-validator.service';
import { SourceService } from './source.service';
import { Square } from '../interfaces/square';
import { BtnAttrs } from '../interfaces/btn-attrs';

import { take } from 'rxjs/operators';

import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { ModalDialogComponent } from '../components/modal-dialog/modal-dialog.component';
import { DialogData } from '../interfaces/dialog-data';
import { GetRequestsService } from './get-requests.service';

import * as localforage from 'localforage';

import { driver } from "driver.js";
import { useSteps } from '../utils/driver';
// import "driver.js/dist/driver.css";

@Injectable({
	providedIn: 'root',
})
export class GameLogicService {
	constructor(
		public dialog: MatDialog,
		private calc: ComputeService,
		private gridService: CreateGridService,
		private validate: BoardValidatorService,
		private source: SourceService,
		private http: GetRequestsService
	) { }

	public dialogRef!: MatDialogRef<any>;

	hints: any = JSON.parse(localStorage.getItem('hints') ?? 'null') || {
		show: true,
	};

	storageAvailable(type: any) {
		let storage: any;
		try {
			storage = window[type];
			let x = '__storage_test__';
			storage.setItem(x, x);
			storage.removeItem(x);
			return true;
		} catch (e) {
			throw (
				e instanceof DOMException &&
				// everything except Firefox
				(e.code === 22 ||
					// Firefox
					e.code === 1014 ||
					// test name field too, because code might not be present
					// everything except Firefox
					e.name === 'QuotaExceededError' ||
					// Firefox
					e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
				// acknowledge QuotaExceededError only if there's something already stored
				storage &&
				storage.length !== 0
			);
		}
	}

	serverCheck = async (check: SourceService, $document: Document) => {
		try {
			this.storageAvailable('localStorage');

			await localforage.ready();
			// This code runs once localforage
			// has fully initialized the selected driver.
			console.log(await localforage.driver()); // LocalStorage
		} catch (error) {
			// `No available storage method found.`
			// One of the cases that `ready()` rejects,
			// is when no usable storage driver is found
			let data: DialogData = {
				type: 'message',
				message: `Oops!<br/> Insufficient storage on your device or browser. Please consider fixing this if you want to enjoy the game. <br />
        ${error}`,
			};
			this.closeDialog();
			return (this.dialogRef = this.dialog.open(ModalDialogComponent, {
				disableClose: true,
				id: 'error',
				maxWidth: '99vw',
				data: data,
			}));
		}

		if (!this.source.loaderShown) {
			this.source.loaderShown = true;
			this.closeDialog();
			this.dialogRef = this.dialog.open(ModalDialogComponent, {
				disableClose: true,
				panelClass: 'loadingPanel',
				maxWidth: '75vh',
				id: '#swapModal',
				data: {
					type: 'loading',
					message: 'Loading Resources...',
					notes:
						'*Please note*<br /><br /> If this is your first visit (in while)<br /> it might take time till everything loads<br /><br /> do not close this browser',
				},
			});
		}
		let status = await this.http.checkServerStatus();
		let TO: ReturnType<typeof setTimeout>;
		if (status) {
			let start = () => {
				this.closeDialog();
				this.source.loaderShown = false;
				if (
					(!this.source.tutorialGiven && this.hints.show) ||
					!localStorage.getItem('logoShown')
				) {
					return this.showRules($document);
				}
				return this.startGame($document);
			};
			let checkHasList = () => {
				clearTimeout(TO);
				console.log('word list has loaded:', check.getHasList());
				if (check.getHasList()) {
					return start();
				}
				return (TO = setTimeout(() => {
					checkHasList();
				}, 2500));
			};
			if (!check.getHasList()) {
				return checkHasList();
			}
			return start();
		}
		TO = setTimeout(() => {
			this.serverCheck(check, $document);
		}, 2222);
	};

	showRules($document: Document) {
		this.closeDialog();

		this.dialogRef = this.dialog.open(ModalDialogComponent, {
			data: {
				type: 'introRules',
			},
			id: 'rules-modal',
			maxHeight: '95vh',
			maxWidth: '75vh',
			width: '99vw',
		});

		this.dialogRef
			.afterClosed()
			// .pipe(take(1))
			.subscribe((result) => {
				this.giveTour($document);
			}, console.error);
	}

	giveTour($document: Document) {
		const driverObj = driver({
			popoverClass: 'toolTip', // className to wrap driver.js popover
			allowClose: false, // Whether clicking on overlay should close or not
			doneBtnText: 'Done', // Text on the final button
			nextBtnText: 'Next', // Next button text for this step
			prevBtnText: 'Previous', // Previous button text for this step
			allowKeyboardControl: false, // Allow controlling through keyboard (escape to close, arrow keys to move),
			stagePadding: 0,

			// overlayClickNext: true, // Should it move to next step on overlay click
		});
		const steps = useSteps(this, $document, driverObj.destroy)
		// Define the steps for introduction
		driverObj.setSteps(steps);
		// Start the introduction
		driverObj.drive();
	}

	closeDialog(timeOut: number = 0) {
		clearTimeout(this.source.modalTO);
		if (!timeOut) return this.dialog.closeAll();
		this.source.modalTO = setTimeout(() => {
			this.dialog.closeAll();
		}, timeOut);
	}

	deal2Player() {
		// let mockRack = [{ letter: 'W', points: 4 }]; // [{ letter: 'Z', points: 10 }]; //? text words by dealing your self any rack
		let playerRack = [];
		for (let i = 0; i < 7; i++) {
			let tile = pullAt(this.source.bag, [0])[0];
			// let tile = pullAt(mockRack, [0])[0]; //? text words by dealing your self any rack
			playerRack.push(tile);
		}
		return playerRack;
	}

	deal2PC() {
		for (let i = 0; i < 7; i++) {
			this.source.rivalRack.push(pullAt(this.source.bag, [0])[0]);
		}
	}

	whoStarts() {
		let bagSim = shuffle(this.source.bag);
		return {
			player: pullAt(bagSim, [0])[0].letter,
			pc: pullAt(bagSim, [0])[0].letter,
		};
	}

	startGame($document: Document): void {
		let { player, pc } = this.whoStarts();
		if (player === pc) return this.startGame($document);

		let playerRack;
		let data: DialogData;
		if (player < pc /* || true */) {
			/*            ^           ^
			? uncomment     "|| true" so that player gets first turn
			 */
			playerRack = this.deal2Player();
			this.deal2PC();
			this.source.playersTurn = true;
			data = {
				type: 'message',
				message: 'You won the draw and will start',
			};

			this.closeDialog();
			this.dialogRef = this.dialog.open(ModalDialogComponent, {
				data: data,
			});
			this.closeDialog(2250);
			if (this.source.DEBUG_MODE) {
				this.source.playersTurn = true;
				this.pcPlay($document);
			}
		} else {
			this.source.playersTurn = false;
			this.deal2PC();
			playerRack = this.deal2Player();
			data = {
				type: 'message',
				message: 'Opponent won the draw and will start',
			};

			this.closeDialog(); //? closing any previously open dialog
			this.dialogRef = this.dialog.open(ModalDialogComponent, {
				data: data,
			});
			this.closeDialog(2250);
			setTimeout(() => {
				this.pcPlay($document);
			}, 3000);
		}
		playerRack = playerRack.map((x, i) => ({
			content: x,
			id: `tile${i}`,
			class: ['tile', 'hot'],
			'data-drag': i,
		}));

		this.source.changePlayerRack(playerRack);
	}

	repaintBoard($document: Document) {
		this.source.isValidMove = false;
		this.gridService.updateGameState($document);
		this.source.isValidMove = this.validate.validate(
			this.gridService.gridState,
			this.source,
			true,
			$document
		);
	}

	pcSwap($document: Document) {
		//? .sort((a,b) => b > a ? -1 : 1).filter(x => x !== 0) //for sorting by point value and removing blank tiles
		let numTilesLeftInBag = this.source.bag.slice(0, 7).length;
		let tilesLeftInRivalRack = this.source.rivalRack.slice(0, 7);
		let numTilesLeftInRivalRack = this.source.rivalRack.slice(0, 7).length;

		let bool = numTilesLeftInBag <= numTilesLeftInRivalRack;
		let maxNumTilesToSwap = bool ? numTilesLeftInBag : numTilesLeftInRivalRack;

		this.source.rivalRack = bool
			? this.source.rivalRack.slice(0, 7 - maxNumTilesToSwap)
			: this.source.rivalRack.slice(7 - maxNumTilesToSwap);

		for (let i = 0; i < maxNumTilesToSwap; i++) {
			if (this.source.bag.length) {
				this.source.rivalRack.push(pullAt(this.source.bag, [0])[0]);
			}
		}

		this.source.bag.push(...tilesLeftInRivalRack.slice(0, maxNumTilesToSwap));
		this.source.bag = shuffle(shuffle(this.source.bag));
		console.log(this.source.rivalRack, this.source.bag);
		this.source.passCount = -1;
		this.pass(true, true, true, undefined, $document);

		//toggle modal
		this.closeDialog();
		this.dialogRef = this.dialog.open(ModalDialogComponent, {
			data: {
				type: 'message',
				message: 'Opponent chose to swap tiles',
			},
		});
		this.closeDialog(2250);
	}

	pcPlay($document: Document) {
		let board: any = this.source.getBoard();
		let newBoard = board.map((square: Square) => {
			if (square?.data[0]?.class?.includes('pcPlay')) {
				let obj = square.data[0];
				return {
					data: [
						{
							...obj,
							class: obj?.class?.filter((klass) => klass !== 'pcPlay'),
						},
					],
				};
			}
			return square;
		});

		this.source.changeBoard(newBoard);
		this.gridService.updateGameState($document);

		this.closeDialog();
		this.dialogRef = this.dialog.open(ModalDialogComponent, {
			disableClose: true,
			panelClass: 'loadingPanel',
			data: {
				type: 'loading',
				message: 'Opponent is thinking...',
			},
		});
		//^^ toggle modal
		this.source.playersTurn = false;

		// if (rivalRack.length < 7 && !bag.length && prompt()) {
		//   rivalRack = Array(7).fill({ letter: "Q", points: 10 });
		// }
		// this.source.rivalRack = [{ letter: 'W', points: 4 }]; //? uncomment for testing

		this.source.rivalRack.sort((a, b) => (b.letter ? 1 : -1)); //make sure that blanks are last tile
		setTimeout(async () => {
			try {
				this.source.isValidMove = await this.calc.calcPcMove(
					this.gridService.gridState,
					$document
				);
				// prettier-ignore
				!this.source.isValidMove && this.source.rivalRack.length && this.source.bag.length ?
					this.pcSwap($document) : this.source.isValidMove ?
						this.play(true, $document) : this.source.DEBUG_MODE ?
							false : this.pass(true, false, true, undefined, $document);
			} catch (error: any) {
				if (error?.message?.includes('ranch')) {
					return console.error(error);
				}

				console.error(error);
				this.pcPlay($document);
			}
		}, 250);
	}

	endGame($document: Document) {
		this.source.gameOver = true;
		let board: Square[] = this?.source?.getBoard() ?? [];

		//?prevent players from continuing

		board.forEach((x, i) => {
			if (x?.data[0]?.coords) {
				this.source.dl = this.source.dl.filter((num) => num !== i);
				this.source.dw = this.source.dw.filter((num) => num !== i);
				this.source.tl = this.source.tl.filter((num) => num !== i);
				this.source.tw = this.source.tw.filter((num) => num !== i);
			}
		});

		//?remove hot tiles from board
		let playerScore = this.source.playerScore;
		let computerScore = this.source.computerScore;

		if (!this.source.rivalRack.length) {
			let sum = (this?.source?.getPlayerRack() ?? [])?.reduce(
				(acc: number, cur: any) => acc + cur.content.points,
				0
			);

			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(() => {
				this.source.history[index] = {
					isAI: true,
					points: '',
					score: {
						computerScore: `${computerScore} + ${sum}`,
						playerScore: `${playerScore} - ${sum}`,
					},
					word:
						(playerScore -= sum) == (computerScore += sum)
							? 'Tie,'
							: playerScore < computerScore
								? 'Opponent Won'
								: 'Player Won',
					skip: false,
				};
				this.source.playerScore = playerScore < 0 ? 0 : playerScore;
				this.source.computerScore = computerScore < 0 ? 0 : computerScore;
				//? deduct points from player and give them to AI
			}, 0);
		} else if (!$document.querySelectorAll('#rack .tile').length) {
			let sum = this.source.rivalRack.reduce((acc, cur) => acc + cur.points, 0);

			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(() => {
				this.source.history[index] = {
					isAI: false,
					points: '',
					score: {
						computerScore: `${computerScore} - ${sum}`,
						playerScore: `${playerScore} + ${sum}`,
					},
					word:
						(playerScore += sum) == (computerScore -= sum)
							? 'Tie'
							: playerScore > computerScore
								? 'Player Won'
								: 'Opponent Won',
					skip: false,
				};
				this.source.playerScore = playerScore < 0 ? 0 : playerScore;
				this.source.computerScore = computerScore < 0 ? 0 : computerScore;
				//? deduct points from AI and give them to player
			}, 0);
		} else {
			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(() => {
				this.source.history[index] = {
					isAI: false,
					points: '',
					score: {
						computerScore,
						playerScore,
					},
					word:
						playerScore == computerScore
							? 'Tie'
							: playerScore > computerScore
								? 'Player Won'
								: 'Opponent Won',
					skip: false,
				};
			}, 0);
		}

		let time = 1650;
		if (!this.dialogRef.getState()) time *= 3;
		setTimeout(() => {
			let winnerMsg =
				playerScore == computerScore
					? 'Tie'
					: playerScore > computerScore
						? 'You Won'
						: 'Opponent Won';

			this.closeDialog();
			this.dialogRef = this.dialog.open(ModalDialogComponent, {
				data: {
					type: 'message',
					message: `${winnerMsg}, Good Game`,
					player: `Player: ${this.source.playerScore}`,
					opponent: `Opponent: ${this.source.computerScore}`,
					buttons: ['Close', 'Rematch'],
					btnCloseData: [false, true],
				},
			});

			this.dialogRef
				.afterClosed()
				// .pipe(take(1))
				.subscribe((result) => {
					if (!result) {
						return;
					}
					window.location.reload(); //TODO: make all data, services and components reinitialize without reloading page
				});
		}, time);

		//in modal display:
		//  both players points
		//  declare winner
		//  offer rematch
	}

	pass(
		wasClicked = false,
		isSwap: boolean | void,
		isAI: boolean | undefined,
		legalClick: boolean | void,
		$document: Document
	) {
		if (legalClick === false) return false;
		//if param = true ->
		//    add to passCount

		if (isSwap !== undefined) {
			let computerScore = this.source.computerScore;
			let playerScore = this.source.playerScore;

			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(() => {
				this.source.history[index] = {
					isAI: isAI,
					score: {
						computerScore,
						playerScore,
					},
					skip: { isSwap: isSwap },
				};
			}, 0);
		}

		if (wasClicked) {
			if (isAI) {
				this.closeDialog();
				this.dialogRef = this.dialog.open(ModalDialogComponent, {
					data: {
						type: 'message',
						message: 'Opponent chose to pass',
					},
				});
				this.closeDialog(2250);
			}
			this.source.passCount++;
		}
		//if param = false ->
		//    make sure firstTurn is set to false
		//    reset passCount to equal 0
		if (!wasClicked) {
			if (this.source.firstTurn) this.source.firstTurn = false;
			this.source.passCount = 0;
		}
		//if passCount = 4 ->
		//    end game
		if (this.source.passCount === 4) {
			this.endGame($document);
			return false;
		}
		//    allow next turn
		if (this.source.DEBUG_MODE) this.source.firstTurn = false;
		setTimeout(() => {
			this.source.playersTurn || this.source.DEBUG_MODE
				? this.pcPlay($document)
				: (this.source.playersTurn = true);
		}, 250);
		return false; //? remove extra style from tiles that AI played
	}

	play(isAI = false, $document: Document) {
		if (!this.source.isValidMove.words && this.source.DEBUG_MODE) {
			this.source.playersTurn = true;
		}
		let board: Square[] = this?.source?.getBoard() ?? [];

		if (!this.source.isValidMove.words) {
			let data: DialogData = {
				type: 'message',
				message: `${this.source.isValidMove.slice(4)}`,
				buttons: ['Close'],
				btnCloseData: [false],
			};
			this.closeDialog();
			this.dialogRef = this.dialog.open(ModalDialogComponent, {
				id: 'error',
				maxWidth: '99vw',
				data: data,
			});
			return true;
		}

		if (this.source.isValidMove.hasOwnProperty('rivalRack')) {
			this.source.computerScore += this.source.isValidMove.pointTally;

			let points = this.source.isValidMove.pointTally;
			let computerScore = this.source.computerScore;
			let playerScore = this.source.playerScore;
			let word = this.source.isValidMove.wordsPlayed
				.map((x: string) => {
					let word = x[0].toUpperCase() + x.slice(1).toLowerCase();
					return `${word}`;
				})
				.join(', ');

			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(async () => {
				this.source.history[index] = {
					isAI: true,
					word,
					definitions: await this.http.getDefinitions(word),
					points,
					score: {
						computerScore,
						playerScore,
					},
					skip: false,
				};
			}, 0);
			// add and display pc's score
		} else {
			this.source.playersTurn = true;
		}

		if (this.source.playersTurn && this.source.isValidMove.pointTally) {
			this.source.playerScore += this.source.isValidMove.pointTally;

			let points = this.source.isValidMove.pointTally;
			let computerScore = this.source.computerScore;
			let playerScore = this.source.playerScore;

			let word = this.source.isValidMove.bestWord
				.map((x: string) => {
					let word = x[0].toUpperCase() + x.slice(1).toLowerCase();
					return `${word}`;
				})
				.join(', ');

			this.source.history.push({});
			let index = this.source.history.length - 1;

			setTimeout(async () => {
				this.source.history[index] = {
					isAI: false,
					word,
					definitions: await this.http.getDefinitions(word),
					points,
					score: {
						computerScore,
						playerScore,
					},
					skip: false,
				};
			}, 0);
			//calculate and add points to "player"
		}

		this.source.wordsLogged = this.source.isValidMove.words; //adding to the words that have been played

		if (this.source.playersTurn && !isAI) {
			let refill = $document.querySelectorAll('#board .hot').length;
			let tilesPlayed = Array.from(
				$document.querySelectorAll('#board .hot')
			).map((el) => el.parentElement);

			let newBoard: Square[] = cloneDeep(board);
			//fill rack back up to 7 or what ever is left in bag
			for (let i = 0; i < refill; i++) {
				let coords: string[] =
					tilesPlayed[i]?.getAttribute('data-location')?.split(',') ?? [];

				//?disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()

				let index = +coords[0] * 15 + +coords[1];
				let data = newBoard[index].data[0];

				newBoard[index].data = [
					{
						...data,
						class: ['tile'],
					},
				];

				this.source.dl = this.source.dl.filter((num) => num !== index);
				this.source.dw = this.source.dw.filter((num) => num !== index);
				this.source.tl = this.source.tl.filter((num) => num !== index);
				this.source.tw = this.source.tw.filter((num) => num !== index);

				//?remove multipliers from gridMultipliers
				this.gridService.gridState.gridMultipliers[+coords[0]][+coords[1]] =
					' ';
				this.gridService.gridState.gridLetters[+coords[0]][
					+coords[1]
				].hot = false;

				if (this.source.bag.length) {
					this.source.addToPlayerRack({
						content: pullAt(this.source.bag, [0])[0],
						id: `tile${++this.source.numSource}`,
						class: ['tile', 'hot'],
						'data-drag': this.source.numSource,
					});
				}
			}

			this.source.changeBoard(newBoard);

			if (
				!this.source.bag.length &&
				(!$document.querySelectorAll('#rack .tile').length ||
					!this.source.rivalRack.length)
			) {
				return this.endGame($document);
			}

			//?disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
		} else {
			let wordUsed = this.source.isValidMove.bestWord;

			this.source.rivalRack = this.source.isValidMove.rivalRack;
			let tilesPlayed = board.filter((x) =>
				(x?.data[0]?.class ?? []).includes('pcPlay')
			);
			let refill = tilesPlayed.length;
			//fill rack back up to 7 or what ever is left in bag
			for (let i = 0; i < refill; i++) {
				//remove multipliers from gridMultipliers
				let coords = tilesPlayed[i]?.data[0]?.coords ?? [];
				this.gridService.gridState.gridMultipliers[coords[0]][coords[1]] = ' ';
				this.gridService.gridState.gridLetters[coords[0]][
					coords[1]
				].hot = false;

				if (this.source.bag.length) {
					this.source.rivalRack.push(pullAt(this.source.bag, [0])[0]);
					// console.log(this.source.rivalRack);
				}
			}

			if (
				!this.source.bag.length &&
				(!$document.querySelectorAll('#rack .tile').length ||
					!this.source.rivalRack.length)
			) {
				setTimeout(() => {
					let data: DialogData = {
						type: 'message',
						message: `Opponent played: "${wordUsed}"`,
					};
					this.closeDialog();
					this.dialogRef = this.dialog.open(ModalDialogComponent, {
						data: data,
					});
					this.closeDialog(2250);
				}, 1650);
				return this.endGame($document);
			}

			//disable drag on "hot" tiles, remove "hot" & "multiplier" class from ".column .hot" and call pass()
			board.forEach((x, i) => {
				if (x.data[0]?.coords) {
					this.source.dl = this.source.dl.filter((num) => num !== i);
					this.source.dw = this.source.dw.filter((num) => num !== i);
					this.source.tl = this.source.tl.filter((num) => num !== i);
					this.source.tw = this.source.tw.filter((num) => num !== i);
				}
			});

			setTimeout(() => {
				let data: DialogData = {
					type: 'message',
					message: `Opponent played: "${wordUsed}"`,
				};
				this.closeDialog();
				this.dialogRef = this.dialog.open(ModalDialogComponent, {
					data: data,
				});
				this.closeDialog(2250);
			}, 1650);
		}

		this.source.changeBoard(this.source.getBoard() ?? []);
		//set firstTurn & isValidMove to false
		if (this.source.firstTurn) this.source.firstTurn = false;
		this.source.isValidMove = false;

		const btnAttrs: BtnAttrs = { ...this.source.getBtnAttr() };

		btnAttrs.passPlay.text = 'Pass';
		btnAttrs.passPlay.bgColor = '';
		btnAttrs.passPlay.icon = '';

		btnAttrs.swapRecall.text = 'Swap';
		btnAttrs.swapRecall.icon.isUndo = false;

		this.source.changeBtnAttr(btnAttrs);
		this.pass(undefined, undefined, undefined, undefined, $document);
	}
}
