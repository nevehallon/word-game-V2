import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-audio-btn',
  templateUrl: './audio-btn.component.html',
  styleUrls: ['./audio-btn.component.scss'],
})
export class AudioBtnComponent implements OnInit {
  constructor(private cd: ChangeDetectorRef) {}
  ngOnInit(): void {}

  private _timeOut;

  @Input() word: string = '';
  @Input() audioSources: string = '';
  hasAudio: boolean = false;
  isPlaying: boolean = null;

  playAudio(el: HTMLAudioElement, $animation) {
    el.currentTime = 0;
    clearTimeout(this._timeOut);
    this.stop($animation);
    this.isPlaying = true;
    this.cd.markForCheck();

    el.play();

    this._timeOut = setTimeout(() => {
      this.stop($animation);
    }, 1600);
  }

  stop($animation) {
    this.isPlaying = null;
    this.cd.markForCheck();
    $animation.style.display = 'none';
    $animation.offsetHeight; /* trigger reflow */
    $animation.style.display = 'initial';
  }
}
