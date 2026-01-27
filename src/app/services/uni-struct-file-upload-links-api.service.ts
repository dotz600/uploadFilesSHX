import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FileUploadConfig } from './file-upload.config';
import { UploadRequest, UploadUrlResponse } from './file-upload.models';

/**
 * Service to interact with the Unified Structure File Upload Links API.
 * This service is responsible for retrieving signed upload URLs for file uploads.
 */
@Injectable({
    providedIn: 'root'
})
export class UniStructFileUploadLinksApiService {
    constructor(private http: HttpClient) { }

    /**
     * Retrieves signed upload URLs for the specified files.
     *
     * @param authToken - The authentication bearer token.
     * @param uploadRequestData - The data required to request upload URLs (e.g., case number, period).
     * @returns A promise that resolves to the API response containing the upload URLs.
     */
    async getUploadUtils(authToken: string, uploadRequestData: UploadRequest): Promise<UploadUrlResponse> {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${authToken}`
        });

        try {
            console.log('1. Calling UniStruct File Upload Links API (GetUrlsForUploadingFiles)...');
            // We use 'any' here primarily because the API returns properties (like signUrl) that we want to map 
            // to cleaner names in our internal model (signedUploadUrl).
            const response = await lastValueFrom(
                this.http.post<any>(FileUploadConfig.API_URL, uploadRequestData, { headers })
            );
            console.log('2. API response received:', response);

            if (!response) {
                throw new Error('No response received from the API.');
            }

            if (!response.success || !response.data) {
                const errorMessage = response.error?.message || 'Unknown error occurred';
                throw new Error(`API returned an error: ${errorMessage} (Code: ${response.error?.errorCode})`);
            }

            if (response.data.files.length !== FileUploadConfig.EXPECTED_FILES_COUNT) {
                throw new Error(
                    `API Validation Failed: Expected ${FileUploadConfig.EXPECTED_FILES_COUNT} file URLs, but received ${response.data.files.length}.`
                );
            }

            // Map API response to our domain model
            const mappedResponse: UploadUrlResponse = {
                success: response.success,
                data: {
                    uniqueId: response.data.uniqueId,
                    files: response.data.files.map((f: any) => ({
                        fileName: f.fileName,
                        signedUploadUrl: f.signUrl, // Mapping signUrl -> signedUploadUrl
                        fileUniqueId: f.fileUniqueId,
                        headers: f.headers
                    }))
                },
                error: response.error
            };

            return mappedResponse;
        } catch (error) {
            console.error('UniStruct File Upload Links API Error:', error);
            throw error;
        }
    }
}
