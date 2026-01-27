import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { lastValueFrom } from 'rxjs';
import { FileHeaders } from './file-upload.models';

/**
 * Service to handle direct interactions with Google Cloud Storage.
 * Supports resumable uploads.
 */
@Injectable({
    providedIn: 'root'
})
export class GoogleStorageService {
    constructor(private http: HttpClient) { }

    /**
     * Initiates a resumable upload session with Google Cloud Storage.
     *
     * @param signedUploadUrl - The signed URL provided by the backend to initiate the upload.
     * @param initialHeaders - Headers required for the initiation request (e.g., x-goog-resumable).
     * @param fileSizeInBytes - The total size of the file to be uploaded.
     * @returns A promise resolving to the actual upload URL to be used for sending file chunks.
     */
    async initiateResumableUpload(signedUploadUrl: string, initialHeaders: FileHeaders, fileSizeInBytes: number): Promise<string> {
        // Validate file size header if present in the allowed headers
        if (initialHeaders['x-goog-content-length-range']) {
            const [, maxSizeBytes] = initialHeaders['x-goog-content-length-range']
                .split(',')
                .map(s => parseInt(s.trim(), 10));

            if (fileSizeInBytes > maxSizeBytes) {
                throw new Error(`File size (${fileSizeInBytes} bytes) exceeds the limit of ${maxSizeBytes} bytes.`);
            }
        }

        // Prepare headers for the initiation request
        const httpHeaders = new HttpHeaders(initialHeaders);

        console.log('Initiating resumable upload session to:', signedUploadUrl);

        const response = await lastValueFrom(
            this.http.post(signedUploadUrl, null, {
                headers: httpHeaders,
                observe: 'response',
                responseType: 'text'
            })
        );

        if (response.status !== 201 && response.status !== 200) {
            throw new Error(`Failed to initiate upload. Server responded with status: ${response.status}`);
        }

        const actualUploadUrl = response.headers.get('Location');
        if (!actualUploadUrl) {
            throw new Error('Google Cloud Storage did not return an upload URL (Location header).');
        }

        return actualUploadUrl;
    }

    /**
     * Uploads a file in chunks to the specified upload URL.
     *
     * @param fileToUpload - The file object to upload.
     * @param uploadSessionUrl - The URL obtained from the initiation step.
     * @param chunkSizeInBytes - The size of each chunk to upload.
     */
    async uploadFileInChunks(fileToUpload: File, uploadSessionUrl: string, chunkSizeInBytes: number): Promise<void> {
        const totalChunks = Math.ceil(fileToUpload.size / chunkSizeInBytes);

        for (let chunkIndex = 1; chunkIndex <= totalChunks; chunkIndex++) {
            const startByte = (chunkIndex - 1) * chunkSizeInBytes;
            const endByte = Math.min(startByte + chunkSizeInBytes, fileToUpload.size);
            const fileChunk = fileToUpload.slice(startByte, endByte);

            const headers = new HttpHeaders({
                'Content-Range': `bytes ${startByte}-${endByte - 1}/${fileToUpload.size}`
            });

            try {
                // Determine if we need to report progress (could be an input param in future)
                // For now, we just upload.
                await lastValueFrom(
                    this.http.put(uploadSessionUrl, fileChunk, {
                        headers,
                        reportProgress: true,
                        responseType: 'text'
                    })
                );

                // Note: success handling is implicit if no error is thrown
                // but 308 Resume Incomplete is technically an 'error' flow in some clients, 
                // angular http client might handle 2xx/3xx differently. 
                // However, GCS returns 308 for Resume Incomplete (all chunks except last).
                // But HttpClient throws error for 308 usually? 
                // Let's actually catch 308 specifically if HttpClient treats it as error.

                console.log(`Chunk ${chunkIndex}/${totalChunks} uploaded successfully.`);

            } catch (error: any) {
                // Resume Incomplete (308) is actually 'Success' for intermediate chunks in GCS Resumable Upload protocol.
                if (error.status === 308) {
                    console.log(`Chunk ${chunkIndex}/${totalChunks} uploaded (Resume Incomplete - Standard GCS behavior)`);
                } else if (error.status >= 200 && error.status < 300) {
                    // 200/201 indicates completion of the upload (last chunk)
                    console.log(`Chunk ${chunkIndex}/${totalChunks} finished (Upload Complete).`);
                } else {
                    throw new Error(`Chunk ${chunkIndex}/${totalChunks} failed to upload: ${error.message || error}`);
                }
            }
        }
    }
}
