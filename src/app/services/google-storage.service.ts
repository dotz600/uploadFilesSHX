import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { FileHeaders } from './file-upload.models';
import { FileUploadConfig } from './file-upload.config';

@Injectable({
    providedIn: 'root'
})
export class GoogleStorageService {
    constructor(private http: HttpClient) { }

    async initiateUpload(signUrl: string, headers: FileHeaders, fileSize: number): Promise<string> {
        // Validate file size header if present
        if (headers['x-goog-content-length-range']) {
            const [, maxSize] = headers['x-goog-content-length-range']
                .split(',')
                .map(s => parseInt(s.trim()));

            if (fileSize > maxSize) {
                throw new Error(`File size (${fileSize}) exceeds limit (${maxSize} bytes)`);
            }
        }

        // Initiate resumable upload
        const httpHeaders = new HttpHeaders(headers);

        console.log('Initiating upload to:', signUrl);

        const response = await lastValueFrom(
            this.http.post(signUrl, null, {
                headers: httpHeaders,
                observe: 'response',
                responseType: 'text'
            })
        );

        if (response.status !== 201 && response.status !== 200) {
            throw new Error(`Upload initiation failed. Status: ${response.status}`);
        }

        const uploadUrl = response.headers.get('Location');
        if (!uploadUrl) {
            throw new Error('No upload URL received from GCS');
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
                        responseType: 'text'
                    })
                );
            } catch (error: any) {
                if (error.status === 308) {
                    console.log(`Chunk ${i}/${totalChunks} uploaded (Resume Incomplete)`);
                } else if (error.status >= 200 && error.status < 300) {
                    console.log(`Chunk ${i}/${totalChunks} uploaded successfully`);
                } else {
                    throw new Error(`Chunk ${i}/${totalChunks} failed: ${error.message || error}`);
                }
            }
        }
    }
}
