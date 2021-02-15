import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class LetterToPointsService {
  get() {
    return [
      { letter: 'E', points: 1 },
      { letter: 'I', points: 1 },
      { letter: 'A', points: 1 },
      { letter: 'O', points: 1 },
      { letter: 'R', points: 1 },
      { letter: 'N', points: 1 },
      { letter: 'T', points: 1 },
      { letter: 'L', points: 1 },
      { letter: 'S', points: 1 },
      { letter: 'D', points: 2 },
      { letter: 'U', points: 1 },
      { letter: 'G', points: 2 },
      { letter: 'W', points: 4 },
      { letter: 'Y', points: 4 },
      { letter: 'F', points: 4 },
      { letter: 'C', points: 3 },
      { letter: 'BLANK', points: 0 },
      { letter: 'M', points: 3 },
      { letter: 'H', points: 4 },
      { letter: 'B', points: 3 },
      { letter: 'P', points: 3 },
      { letter: 'V', points: 4 },
      { letter: 'Q', points: 10 },
      { letter: 'K', points: 5 },
      { letter: 'X', points: 8 },
      { letter: 'J', points: 8 },
      { letter: 'Z', points: 10 },
    ];
  }
  constructor() {}
}
