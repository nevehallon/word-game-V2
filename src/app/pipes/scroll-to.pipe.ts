import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'scrollTo',
})
export class ScrollToPipe implements PipeTransform {
  transform(str: string, container: HTMLElement, tCell: HTMLElement): string {
    if (str !== 'expanded') return 'collapsed';

    setTimeout(() => {
      container.scrollTo({
        top: tCell.offsetTop - (tCell.offsetHeight - 125),
        behavior: 'smooth',
      });
    }, 800);

    return 'expanded';
  }
}
