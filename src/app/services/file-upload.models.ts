/**
 * Represents the request payload for initiating the file upload process.
 */
export interface UploadRequest {
    /** The case number associated with the files. */
    caseNumber: number;
    /** The start of the reporting period (Format: YYYY-MM-DD). */
    startPeriod: string;
    /** The end of the reporting period (Format: YYYY-MM-DD). */
    endPeriod: string;
    /** Optional identifier for the company representing the client. */
    representorCompanyId?: number;
}

/**
 * Represents the headers required for the file upload request.
 */
export interface FileHeaders {
    /** The expected content length range for the file (e.g., "0,10485760"). */
    'x-goog-content-length-range': string;
    /** The resumable session header used by Google Cloud Storage. */
    'x-goog-resumable': string;
    /** Index signature to allow additional custom headers if needed. */
    [key: string]: string;
}

/**
 * Represents metadata for a single file to be uploaded.
 */
export interface FileData {
    /** The name of the file as expected by the remote server. */
    fileName: string;
    /** The signed URL to be used for initiating the upload. */
    signedUploadUrl: string; // Renamed from signUrl for clarity
    /** A unique identifier assigned to the file by the system. */
    fileUniqueId: string;
    /** The headers that must be sent with the upload request. */
    headers: FileHeaders;
}

/**
 * Generic API response wrapper.
 */
export interface ApiResponse<T> {
    /** Indicates whether the API call was successful. */
    success: boolean;
    /** The data returned by the API, if successful. */
    data: T | null;
    /** Error details, if the API call failed. */
    error: {
        errorCode: number;
        message: string;
    } | null;
}

/**
 * The specific data payload returned when requesting upload URLs.
 */
export interface UploadUrlsData {
    /** A unique identifier for the upload transaction. */
    uniqueId: string;
    /** A list of file metadata objects containing upload URLs. */
    files: FileData[];
}

/**
 * Type alias for the specific API response containing upload URLs.
 */
export type UploadUrlResponse = ApiResponse<UploadUrlsData>;
