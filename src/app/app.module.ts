import { NgModule, Injectable } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatDialogModule } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTableModule } from '@angular/material/table';
import { MatTabsModule } from '@angular/material/tabs';
import { MatRippleModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatSliderModule } from '@angular/material/slider';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';

import { AppComponent } from './app.component';
import { ContainerComponent } from './components/container/container.component';
import { FrameComponent } from './components/frame/frame.component';
import { BoardComponent } from './components/board/board.component';
import { ActionBarComponent } from './components/action-bar/action-bar.component';
import { RackFrameComponent } from './components/rack-frame/rack-frame.component';
import { ModalDialogComponent } from './components/modal-dialog/modal-dialog.component';
import { HistoryTableComponent } from './components/history-table/history-table.component';
import { AudioBtnComponent } from './components/audio-btn/audio-btn.component';
import { TabContainerComponent } from './components/tab-container/tab-container.component';

import { FilterDefsPipe } from './pipes/filter-defs.pipe';

import {
	BrowserModule,
	HammerModule,
	HammerGestureConfig,
	HAMMER_GESTURE_CONFIG,
} from '@angular/platform-browser';
import Hammer from 'hammerjs';
import { ScrollToPipe } from './pipes/scroll-to.pipe';

@Injectable({ providedIn: 'root' })
export class MyHammerConfig extends HammerGestureConfig {
	overrides = <any>{
		swipe: { direction: Hammer.DIRECTION_HORIZONTAL },
		pinch: { enable: false },
		rotate: { enable: false },
	};

	buildHammer(element: HTMLElement) {
		const mc = new Hammer(element, {
			touchAction: 'auto',
			inputClass: Hammer.TouchInput,
			recognizers: [
				[
					Hammer.Swipe,
					{
						direction: Hammer.DIRECTION_HORIZONTAL,
					},
				],
			],
		});
		return mc;
	}
}

@NgModule({
	declarations: [
		AppComponent,
		ContainerComponent,
		FrameComponent,
		BoardComponent,
		ActionBarComponent,
		RackFrameComponent,
		ModalDialogComponent,
		HistoryTableComponent,
		FilterDefsPipe,
		AudioBtnComponent,
		TabContainerComponent,
		ScrollToPipe,
	],
	imports: [
		BrowserModule,
		HttpClientModule,
		BrowserAnimationsModule,
		DragDropModule,
		MatButtonModule,
		MatTooltipModule,
		MatDialogModule,
		MatCheckboxModule,
		FormsModule,
		MatSlideToggleModule,
		MatSliderModule,
		MatTableModule,
		MatTabsModule,
		MatRippleModule,
		MatIconModule,
		HammerModule,
	],
	// entryComponents: [ModalDialogComponent],
	providers: [{ provide: HAMMER_GESTURE_CONFIG, useClass: MyHammerConfig }],
	bootstrap: [AppComponent],
})
export class AppModule { }
