import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AppConfigService {
    private _isDemoMode = false;

    get isDemoMode(): boolean {
        return this._isDemoMode;
    }

    toggleDemoMode(): void {
        this._isDemoMode = !this._isDemoMode;
        console.log(`Demo mode ${this._isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    }

    setDemoMode(enabled: boolean): void {
        this._isDemoMode = enabled;
        console.log(`Demo mode ${this._isDemoMode ? 'ENABLED' : 'DISABLED'}`);
    }
}
