

// ============================================================================
// file-upload.service.ts - Main orchestration service
// ============================================================================

import { FileUploadConfig } from "./file-upload.config";
import type { UploadRequest } from "./file-upload.models";
import type { GoogleStorageService } from "./google-storage.service";
import taxAuthorityApiService = require("./tax-authority-api.service");

@Injectable({
  providedIn: 'root'
})
export class FileUploadService {
  constructor(
    private taxApi: taxAuthorityApiService.TaxAuthorityApiService,
    private storage: GoogleStorageService
  ) {}

  // Upload a single file (uses first URL from pair)
  async uploadSingle(file: File, token: string, request: UploadRequest): Promise<string> {
    const response = await this.taxApi.getUploadUrls(token, request);
    const fileData = response.data!.files[0];

    console.log('Uploading:', fileData.fileName);
    console.log('File ID:', fileData.fileUniqueId);

    const uploadUrl = await this.storage.initiateUpload(
      fileData.signUrl,
      fileData.headers,
      file.size
    );

    const chunkSize = this.calculateChunkSize(file.size);
    await this.storage.uploadChunks(file, uploadUrl, chunkSize);

    console.log('✓ Upload complete');
    return fileData.fileUniqueId;
  }

  // Upload a pair of files (uses both URLs)
  async uploadPair(
    files: [File, File],
    token: string,
    request: UploadRequest
  ): Promise<[string, string]> {
    const response = await this.taxApi.getUploadUrls(token, request);
    const fileIds: [string, string] = ['', ''];

    for (let i = 0; i < 2; i++) {
      const file = files[i];
      const fileData = response.data!.files[i];

      console.log(`Uploading ${i + 1}/2:`, fileData.fileName);

      const uploadUrl = await this.storage.initiateUpload(
        fileData.signUrl,
        fileData.headers,
        file.size
      );

      const chunkSize = this.calculateChunkSize(file.size);
      await this.storage.uploadChunks(file, uploadUrl, chunkSize);

      fileIds[i] = fileData.fileUniqueId;
      console.log(`✓ File ${i + 1} complete. ID: ${fileIds[i]}`);
    }

    return fileIds;
  }

  private calculateChunkSize(fileSize: number): number {
    return fileSize > FileUploadConfig.CHUNK_SIZE_THRESHOLD
      ? FileUploadConfig.DEFAULT_CHUNK_SIZE
      : fileSize;
  }
}

function Injectable(arg0: { providedIn: string; }): (target: typeof FileUploadService, context: ClassDecoratorContext<typeof FileUploadService>) => void | typeof FileUploadService {
    throw new Error("Function not implemented.");
}
