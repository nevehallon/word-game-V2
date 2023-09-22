import { Injectable, OnDestroy } from '@angular/core';
import { Trie } from '../../assets/trie-prefix-tree-alt';
import { without, drop, sum, uniq } from 'lodash-es';
import { Subscription } from 'rxjs';
import { BtnAttrs } from '../interfaces/btn-attrs';
import { SourceService } from './source.service';

@Injectable({
	providedIn: 'root',
})
export class BoardValidatorService implements OnDestroy {
	private source: any;
	constructor() { }

	init(source: SourceService) {
		this.source = source;
		this.btnAttributeSubscription = this.source.currentBtnAttr.subscribe(
			(attrs: BtnAttrs) => {
				this.btnAttributes = attrs;
			}
		);
	}

	btnAttributes!: BtnAttrs;
	btnAttributeSubscription!: Subscription;

	ngOnDestroy(): void {
		this.btnAttributeSubscription.unsubscribe();
	}

	zip(arrays: any[]) {
		return arrays[0].map((_: any, i: number) =>
			arrays.map((array) => array[i])
		);
	}

	difference(a: any[], b: any[]) {
		return a.filter(
			function (v) {
				return !this.get(v) || !this.set(v, this.get(v) - 1);
			},
			b.reduce((acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map())
		);
	}

	rowWordStack: any[] = [];
	columnWordStack: any[] = [];
	potentialPoints: any[] = [];
	wordMultiplier: any[] = [];
	potentialZipPoints: any[] = [];
	zipWordMultiplier: any[] = [];

	push2(point: any, multi: any, index: number): void {
		this.potentialPoints[index].push(point);
		this.wordMultiplier[index].push(multi);
	}

	push2Zip(point: any, multi: any, index: number): void {
		this.potentialZipPoints[index].push(point);
		this.zipWordMultiplier[index].push(multi);
	}

	isHot() {
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };

		btnAttrs.passPlay.text = 'Play';

		btnAttrs.passPlay.bgColor = 'rgb(30, 126, 52)';

		btnAttrs.swapRecall.text = 'Recall';
		btnAttrs.swapRecall.icon.isUndo = true;

		this.source.changeBtnAttr(btnAttrs);
	}

	isNot() {
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };

		btnAttrs.passPlay.text = 'Pass';
		btnAttrs.passPlay.bgColor = '';
		btnAttrs.passPlay.icon = '';

		btnAttrs.swapRecall.text = 'Swap';
		btnAttrs.swapRecall.icon.isUndo = false;

