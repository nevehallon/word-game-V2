import { Component } from '@angular/core';
import * as localforage from 'localforage';
import { GetRequestsService } from './services/get-requests.service';
import { SourceService } from './services/source.service';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss'],
})
export class AppComponent {
	constructor(private http: GetRequestsService, private source: SourceService) {
		localforage.config({
			driver: [localforage.INDEXEDDB, localforage.WEBSQL],
			name: 'Scrabble_Game',
		});

		http.getWordTrieStr(this.source);
	}


}
