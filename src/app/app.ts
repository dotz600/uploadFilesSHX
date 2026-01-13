import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FileUploadComponent } from './file-upload/file-upload';
import { FileUploadService } from './services/file-upload.service';
import { UploadRequest } from './services/file-upload.models';

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
  caseNumber: number | null = null;
  startPeriod: string = '';
  endPeriod: string = '';
  token: string = '';
  isTokenSet = false;

  // Files
  iniFile: File | null = null;
  bkmvdataFile: File | null = null;

  isUploading = false;
  uploadStatus = '';

  constructor(private uploadService: FileUploadService) { } // Using property injection instead of constructor injection if preferred, but ctor is standard. Fix imports above if needed.

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
      alert('Please enter a valid token.');
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
      alert('Please select both files.');
      return;
    }
    if (!this.caseNumber || !this.startPeriod || !this.endPeriod) {
      alert('Please fill in all details (Case Number, Dates).');
      return;
    }

    this.isUploading = true;
    this.uploadStatus = 'Starting upload...';

    const request: UploadRequest = {
      caseNumber: this.caseNumber,
      startPeriod: this.startPeriod, // Ensure format is DD-MM-YYYY if user inputs ISO
      endPeriod: this.endPeriod,
    };

    try {
      // Assuming files order: [0] = INI, [1] = BKMVDATA. 
      // The API usually expects them in a specific order or doesn't care if configured right.
      // Based on previous conversations, I'll pass them in the order displayed.
      await this.uploadService.uploadPair(
        [this.iniFile, this.bkmvdataFile],
        this.token,
        request
      );

      this.uploadStatus = 'Upload successfully completed!';
      alert('Upload successfully completed!');
    } catch (error: any) {
      console.error('Upload failed', error);
      this.uploadStatus = `Upload failed: ${error.message}`;
      alert(`Upload failed: ${error.message}`);
    } finally {
      this.isUploading = false;
    }
  }
}
