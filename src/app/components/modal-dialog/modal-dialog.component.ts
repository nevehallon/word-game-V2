import {
  Component,
  OnInit,
  Inject,
  OnDestroy,
  AfterViewInit,
} from '@angular/core';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';
import { LetterToPointsService } from 'src/app/services/letter-to-points.service';
import { ScrabbleLettersService } from 'src/app/services/scrabble-letters.service';
import { countBy, mergeWith, pullAt, shuffle } from 'lodash-es';

import { SourceService } from 'src/app/services/source.service';
import { Subscription } from 'rxjs';
import { DialogData } from 'src/app/interfaces/dialog-data';
import { MatDialog } from '@angular/material/dialog';
import anime from 'animejs';
import { Dictionary } from 'lodash';

@Component({
  selector: 'app-modal-dialog',
  templateUrl: './modal-dialog.component.html',
  styleUrls: ['./modal-dialog.component.scss'],
})
export class ModalDialogComponent implements OnInit, AfterViewInit, OnDestroy {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    public dialog: MatDialog,
    private letters: ScrabbleLettersService,
    private ltp: LetterToPointsService,
    private source: SourceService
  ) {
    this.lettersByFreq = countBy(this.letters.get(), 'letter');
    this.letterToPointsSorted =  this.ltp.get().sort((a, b) => {
      a.letter === 'BLANK' ? (a.letter = '') : a.letter;
      return b.letter > a.letter ? -1 : 1;
    });
  }

  // *
  // * bag
  // *
  lettersByFreq:Dictionary<number>
  letterToPointsSorted:{
    letter: string;
    points: number;
}[]

  customizer(objValue: any, srcValue: any) {
    if (objValue) {
      return `${objValue}/${srcValue}`;
    }
    return `0/${srcValue}`;
  }

  currentFreq() {
    let currentFreq = countBy(this.source.bag, 'letter');

    mergeWith(currentFreq, this.lettersByFreq, this.customizer);

    return currentFreq;
  }

  // *
  // * settings
  // *
  rangeValues: any = {
    1: {
      text: "Easy - good if you're just starting out.",
      style: {
        display: 'block',
        'font-weight': 'bolder',
        color: 'rgb(30, 126, 52)',
      },
    },
    2: {
      text: 'Normal',
      style: { display: 'block', 'font-weight': 'bolder', color: '#0069d9' },
    },
    3: {
      text: 'Hard - you want a challenge',
      style: { display: 'block', 'font-weight': 'bolder', color: '#c82333' },
    },
    4: {
      text: 'Insane - All Gas No Breaks!!',
      style: {
        display: 'block',
        'font-weight': 'bolder',
        color: '#c82333',
        'text-decoration': 'underline',
      },
    },
  };

  hints = JSON.parse(localStorage.getItem('hints') ?? 'null') || {
    show: true,
  };
  value: number = +localStorage.getItem('difficulty')! || 15;
  checked = this.hints.show;
  difficultyText = this.rangeValues[`${this.convertVal(Number(this.value))}`].text;
  difficultyStyles = this.rangeValues[`${this.convertVal(Number(this.value))}`].style;

  convertVal(val: number) {
    let convertedVal = val < 28 ? 1 : val < 46 ? 2 : val < 60 ? 3 : 4;

    return convertedVal;
  }

  giveFeedBack(e: Event) {
    let value = (e.target as any)?.value;

    this.value = value;

    this.difficultyText = this.rangeValues[
      `${this.convertVal(Number(this.value))}`
    ].text;
    this.difficultyStyles = this.rangeValues[
      `${this.convertVal(Number(this.value))}`
    ].style;
  }

  saveSettings() {
    localStorage.setItem('difficulty', this.value + '');

    localStorage.setItem('hints', `{"show": ${this.checked}}`);
  }

  // *
  // * swap
  // *
  tiles: any[] = [];
  rackSubscription: Subscription | undefined;

  selectTile(tile: { selected: boolean }) {
    if (tile.selected) return (tile.selected = false);
    tile.selected = true;
  }

  swapTiles() {
    let remainingRack = this.tiles.filter((tile) => {
      return tile.selected !== true;
    });

    let tilesToSwap = this.tiles
      .filter((tile) => {
        return tile.selected === true;
      })
      .map((tile) => {
        return { letter: tile.content.letter, points: tile.content.points };
      });

    if (tilesToSwap.length > this.source.bag.length) {
      this.dialog.closeAll();
      let dialogRef = this.dialog.open(ModalDialogComponent, {
        data: {
          type: 'message',
          message: `There are not enough tiles left in the bag for that`,
          buttons: ['Close'],
          btnCloseData: [null],
        },
      });
      clearTimeout(this.source.modalTO);
      this.source.modalTO = setTimeout(() => {
        dialogRef.close();
      }, 3250);
      return;
    }

    for (let i = 0; i < tilesToSwap.length; i++) {
      if (this.source.bag.length) {
        let newTile = pullAt(this.source.bag, [0])[0];
        remainingRack.push({
          content: newTile,
          id: `tile${this.source.numSource}`,
          class: ['tile', 'hot'],
          'data-drag': this.source.numSource,
        });
        this.source.numSource += 1;
      }
    }

    this.source.bag.push(...tilesToSwap);
    this.source.bag = shuffle(shuffle(this.source.bag));

    let newRack = remainingRack;

    this.source.changePlayerRack(newRack);
  }

  // *
  // * blankOptions
  // *

  revert() {
    let originalRack = [...this.tiles, this.data.tileInfo];
    this.source.changePlayerRack(originalRack);
  }

  ngOnInit(): void {
    this.rackSubscription = this.source.currentPlayerRack.subscribe(
      (tiles) => (this.tiles = tiles)
    );
  }

  ngAfterViewInit(): void {
    if (this.data.type === 'logo') {
      const loader = anime.timeline({
        complete: () => {
          this.source.tutorialGiven = true;
          localStorage.setItem('logoShown', 'true');
          this.dialog.closeAll();
        },
      });

      loader
        .add({
          targets: ['polygon', 'feTurbulence', 'feDisplacementMap'],
          points: '50 5 11 27 11 72 50 95 89 73 89 28',
          baseFrequency: 0,
          opacity: {
            value: 1,
            duration: 3500,
            delay: 0,
          },
          scale: 1,
          delay: 1600,
          duration: 1500,
          translateX: '-0.5',
          easing: 'easeInOutExpo',
        })
        .add({
          targets: '#logo polygon',
          duration: 1500,
          easing: 'easeInOutBack',
          strokeDashoffset: [anime.setDashoffset, 0],
        })
        .add({
          targets: '#logo #B path',
          duration: 2100,
          easing: 'easeInCirc',
          opacity: {
            value: 1,
            duration: 100,
          },
          delay: function (el, i) {
            return i * 1050;
          },
          scale: {
            delay: 1500,
            value: function (el: HTMLElement, i: number) {
              return i !== 1 ? 1 : 1.6;
            },
          },
          translateX: {
            delay: 1500,
            value: function (el: HTMLElement, i: number) {
              return i !== 1 ? 0 : -18;
            },
          },
          translateY: {
            delay: 1500,
            value: function (el: HTMLElement, i: number) {
              return i !== 1 ? 10 : -23.4;
            },
          },

          strokeDashoffset: [anime.setDashoffset, 0],
        })
        .add({
          targets: '#logo',
          delay: 300,
          duration: 1500,
          easing: 'easeInElastic',
          opacity: 0,
          scale: 0.1,
        })
        .add({
          targets: '.loader',
          duration: 200,
          easing: 'easeInOutQuart',
          opacity: 0,
          zIndex: -1,
        });
      loader.play;
    }
  }

  ngOnDestroy(): void {
    this.rackSubscription?.unsubscribe();
  }
}
