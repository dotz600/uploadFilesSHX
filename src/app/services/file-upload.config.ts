/**
 * Configuration constants for the File Upload Service.
 */
export class FileUploadConfig {
    /** The endpoint for the UniStruct File Upload Links API. */
    static readonly API_URL = 'https://openapi.taxes.gov.il/shaam/shx/UniStructFileUploadLinksApi/v1/UploadingFile/GetUrlsForUploadingFiles';

    /** 
     * The authentication bearer token. 
     * @todo Replaced this with a dynamic token service or environment variable in production.
     */
    static readonly AUTH_TOKEN = 'YOUR_BEARER_TOKEN_HERE';

    /** The number of files expected to be uploaded in a standard pair (INI + BKMVDATA). */
    static readonly EXPECTED_FILES_COUNT = 2;

    /** The file size threshold (in bytes) above which chunked upload is preferred or chunk size is adjusted. 2MB. */
    static readonly CHUNK_SIZE_THRESHOLD = 2 * 1024 * 1024;

    /** The default chunk size (in bytes) for uploads. 1MB. */
    static readonly DEFAULT_CHUNK_SIZE = 1024 * 1024;
}
