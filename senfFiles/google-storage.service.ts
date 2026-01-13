
// ============================================================================
// google-storage.service.ts - Handles Google Storage upload logic
// ============================================================================

import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GoogleStorageService {
  constructor(private http: HttpClient) {}

  async initiateUpload(signUrl: string, headers: FileHeaders, fileSize: number): Promise<string> {
    // Validate file size
    const [, maxSize] = headers['x-goog-content-length-range']
      .split(',')
      .map(s => parseInt(s.trim()));

    if (fileSize > maxSize) {
      throw new Error(`File size (${fileSize}) exceeds limit (${maxSize} bytes)`);
    }

    // Initiate resumable upload
    const response = await lastValueFrom(
      this.http.post(signUrl, null, {
        headers: new HttpHeaders(headers),
        observe: 'response',
        responseType: 'text'
      })
    );

    if (response.status !== 201) {
      throw new Error(`Upload initiation failed. Status: ${response.status}`);
    }

    const uploadUrl = response.headers.get('Location');
    if (!uploadUrl) {
      throw new Error('No upload URL received from server');
    }

    return uploadUrl;
  }

  async uploadChunks(file: File, uploadUrl: string, chunkSize: number): Promise<void> {
    const totalChunks = Math.ceil(file.size / chunkSize);

    for (let i = 1; i <= totalChunks; i++) {
      const start = (i - 1) * chunkSize;
      const end = Math.min(start + chunkSize, file.size);
      const chunk = file.slice(start, end);

      const headers = new HttpHeaders({
        'Content-Range': `bytes ${start}-${end - 1}/${file.size}`
      });

      try {
        await lastValueFrom(
          this.http.put(uploadUrl, chunk, {
            headers,
            reportProgress: true,
            responseType: 'text' as 'json'
          })
        );
      } catch (error: any) {
        if (error.status !== 308) { // 308 = chunk uploaded successfully
          throw new Error(`Chunk ${i}/${totalChunks} failed: ${error.message}`);
        }
      }

      console.log(`Chunk ${i}/${totalChunks} uploaded`);
    }
  }
}
