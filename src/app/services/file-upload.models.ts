export interface UploadRequest {
    caseNumber: number;
    startPeriod: string;      // Format: DD-MM-YYYY
    endPeriod: string;        // Format: DD-MM-YYYY
    representorCompanyId?: number;
}

export interface FileHeaders {
    'x-goog-content-length-range': string;
    'x-goog-resumable': string;
    [key: string]: string; // Index signature to allow other headers if needed
}

export interface FileData {
    fileName: string;
    signUrl: string;
    fileUniqueId: string;
    headers: FileHeaders;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T | null;
    error: {
        errorCode: number;
        message: string;
    } | null;
}

export interface UploadUrlsData {
    uniqueId: string;
    files: FileData[];
}

export type UploadUrlResponse = ApiResponse<UploadUrlsData>;
