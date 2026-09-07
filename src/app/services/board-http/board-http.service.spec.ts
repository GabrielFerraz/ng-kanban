import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';

import { BoardHttpService } from './board-http.service';
import { Board } from '../../models/board.model';

describe('BoardHttpService', () => {
  let service: BoardHttpService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(BoardHttpService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('requests boards from assets/data.json', () => {
    const mockBoards: Board[] = [{ name: 'Platform Launch', columns: [] }];

    service.getBoards().subscribe((res) => {
      expect(res.boards).toEqual(mockBoards);
    });

    const req = httpMock.expectOne('assets/data.json');
    expect(req.request.method).toBe('GET');
    req.flush({ boards: mockBoards });
  });
});
