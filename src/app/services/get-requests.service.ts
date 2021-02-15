import { Injectable } from '@angular/core';
import { LetterToPointsService } from './letter-to-points.service.js';
import { getTrie } from '../../trie-prefix-tree-alt/main.js';
import { HttpClient } from '@angular/common/http';
import { orderBy } from 'lodash-es';
import * as localforage from 'localforage';

@Injectable({
  providedIn: 'root',
})
export class GetRequestsService {
  url: string = 'http://localhost:3001';

  async checkServerStatus() {
    let requestStatus: Promise<any> = this.http
      .get(`${this.url}/wordFinder?letters=aa&numBlanks=0`, {
        observe: 'response',
      })
      .toPromise();

    try {
      let { status } = await requestStatus;

      if (status == 200) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  async getWordTrieStr(source) {
    try {
      if (
        (await localforage.getItem('wordTrieStr')) &&
        (await localforage.getItem('reverseWordTrieStr'))
      ) {
        source.changeHasList(true);
        return;
      }

      let data: Promise<any> = this.http
        .get(`${this.url}/wordTrieStr`, {
          observe: 'response',
        })
        .toPromise();

      let {
        body: { wordTrieStr, reverseWordTrieStr },
      } = await data;

      let localTrieStr = wordTrieStr;
      let localReverseTrieStr = reverseWordTrieStr;
      await localforage.setItem('wordTrieStr', localTrieStr);
      await localforage.setItem('reverseWordTrieStr', localReverseTrieStr);
      let hasList = getTrie();
      if (hasList) source.changeHasList(true);
    } catch (error) {
      console.error(error);
    }
  }

  async getWordValues(str, numBlanks = 0) {
    let data: Promise<any> = this.http
      .get(`${this.url}/wordFinder?letters=${str}&numBlanks=${numBlanks}`, {
        observe: 'response',
      })
      .toPromise();

    let result = [];

    try {
      let {
        body: { wordsFound },
      } = await data;
      wordsFound.forEach((word) => {
        result.push({
          word,
          points: [...word].reduce((accumulator, currentVal) => {
            return (
              accumulator +
              this.letters
                .get()
                .find((l) => l.letter == currentVal.toUpperCase()).points
            );
          }, 0),
        });
      });

      let wordsByValue = orderBy(result, ['points', 'word'], ['desc']);

      return wordsByValue;
    } catch (error) {
      console.error(error);
    }
  }

  async getDefinitions(words) {
    words = words.replaceAll(' ', '').toLowerCase();

    let data: Promise<any> = this.http
      .get(`${this.url}/defineWords?words=${words}`, {
        observe: 'response',
      })
      .toPromise();

    try {
      let {
        body: { words },
      } = await data;
      // console.log(words);

      return words;
    } catch (error) {
      console.error(error);
    }
  }

  constructor(
    private letters: LetterToPointsService,
    private http: HttpClient
  ) {}
}
