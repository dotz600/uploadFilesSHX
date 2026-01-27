import { Injectable } from '@angular/core';
import { FileUploadConfig } from './file-upload.config';
import { UploadRequest } from './file-upload.models';
import { GoogleStorageService } from './google-storage.service';
import { UniStructFileUploadLinksApiService } from './uni-struct-file-upload-links-api.service';

/**
 * Service to handle the entire file upload process.
 * Orchestrates fetching upload URLs and uploading files to Google Storage.
 */
@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    constructor(
        private uploadLinksApi: UniStructFileUploadLinksApiService,
        private googleStorageService: GoogleStorageService
    ) { }

    /**
     * Uploads a pair of files (e.g., data file and configuration file) to the cloud.
     *
     * @param filesToUpload - Tuple containing two files to upload.
     * @param authToken - The authentication token.
     * @param uploadRequestData - Metadata needed to request upload URLs.
     * @returns A promise resolving to a tuple of unique file IDs.
     */
    async uploadPair(
        filesToUpload: [File, File], // [INI, BKMVDATA]
        authToken: string,
        uploadRequestData: UploadRequest
    ): Promise<[string, string]> {
        // 1. Get Signed Upload URLs
        console.log('A. Requesting signed upload URLs from UniStruct API...');
        const apiResponse = await this.uploadLinksApi.getUploadUtils(authToken, uploadRequestData);
        console.log('B. Signed URLs received. Total files expected:', apiResponse.data?.files.length);

        const uploadedFileIds: [string, string] = ['', ''];

        // 2. Upload each file using the received URLs
        for (let i = 0; i < 2; i++) {
            const currentLocalFile = filesToUpload[i];
            if (!currentLocalFile) {
                console.warn(`File at index ${i} is missing, skipping upload.`);
                continue;
            }

            const remoteFileData = apiResponse.data!.files[i];

            console.log(`Step ${i + 1}/2: Uploading local file "${currentLocalFile.name}" to cloud as "${remoteFileData.fileName}"`);
            console.log(`Sign URL: ${remoteFileData.signedUploadUrl}`);

            try {
                // 3. Initiate Resumable Upload
                const resumableUploadUrl = await this.googleStorageService.initiateResumableUpload(
                    remoteFileData.signedUploadUrl,
                    remoteFileData.headers,
                    currentLocalFile.size
                );

                // 4. Perform Chunked Upload
                const optimalChunkSize = this.calculateOptimalChunkSize(currentLocalFile.size);
                await this.googleStorageService.uploadFileInChunks(currentLocalFile, resumableUploadUrl, optimalChunkSize);

                uploadedFileIds[i] = remoteFileData.fileUniqueId;
                console.log(`✓ File ${i + 1} upload complete. ID: ${uploadedFileIds[i]}`);
            } catch (err: any) {
                console.error(`Error during upload of file ${i + 1}:`, err);
                throw new Error(`Failed to upload file ${i + 1} (${currentLocalFile.name}): ${err.message || err}`);
            }
        }

        return uploadedFileIds;
    }

    private calculateOptimalChunkSize(fileSize: number): number {
        return fileSize > FileUploadConfig.CHUNK_SIZE_THRESHOLD
            ? FileUploadConfig.DEFAULT_CHUNK_SIZE
            : fileSize;
    }
}
