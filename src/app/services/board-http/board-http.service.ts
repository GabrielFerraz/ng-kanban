import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Board } from '../../models/board.model';

@Injectable({
  providedIn: 'root',
})
export class BoardHttpService {
  private http = inject(HttpClient);

  getBoards() {
    return this.http.get<{ boards: Board[] }>('assets/data.json');
  }
}
