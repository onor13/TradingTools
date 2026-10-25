import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, timeout as timeoutOp, tap } from 'rxjs/operators';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction?: string;
}

export interface CandlesResponse {
  candles: CandleData[];
}

@Injectable({
  providedIn: 'root'
})
export class CandlesDataService {
  private apiUrl = 'http://localhost:8080/api';
  private mockCandles: CandleData[] = [
    { open: 510.0, close: 500.0, low: 480.0, high: 515.0, direction: 'DOWN' }
  ];

  constructor(private http: HttpClient) {}

  getCandles(): Observable<CandlesResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<CandlesResponse>(`${this.apiUrl}/candles`, { headers, timeout: 30000 }).pipe(
      tap(response => console.log('API Response received:', response)),
      map(response => ({
        candles: response.candles?.map(candle => ({
          open: candle.open ?? 0,
          close: candle.close ?? 0,
          low: candle.low ?? 0,
          high: candle.high ?? 0,
          direction: candle.direction || 'UP'
        })) || []
      })),
      catchError(err => {
        console.error('API call failed, using mock data:', err);
        // Fall back to mock data if API is not available
        return of({ candles: this.mockCandles });
      })
    );
  }

  getBasicCandles(): Observable<CandleData[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<CandlesResponse>(`${this.apiUrl}/basic`, { headers }).pipe(
      tap(response => console.log('API Basic Response received:', response)),
      map(response => response.candles || []),
      catchError(err => {
        console.error('API basic call failed, using mock data:', err);
        return of(this.mockCandles);
      })
    );
  }

  generateCandles(quantity: number): Observable<CandleData[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<CandlesResponse>(`${this.apiUrl}/generate`, { quantity }, { headers }).pipe(
      map(response => response.candles || []),
      catchError(err => {
        console.error('API generate call failed, using mock data:', err);
        return of(this.mockCandles.slice(0, quantity));
      })
    );
  }
}
