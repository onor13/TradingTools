import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface CandleData {
  open: number;
  close: number;
  low: number;
  high: number;
  direction: string;
}

export interface CandlesResponse {
  candles: CandleData[];
}

@Injectable({
  providedIn: 'root'
})
export class CandlesDataService {
  private apiUrl = 'http://localhost:8080/api';

  constructor(private http: HttpClient) {}

  getCandles(): Observable<CandlesResponse> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<CandlesResponse>(`${this.apiUrl}/candles`, { headers }).pipe(
      map(response => ({
        candles: response.candles?.map(candle => ({
          open: candle.open ?? 0,
          close: candle.close ?? 0,
          low: candle.low ?? 0,
          high: candle.high ?? 0,
          direction: candle.direction || 'UP'
        })) || []
      }))
    );
  }

  getBasicCandles(): Observable<CandleData[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.get<CandlesResponse>(`${this.apiUrl}/basic`, { headers }).pipe(
      map(response => response.candles || [])
    );
  }

  generateCandles(quantity: number): Observable<CandleData[]> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json'
    });

    return this.http.post<CandlesResponse>(`${this.apiUrl}/generate`, { quantity }, { headers }).pipe(
      map(response => response.candles || [])
    );
  }
}