		this.source.changeBtnAttr(btnAttrs);
	}

	playError() {
		// setTimeout(() => {
		const btnAttrs: BtnAttrs = { ...this.btnAttributes };

		if (btnAttrs.passPlay.text === 'Pass') return;

		btnAttrs.passPlay.icon = 'block';
		btnAttrs.passPlay.text = 'Play';
		btnAttrs.passPlay.bgColor = '#c82333';
		this.source.changeBtnAttr(btnAttrs);
		// }, 0);
	}

	validate(
		gridState: any,
		source: SourceService,
		isPlayer: boolean,
		$document: Document
	): Record<string, any> | void {
		this.source = source;
		let firstTurn = this.source.firstTurn;
		let wordsLogged = this.source.wordsLogged;

		let { gridLetters: board, gridMultipliers: multiplierMatrix } = gridState;
		try {
			let hasWords = true;

			!$document.querySelectorAll('.square .hot').length
				? this.isNot()
				: this.isHot();
			if (isPlayer) {
				if (firstTurn && !board[7][7].letter.trim()) {
					if (!$document.querySelectorAll('#board .hot').length)
						return this.isNot();
					this.playError();
					throw '(45) Your word must touch an existing word or the center star';
				}

				let hotPivot: any;
				let hotCompare;
				let hotArr = $document.querySelectorAll('#board .hot');
				if (hotArr.length > 1) {
					hotArr.forEach((tile, index) => {
						hotCompare = tile
							.parentElement!.getAttribute('data-location')!
							.split(',');

						if (index === 0)
							hotPivot = tile
								.parentElement!.getAttribute('data-location')!
								.split(',');

						if (
							hotCompare[0] !== hotPivot[0] &&
							hotCompare[1] !== hotPivot[1]
						) {
							if (!$document.querySelectorAll('#board .hot').length)
								return this.isNot();
							this.playError();
							throw '(59) The letters you play must lie on the same row or column, and must be connected to each other';
						}
					});
				}
			}

			let letter = board.map((row: any[]) => row.map((obj) => obj.letter));
			let id = board.map((row: any[]) => row.map((obj) => obj.id));
			let hot = board.map((row: any[]) => row.map((obj) => obj.hot));
			let pointVal = board.map((row: any[]) => row.map((obj) => obj.pointVal));
			let multiplier = multiplierMatrix;

			let fullMatrix = {
				letterRows: letter,
				idRows: id,
				hotRows: hot,
				pointValRows: pointVal,
				multiplierRows: multiplier,
			};

			let fullMatrixZip = {
				letterColumns: this.zip(letter),
				idColumns: this.zip(id),
				hotColumns: this.zip(hot),
				pointValColumns: this.zip(pointVal),
				multiplierColumns: this.zip(multiplier),
			};

			let {
				letterRows,
				idRows,
				hotRows,
				pointValRows,
				multiplierRows,
			} = fullMatrix;
			let {
				letterColumns,
				idColumns,
				hotColumns,
				pointValColumns,
				multiplierColumns,
			} = fullMatrixZip;

			letterRows = letterRows.map((row: any[]) => row.join(''));
			letterColumns = letterColumns.map((column: any[]) => column.join(''));

			// idRows = idRows.map((row: any[]) => row.join(""));
			// idColumns = idColumns.map((column: any[]) => column.join(""));

			hotRows = hotRows.map((row: any[]) => row.join(''));
			hotColumns = hotColumns.map((column: any[]) => column.join(''));

			multiplierRows = multiplierRows.map((row: any[]) => row.join(''));
			multiplierColumns = multiplierColumns.map((column: any[]) =>
				column.join('')
			);

			pointValRows = pointValRows.map((row: any[]) => row.join(''));
			pointValColumns = pointValColumns.map((column: any[]) => column.join(''));

			let words: any[] = [];
			let ids: any[] = [];
			let hotLetters: any[] = [];

			[...letterRows, ...letterColumns].map((line) =>
				line.split(' ').map((word: string) => {
					if (word.length > 1) return words.push(word);
				})
			);

			if (isPlayer) {
				let suspectId: any[] = [];
				[...idRows, ...idColumns].map((line) =>
					line.map((id: any, index: number) => {
						if (id === ' ') return;
						let prev =
							line[index - 1] === ' ' || line[index - 1] === undefined
								? true
								: false;
						let next =
							line[index + 1] === ' ' || line[index + 1] === undefined
								? true
								: false;
						if (
							suspectId.includes(id) &&
							id !== board[7][7].id.trim() &&
							prev &&
							next
						) {
							if (!$document.querySelectorAll('#board .hot').length)
								return this.isNot();
							this.playError();
							throw '(37) The letters you play must lie on the same row or column, and must be connected to each other';
						}
						//prettier-ignore
						!suspectId.includes(id) &&
							prev &&
							next ?
							suspectId.push(id) : undefined;

						if (id.length > 0) return ids.push(id);
					})
				);

				if (ids.length == 2) {
					if (!$document.querySelectorAll('#board .hot').length)
						return this.isNot();
					this.playError();
					throw `138) Word must contain at least two letters`;
				}
			}
			let touching = false;
			let singleHot = 0;
			[...hotRows, ...hotColumns].map((line, index) =>
				line.split(' ').map((bool: any) => {
					if (bool === 'true' && index < 15) singleHot = 1;
					if (bool === 'true' && index >= 15)
						singleHot ? singleHot++ : undefined;
					if (bool.includes('falsetrue') || bool.includes('truefalse'))
						touching = true;
					if (without(hotLetters, '', 'true').length > 1) {
						if (isPlayer) {
							if (!$document.querySelectorAll('#board .hot').length)
								return this.isNot();
							this.playError();
							throw '(47) The letters you play must lie on the same row or column, and must be connected to each other';
						} else {
							// console.log({
							//   message: "AI error happened",
							//   board: { letters: fullMatrix.letterRows, hot: fullMatrix.hotRows },
							// });
							hasWords = false;
						}
					}
					if (bool.length > 7)
						return hotLetters.push(bool.replaceAll('false', ''));
				})
			);

			if ((!touching && !firstTurn) || singleHot > 1) {
				if (isPlayer) {
					if (!$document.querySelectorAll('#board .hot').length)
						return this.isNot();
					this.playError();
					throw '(48) The letters you play must lie on the same row or column, and must be connected to each other';
				} else {
					// console.log({
					//   message: "AI error happened",
					//   board: { letters: fullMatrix.letterRows, hot: fullMatrix.hotRows },
					// });
					hasWords = false;
				}
			}

			this.rowWordStack = [];
			this.columnWordStack = [];
			this.potentialPoints = [];
			this.wordMultiplier = [];
			this.potentialZipPoints = [];
			this.zipWordMultiplier = [];
			let coords: any[] = [];
			let zipCoords: any[] = [];
			let done = false;

			fullMatrix.hotRows.forEach((row: any[], rowIndex: number) => {
				if (without(row, ' ').length > 1 && row.includes(true)) {
					row.forEach((cell, index) => {
						if (done) return;
						let prev =
							row[index - 1] === undefined || row[index - 1] === ' '
								? true
								: false;
						let next =
							row[index + 1] === undefined || row[index + 1] === ' '
								? true
								: false;
						let skip = !drop(row, index + 1).includes(true);
						if (cell !== ' ') {
							if (prev && !skip) coords = [];
							if (cell === true && prev) {
								coords = [];
								if (!skip && prev && next && isPlayer) {
									if (!$document.querySelectorAll('#board .hot').length)
										return this.isNot();
									this.playError();
									throw '(51) The letters you play must lie on the same row or column, and must be connected to each other';
								}
								if (prev && next) return (done = true);
							}
							if (prev && next) return;
							if (next && skip) done = true;
							coords.push([rowIndex, index]);
						}
					});
					done = false;
					if (coords.length > 1) {
						this.rowWordStack.push(coords);
						coords = [];
					}
				}
			});

			fullMatrixZip.hotColumns.forEach((column: any[], columnIndex: number) => {
				if (without(column, ' ').length > 1 && column.includes(true)) {
					column.forEach((cell, index) => {
						if (done) return;
						let prev =
							column[index - 1] === undefined || column[index - 1] === ' '
								? true
								: false;
						let next =
							column[index + 1] === undefined || column[index + 1] === ' '
								? true
								: false;
						let skip = !drop(column, index + 1).includes(true);
						if (cell !== ' ') {
							if (prev && !skip) zipCoords = [];
							if (cell === true && prev) {
								zipCoords = [];
								if (!skip && prev && next && isPlayer) {
									if (!$document.querySelectorAll('#board .hot').length)
										return this.isNot();
									this.playError();
									throw '(52) The letters you play must lie on the same row or column, and must be connected to each other';
								}
								if (prev && next) return (done = true);
							}
							if (prev && next) return;
							if (next && skip) done = true;
							zipCoords.push([columnIndex, index]);
						}
					});
					done = false;
					if (zipCoords.length > 1) {
						this.columnWordStack.push(zipCoords);
						zipCoords = [];
					}
				}
			});

			//prettier-ignore
			this.rowWordStack.forEach((coords: any[], index: number) => {
				this.potentialPoints.push([]);
				this.wordMultiplier.push([]);
				coords.forEach(coord => {
					let point = +fullMatrix.pointValRows[coord[0]][coord[1]];
					let multiplier = fullMatrix.multiplierRows[coord[0]][coord[1]];
					multiplier === " " ? this.potentialPoints[index].push(point) :
						multiplier === "dl" ? this.potentialPoints[index].push(point * 2) :
							multiplier === "tl" ? this.potentialPoints[index].push(point * 3) :
								multiplier === "dw" ? this.push2(point, 2, index) :
									multiplier === "tw" ? this.push2(point, 3, index) : "";
				});
			});

			//prettier-ignore
			this.columnWordStack.forEach((zipCoords: any[], index: number) => {
				this.potentialZipPoints.push([]);
				this.zipWordMultiplier.push([]);
				zipCoords.forEach(coord => {
					let point = +fullMatrixZip.pointValColumns[coord[0]][coord[1]];
					let multiplier = fullMatrixZip.multiplierColumns[coord[0]][coord[1]];
					multiplier === " " ? this.potentialZipPoints[index].push(point) :
						multiplier === "dl" ? this.potentialZipPoints[index].push(point * 2) :
							multiplier === "tl" ? this.potentialZipPoints[index].push(point * 3) :
								multiplier === "dw" ? this.push2Zip(point, 2, index) :
									multiplier === "tw" ? this.push2Zip(point, 3, index) : "";
				});
			});

			let numHot = without(hotLetters, '').length
				? without(hotLetters, '').sort().reverse()[0].length / 4
				: 0;
			if (isPlayer) {
				// console.log(hotLetters);
				if (
					without(hotLetters, '').length >
					this.potentialPoints.length + this.potentialZipPoints.length
				) {
					if (!$document.querySelectorAll('#board .hot').length)
						return this.isNot();
					this.playError();
					throw '(57) The letters you play must lie on the same row or column, and must be connected to each other';
				}
			}

			without(uniq(words), ...wordsLogged).forEach((word) => {
				if (!Trie().hasWord(word)) {
					if (isPlayer) {
						if (!$document.querySelectorAll('#board .hot').length)
							return this.isNot();
						this.playError();
						throw `290) The word: '${word}' is INVALID `;
					} else {
						hasWords = false;
					}
				}
				//check words validity
			}); // passing in everything but words that have already been played to make sure we are only checking new words ->faster Trie check

			let pointTally: any = [];

			let gaveBonusPoints = false;

			this.potentialPoints.forEach((word, index) => {
				let isEmpty =
					this.wordMultiplier[index] === undefined ||
						this.wordMultiplier[index] == 0
						? true
						: false;
				if (!gaveBonusPoints && numHot > 6 && isPlayer) {
					pointTally.push(50);
					gaveBonusPoints = true;
				}

				if (isEmpty) return pointTally.push(sum(word));
				pointTally.push(sum(word) * sum(this.wordMultiplier[index]));
			});

			this.potentialZipPoints.forEach((word, index) => {
				let isEmpty =
					this.zipWordMultiplier[index] === undefined ||
						this.zipWordMultiplier[index] == 0
						? true
						: false;
				if (!gaveBonusPoints && numHot > 6 && isPlayer) {
					pointTally.push(50);
					gaveBonusPoints = true;
				}
				if (isEmpty) return pointTally.push(sum(word));
				pointTally.push(sum(word) * sum(this.zipWordMultiplier[index]));
			});

			pointTally = sum(pointTally);

			if (isPlayer) {
				const btnAttrs: BtnAttrs = { ...this.btnAttributes };

				if (!$document.querySelectorAll('.square .hot').length)
					return this.isNot();

				btnAttrs.passPlay.text = `Play ${pointTally}`;
				btnAttrs.passPlay.icon = '';

				this.source.changeBtnAttr(btnAttrs);
			}

			if (hasWords) {
				return {
					words,
					pointTally,
					bestWord: this.difference(words, wordsLogged),
				}; //return wordsToBeLogged, totalPotentialPoints
			} else {
				return { words, pointTally: 0 };
			}
		} catch (error: any) {
			console.error(error);
			if (this.source.DEBUG_MODE) {
				throw error;
			}
			return error;
		}
	}
}
