import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { getCookie, setCookie } from '../shared/cookie.util';

const COOKIE_NAME = 'dragToggleEnabled'; // "true" → enabled, anything else → disabled

@Injectable({ providedIn: 'root' })
export class EditModeService {
  private _enabled$ = new BehaviorSubject<boolean>(this.readFromCookie());

  /** Observable for components */
  get enabled$(): Observable<boolean> { return this._enabled$.asObservable(); }

  /** Current boolean value (for template bindings) */
  get isEnabled(): boolean { return this._enabled$.value; }

  /** Toggle the state and persist to cookie */
  toggle(): void {
    const newVal = !this._enabled$.value;
    this._enabled$.next(newVal);
    setCookie(COOKIE_NAME, String(newVal));
  }

  /** Initialise from existing cookie (defaults to true) */
  private readFromCookie(): boolean {
    const v = getCookie(COOKIE_NAME);
    return v === null ? true : v === 'true';
  }
}
