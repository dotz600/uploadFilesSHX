import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { FileUploadConfig } from './file-upload.config';
import { UploadRequest, UploadUrlResponse } from './file-upload.models';

@Injectable({
    providedIn: 'root'
})
export class TaxAuthorityApiService {
    constructor(private http: HttpClient) { }

    async getUploadUrls(token: string, request: UploadRequest): Promise<UploadUrlResponse> {
        const headers = new HttpHeaders({
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
        });

        // Note: Token is passed dynamically now
        // if (token) {
        //     headers.append('Authorization', `Bearer ${token}`);
        // }

        try {
            const response = await lastValueFrom(
                this.http.post<UploadUrlResponse>(FileUploadConfig.API_URL, request, { headers })
            );
            console.log('Tax API Full Response:', response);

            if (!response) {
                throw new Error('No response from API');
            }

            if (!response.success || !response.data) {
                const msg = response.error?.message || 'Unknown error';
                throw new Error(`API Error: ${msg} (${response.error?.errorCode})`);
            }

            if (response.data.files.length !== FileUploadConfig.EXPECTED_FILES_COUNT) {
                throw new Error(
                    `Expected ${FileUploadConfig.EXPECTED_FILES_COUNT} URLs, got ${response.data.files.length}`
                );
            }

            return response;
        } catch (error) {
            console.error('Tax API Error:', error);
            throw error;
        }
    }
}
