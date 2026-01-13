
// ============================================================================
// tax-authority-api.service.ts - Handles Tax Authority API calls
// ============================================================================

import type { FileUploadConfig } from "./file-upload.config";
import type { UploadRequest, UploadUrlResponse } from "./file-upload.models";

@Injectable({
  providedIn: 'root'
})
export class TaxAuthorityApiService {
  constructor(private http: HttpClient) {}

  async getUploadUrls(token: string, request: UploadRequest): Promise<UploadUrlResponse> {
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    const response = await lastValueFrom(
      this.http.post<UploadUrlResponse>(FileUploadConfig.API_URL, request, { headers })
    );

    if (!response) {
      throw new Error('No response from API');
    }

    if (!response.success || !response.data) {
      const msg = response.error?.message || 'Unknown error';
      throw new Error(`API Error: ${msg} (${response.error?.errorCode})`);
    }

    // Validate exactly 2 files returned
    if (response.data.files.length !== FileUploadConfig.EXPECTED_FILES_COUNT) {
      throw new Error(
        `Expected ${FileUploadConfig.EXPECTED_FILES_COUNT} URLs, got ${response.data.files.length}`
      );
    }

    return response;
  }
}
function Injectable(arg0: { providedIn: string; }): (target: typeof TaxAuthorityApiService, context: ClassDecoratorContext<typeof TaxAuthorityApiService>) => void | typeof TaxAuthorityApiService {
    throw new Error("Function not implemented.");
}

function lastValueFrom(arg0: any) {
    throw new Error("Function not implemented.");
}

