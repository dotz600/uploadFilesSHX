import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { FileHeaders } from './file-upload.models';

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
        // We must pass the specific headers required by the signed URL
        const httpHeaders = new HttpHeaders();
        Object.keys(headers).forEach(key => {
            httpHeaders.append(key, headers[key]);
        });

        // Note: The example code passed 'null' as body for POST, and headers in options.
        // We need to match the signature exactly.
        // The previous code did: new HttpHeaders(headers) which assumes headers is a simple map. It is.

        const response = await lastValueFrom(
            this.http.post(signUrl, null, {
                headers: new HttpHeaders(headers as any),
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
                        responseType: 'text'
                    })
                );
            } catch (error: any) {
                if (error.status !== 308) { // 308 = chunk uploaded successfully / resume incomplete
                    // Actually 308 is expected for incomplete resume, but if we finish the last chunk we might get 200/201.
                    // Angular HttpClient might throw on 308 depending on config, but standard XHR treats it as status.
                    // Let's assume standard behavior: if it fails with something other than 308 (Resume Incomplete) or 200/201 (Created/OK), it's an error.
                    if (error.status === 308) {
                        // This is actually fine for intermediate chunks
                    } else {
                        throw new Error(`Chunk ${i}/${totalChunks} failed: ${error.message || error}`);
                    }
                }
            }

            console.log(`Chunk ${i}/${totalChunks} uploaded`);
        }
    }
}
