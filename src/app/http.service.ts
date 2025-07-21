import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private apiUrl = environment.apiUrl;
  constructor(private http: HttpClient) {}

  public get<T>(url: string): Observable<T> {
    return this.http.get<T>(`${this.apiUrl}/${url}`);
  }

  public post<T>(url: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${url}`, body);
  }

  public put<T>(url: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${url}`, body);
  }

  public delete<T>(url: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${url}`);
  }
}
