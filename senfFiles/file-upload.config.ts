// ============================================================================
// file-upload.config.ts - Configuration
// ============================================================================

export class FileUploadConfig {
  static readonly API_URL = 'https://openapi.taxes.gov.il/shaam/shx/UniStructFileUploadLinksApi/v1/UploadingFile/GetUrlsForUploadingFiles';
  static readonly EXPECTED_FILES_COUNT = 2;
  static readonly CHUNK_SIZE_THRESHOLD = 2 * 1024 * 1024; // 2MB
  static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024;       // 1MB
}
