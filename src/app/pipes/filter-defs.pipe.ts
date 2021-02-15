import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filterDefs',
})
export class FilterDefsPipe implements PipeTransform {
  transform(defs: any[], ...args: unknown[]): any[] {
    let result = defs
      .filter(
        (x) =>
          !['INIT', 'PRX', 'AFF', 'SUF', 'SYM', 'ANA'].includes(x.part) &&
          x.part !== undefined
      )
      .map((x) => {
        let p = x.part;
        p =
          p === 'PRE'
            ? 'preposition'
            : p === 'PRON'
            ? 'pronoun'
            : p === 'NOUN'
            ? 'noun'
            : p === 'ADV'
            ? 'adverb'
            : p === 'ABR'
            ? 'abbreviation'
            : p === 'DET'
            ? 'determiner'
            : p === 'CONT'
            ? 'contraction'
            : p === 'IART'
            ? 'indefinite article'
            : p === 'PRE'
            ? 'preposition'
            : p === 'CONJ'
            ? 'conjunction'
            : p === 'PRN'
            ? 'proper noun'
            : p === 'ADJ'
            ? 'adjective'
            : p === 'INT'
            ? 'interjection'
            : p;
        return { ...x, part: p };
      });
    return result;
  }
}
