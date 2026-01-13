

// ============================================================================
// USAGE EXAMPLE
// ============================================================================


// app.module.ts or standalone component
import { HttpClientModule } from '@angular/common/http';
import { FileUploadService } from './services/file-upload.service';
import { TaxAuthorityApiService } from './services/tax-authority-api.service';
import { GoogleStorageService } from './services/google-storage.service';

@NgModule({
  imports: [HttpClientModule],
  providers: [
    FileUploadService,
    TaxAuthorityApiService,
    GoogleStorageService
  ]
})
export class AppModule {}

// Component
export class UploadComponent {
  constructor(private uploadService: FileUploadService) {}

  async onSingleFileUpload(file: File) {
    try {
      const fileId = await this.uploadService.uploadSingle(
        file,
        'YOUR_TOKEN',
        {
          caseNumber: 999999999,
          startPeriod: '01-01-2025',
          endPeriod: '01-10-2025'
        }
      );
      console.log('Uploaded! Save this ID:', fileId);
    } catch (error: any) {
      console.error('Failed:', error.message);
    }
  }

  async onPairUpload(file1: File, file2: File) {
    try {
      const [id1, id2] = await this.uploadService.uploadPair(
        [file1, file2],
        'YOUR_TOKEN',
        {
          caseNumber: 999999999,
          startPeriod: '01-01-2025',
          endPeriod: '01-10-2025'
        }
      );
      console.log('Both uploaded!', { id1, id2 });
    } catch (error: any) {
      console.error('Failed:', error.message);
    }
  }
}
function NgModule(arg0: { imports: any[]; providers: any[]; }): (target: typeof AppModule, context: ClassDecoratorContext<typeof AppModule>) => void | typeof AppModule {
    throw new Error('Function not implemented.');
}

