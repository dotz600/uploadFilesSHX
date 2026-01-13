import { Injectable } from '@angular/core';
import { FileUploadConfig } from './file-upload.config';
import { UploadRequest } from './file-upload.models';
import { GoogleStorageService } from './google-storage.service';
import { TaxAuthorityApiService } from './tax-authority-api.service';

@Injectable({
    providedIn: 'root'
})
export class FileUploadService {
    constructor(
        private taxApi: TaxAuthorityApiService,
        private storage: GoogleStorageService
    ) { }

    // Upload a pair of files (uses both URLs)
    async uploadPair(
        files: [File, File], // [INI, BKMVDATA]
        token: string,
        request: UploadRequest
    ): Promise<[string, string]> {
        // 1. Get URLs
        console.log('Fetching upload URLs...');
        const response = await this.taxApi.getUploadUrls(token, request);
        const fileIds: [string, string] = ['', ''];

        // 2. Upload each file
        for (let i = 0; i < 2; i++) {
            const file = files[i];
            if (!file) {
                console.warn(`File index ${i} is missing, skipping.`);
                continue;
            }

            const fileData = response.data!.files[i];

            console.log(`Step ${i + 1}/2: Uploading local file "${file.name}" to remote file name "${fileData.fileName}"`);
            console.log(`Using Sign URL: ${fileData.signUrl}`);

            try {
                // 3. Initiate
                const uploadUrl = await this.storage.initiateUpload(
                    fileData.signUrl,
                    fileData.headers,
                    file.size
                );

                // 4. Chunked Upload
                const chunkSize = this.calculateChunkSize(file.size);
                await this.storage.uploadChunks(file, uploadUrl, chunkSize);

                fileIds[i] = fileData.fileUniqueId;
                console.log(`✓ File ${i + 1} complete. ID: ${fileIds[i]}`);
            } catch (err: any) {
                console.error(`Error during upload of file ${i + 1}:`, err);
                throw new Error(`Failed to upload file ${i + 1} (${file.name}): ${err.message || err}`);
            }
        }

        return fileIds;
    }

    private calculateChunkSize(fileSize: number): number {
        return fileSize > FileUploadConfig.CHUNK_SIZE_THRESHOLD
            ? FileUploadConfig.DEFAULT_CHUNK_SIZE
            : fileSize;
    }
}
