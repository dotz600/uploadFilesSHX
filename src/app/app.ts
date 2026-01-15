import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from './file-upload/file-upload';
import { FileUploadService } from './services/file-upload.service';
import { UploadRequest } from './services/file-upload.models';
import { AppConfigService } from './services/app-config.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule, FileUploadComponent],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent {
  title = 'file-upload-app';

  // Form State
  caseNumber: number | null = 529999989;
  startPeriod: string = '2025-01-01';
  endPeriod: string = '2025-12-31';
  token: string = '';
  isTokenSet = false;

  // Files
  iniFile: File | null = null;
  bkmvdataFile: File | null = null;

  isUploading = false;
  isSuccess = false;
  uploadStatus = '';

  constructor(
    private uploadService: FileUploadService,
    private cdr: ChangeDetectorRef,
    public configService: AppConfigService
  ) { }

  get isDemoMode(): boolean {
    return this.configService.isDemoMode;
  }

  toggleDemoMode(): void {
    this.configService.toggleDemoMode();
  }

  setToken() {
    let cleanToken = this.token.trim();
    if (cleanToken.toLowerCase().startsWith('bearer ')) {
      cleanToken = cleanToken.substring(7).trim();
      this.token = cleanToken;
    }

    if (cleanToken.length > 0) {
      this.isTokenSet = true;
    } else {
      this.isTokenSet = false;
      alert('אנא הזן טוקן תקין.');
    }
  }

  onIniSelected(file: File | null) {
    this.iniFile = file;
  }

  onBkmvdataSelected(file: File | null) {
    this.bkmvdataFile = file;
  }

  async sendFiles() {
    if (!this.iniFile || !this.bkmvdataFile) {
      alert('אנא בחר את שני הקבצים.');
      return;
    }
    if (!this.caseNumber || !this.startPeriod || !this.endPeriod) {
      alert('אנא מלא את כל הפרטים (מספר תיק, תאריכים).');
      return;
    }

    try {
      console.log('--- Send Files Started ---');
      this.isUploading = true;
      this.uploadStatus = 'מתחילה בשידור...';

      // Check if demo mode is enabled
      if (this.isDemoMode) {
        console.log('🎭 DEMO MODE: Simulating upload...');
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        console.log('🎭 DEMO MODE: Upload simulation complete');
        this.uploadStatus = 'העלאה הושלמה בהצלחה!';
        this.isSuccess = true;
      } else {
        // Production mode - real API calls
        const request: UploadRequest = {
          caseNumber: this.caseNumber,
          startPeriod: this.startPeriod,
          endPeriod: this.endPeriod,
        };

        await this.uploadService.uploadPair(
          [this.iniFile!, this.bkmvdataFile!],
          this.token,
          request
        );

        this.uploadStatus = 'העלאה הושלמה בהצלחה!';
        this.isSuccess = true;
      }
    } catch (error: any) {
      console.error('Upload failed', error);
      this.uploadStatus = `העלאה נכשלה: ${error.message}`;
    } finally {
      this.isUploading = false;
      this.cdr.detectChanges();
      console.log('--- Send Files Finished (State Reset) ---');
    }
  }

  resetForm() {
    this.isSuccess = false;
    this.isUploading = false;
    this.uploadStatus = '';
    this.iniFile = null;
    this.bkmvdataFile = null;
    // Keep CaseNumber and Dates for convenience unless asked otherwise
  }
}
