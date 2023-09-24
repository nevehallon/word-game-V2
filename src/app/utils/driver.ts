import { type DriveStep } from "driver.js";
import { ModalDialogComponent } from '../components/modal-dialog/modal-dialog.component';
import { type GameLogicService } from "../services/game-logic.service";

import { first, take } from 'rxjs/operators';

export const useSteps = (
	GLService: InstanceType<typeof GameLogicService>,
	$document: Document,
	distroyDriverObj: () => void
): DriveStep[] => [
		{
			element: '#frame',
			popover: {
				popoverClass: 'firstStep',
				title: 'Tap to zoom',
				description:
					'Double click on the board to zoom into that square OR to zoom out.',
			},
		},
		{
			element: '.theme',
			popover: {
				title: 'Themes',
				description: 'Change color theme to dark or light',
				side: 'top'
			},
		},
		{
			element: '#bagBtn',
			popover: {
				title: 'Tiles left',
				description: 'See what tiles remain in the bag',
				side: 'top'
			},
		},
		{
			element: '#scoresBtn',
			popover: {
				title: 'Game Stats',
				description: 'See words that were played and their definitions',
				side: 'top'
			},
		},
		{
			element: '#mixBtn',
			popover: {
				title: 'Tap to shuffle',
				description: 'Shuffle the tiles on your rack',
				side: 'top'
			},
		},
		{
			element: '#swapRecall',
			popover: {
				title: 'Swap or Recall',
				description:
					'Trade in for new letters OR return your unplayed tiles from the board',
				side: 'top'
			},
		},
		{
			element: '#settingsBtn',
			popover: {
				title: 'Change Settings',
				description:
					'Check and change game settings<br /> (turn off these hints or change game difficulty)',
				side: 'top'
			},
		},
		{
			element: '#zoomBtns',
			popover: {
				title: 'Zoom',
				description: 'Zoom in to the center of the board OR zoom out.',
				side: 'top'
			},
		},
		{
			element: '#passPlay',
			popover: {
				title: 'Play or Pass',
				description: 'Play a word OR pass your turn',
				side: 'top',
				onNextClick() {
					distroyDriverObj();

					if (localStorage.getItem('logoShown')) {
						return GLService.startGame($document);
					}
					GLService.closeDialog();

					GLService.dialogRef = GLService.dialog.open(ModalDialogComponent, {
						data: {
							type: 'introSettings',
						},
						maxWidth: '75vh',
						width: '75%',
					});

					GLService.dialogRef
						.afterClosed()
						// .pipe(first())
						.subscribe((result) => {
							// trigger logo animation
							GLService.closeDialog();
							return setTimeout(() => {
								GLService.dialogRef = GLService.dialog.open(ModalDialogComponent, {
									data: {
										type: 'logo',
									},
									width: '75vmax',
									height: '75vmax',
									maxWidth: '75vmax',
									maxHeight: '75vmax',
									disableClose: true,
									id: 'logoModal',
									hasBackdrop: false,
									panelClass: 'logoModalCls'
								});

								GLService.dialogRef
									.afterClosed()
									// .pipe(take(1))
									.subscribe((result) => {
										GLService.startGame($document);
									}, console.error);
							}, 1000);
						}, console.error);
				},
			},
		},
	];
