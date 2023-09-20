import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { take } from 'rxjs/operators';
import { ScrabbleLettersService } from './scrabble-letters.service';
import { shuffle /* , drop  */ } from 'lodash-es';
import { HistoryEntry } from '../interfaces/history-entry';
import { BtnAttrs } from '../interfaces/btn-attrs';
// import mockBoard from '../../assets/testBoard'; //? uncomment to test board
@Injectable({
	providedIn: 'root',
})
export class SourceService {
	constructor(private letters: ScrabbleLettersService) {
		// this.bag = drop(this.bag, 86); //? uncomment for doing tests on a shorter game
		this.bag = shuffle(shuffle(this.letters.get()));
	}

	public numSource = 101;

	private playerRackSource: BehaviorSubject<
		any | never[]
	> = new BehaviorSubject([]);
	currentPlayerRack = this.playerRackSource.asObservable();

	getPlayerRack() {
		let playerRack;
		this.currentPlayerRack.pipe(take(1)).subscribe((result: any[]) => {
			playerRack = result;
		});
		return playerRack;
	}

	changePlayerRack(rack: any) {
		this.playerRackSource.next(rack);
	}

	addToPlayerRack(newTiles: any) {
		this.currentPlayerRack.pipe(take(1)).subscribe((result: any[]) => {
			this.playerRackSource.next([...result, newTiles]);
		});
	}

	private boardSource = new BehaviorSubject(
		Array(225)
			.fill('')
			.map(() => ({ data: [] }))
		// mockBoard //? uncomment to test board
	);
	currentBoard = this.boardSource.asObservable();

	changeBoard(squares: any[]) {
		this.boardSource.next(squares);
	}

	getBoard() {
		let board;
		this.currentBoard.pipe(take(1)).subscribe((result: any[]) => {
			board = result;
		});
		return board;
	}

	private btnAttrSource = new BehaviorSubject({
		bagBtn: { numTiles: 100 },
		scoresBtn: { player: 0, rival: 0 },
		swapRecall: { text: 'Swap', icon: { isUndo: false } },
		passPlay: { text: 'Pass', icon: '', bgColor: '' },
		zoomBtn: { isIn: true },
	});
	currentBtnAttr = this.btnAttrSource.asObservable();

	changeBtnAttr(attrs: BtnAttrs) {
		this.btnAttrSource.next(attrs);
	}

	getBtnAttr(): any {
		let btnAttr;
		this.currentBtnAttr.pipe(take(1)).subscribe((result) => {
			btnAttr = result;
		});
		return btnAttr;
	}

	private hasListSource = new BehaviorSubject(false);
	currentHasList = this.hasListSource.asObservable();

	getHasList() {
		let hasList;
		this.currentHasList.pipe(take(1)).subscribe((result: boolean) => {
			hasList = result;
		});
		return hasList;
	}

	changeHasList(bool: boolean) {
		this.hasListSource.next(bool);
	}

	public tw = [0, 7, 14, 105, 119, 210, 217, 224];

	//prettier-ignore
	public dw = [16, 28, 32, 42, 48, 56, 64, 70, 112, 154, 160, 168, 176, 182, 192, 196, 208];

	public tl = [20, 24, 76, 80, 84, 88, 136, 140, 144, 148, 200, 204];

	//prettier-ignore
	public dl = [3, 11, 36, 38, 45, 52, 59, 92, 96, 98, 102, 108, 116, 122, 126, 128, 132, 165, 172, 179, 186, 188, 213, 221];

	public DEBUG_MODE = false; //? change to true for the AI to play it self

	public tutorialGiven = false;
	public loaderShown = false;
	public playerScore = 0;
	public computerScore = 0;
	public lettersUsed = 0;
	public passCount = 0;
	public isZoomed = false;
	public fired = false;
	public overRack = false;
	public firstTurn = true;
	public isValidMove: any = false;
	public playersTurn = false;
	public wordsLogged: string[] = [];
	public history: HistoryEntry[] = [];
	public rivalRack: any[] = [];
	public gameOver = false;
	public modalTO: any; //?timeout

	public bag: {
		letter: string;
		points: number;
	}[] = [];
}
