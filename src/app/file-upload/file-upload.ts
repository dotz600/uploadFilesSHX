import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-file-upload',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './file-upload.html',
  styleUrls: ['./file-upload.css']
})
export class FileUploadComponent {
  @Input() title: string = 'Upload File';
  @Input() accept: string = '*/*';
  @Output() fileSelected = new EventEmitter<File | null>();

  files: File[] = [];
  isDragging = false;

  onFileSelected(event: any) {
    const selectedFiles = Array.from(event.target.files as FileList);
    if (selectedFiles.length > 0) {
      this.processFile(selectedFiles[0]);
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;

    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  processFile(file: File) {
    this.files = [file];
    this.fileSelected.emit(file);
  }

  removeFile() {
    this.files = [];
    this.fileSelected.emit(null);
  }
}
