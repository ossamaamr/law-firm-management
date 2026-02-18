import React, { useState } from 'react';
import { Download, X, Eye, FileText, Image as ImageIcon, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface FileViewerProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  onClose?: () => void;
  isOpen?: boolean;
}

export const FileViewer: React.FC<FileViewerProps> = ({
  fileUrl,
  fileName,
  fileType,
  onClose,
  isOpen = true,
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const getFileExtension = (name: string): string => {
    return name.split('.').pop()?.toLowerCase() || '';
  };

  const extension = fileType || getFileExtension(fileName);

  const isPDF = extension === 'pdf';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(extension);
  const isDocument = ['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(extension);
  const isText = ['txt', 'md', 'json', 'xml', 'csv'].includes(extension);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderFileContent = () => {
    if (isPDF) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg overflow-auto">
          <iframe
            src={`${fileUrl}#toolbar=1&navpanes=0`}
            className="w-full h-full border-none"
            title={fileName}
          />
        </div>
      );
    }

    if (isImage) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded-lg">
          <img
            src={fileUrl}
            alt={fileName}
            className="max-w-full max-h-full object-contain"
          />
        </div>
      );
    }

    if (isDocument) {
      return (
        <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-8">
          <FileText className="w-16 h-16 text-gray-400 mb-4" />
          <p className="text-gray-600 mb-4 text-center">
            لا يمكن عرض هذا المستند مباشرة في المتصفح
          </p>
          <Button onClick={handleDownload} className="gap-2">
            <Download className="w-4 h-4" />
            تحميل المستند
          </Button>
        </div>
      );
    }

    if (isText) {
      return (
        <div className="w-full h-full bg-gray-50 rounded-lg p-6 overflow-auto">
          <iframe
            src={fileUrl}
            className="w-full h-full border-none"
            title={fileName}
          />
        </div>
      );
    }

    return (
      <div className="w-full h-full bg-gray-100 rounded-lg flex flex-col items-center justify-center p-8">
        <File className="w-16 h-16 text-gray-400 mb-4" />
        <p className="text-gray-600 mb-4 text-center">
          نوع الملف غير مدعوم للعرض المباشر
        </p>
        <Button onClick={handleDownload} className="gap-2">
          <Download className="w-4 h-4" />
          تحميل الملف
        </Button>
      </div>
    );
  };

  const viewerContent = (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {isPDF && <FileText className="w-5 h-5 text-red-500 flex-shrink-0" />}
          {isImage && <ImageIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />}
          {!isPDF && !isImage && <File className="w-5 h-5 text-gray-500 flex-shrink-0" />}
          <span className="text-sm font-medium text-gray-900 truncate">{fileName}</span>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDownload}
            title="تحميل الملف"
            className="gap-2"
          >
            <Download className="w-4 h-4" />
          </Button>

          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        {renderFileContent()}
      </div>

      {/* Footer */}
      {isPDF && (
        <div className="flex items-center justify-center gap-4 p-4 border-t border-gray-200 bg-gray-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
          >
            السابق
          </Button>
          <span className="text-sm text-gray-600">
            الصفحة {currentPage} من {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
        <div className="w-full h-full max-w-6xl flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white text-lg font-semibold">{fileName}</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="text-white hover:bg-gray-700"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="flex-1 bg-white rounded-lg overflow-hidden">
            {renderFileContent()}
          </div>
        </div>
      </div>
    );
  }

  return viewerContent;
};

/**
 * Document Preview Component - for quick preview without full viewer
 */
interface DocumentPreviewProps {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  className?: string;
}

export const DocumentPreview: React.FC<DocumentPreviewProps> = ({
  fileUrl,
  fileName,
  fileType,
  className = 'w-full h-64',
}) => {
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const extension = fileType || fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);

  return (
    <>
      <div className={`${className} bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors group relative`}
        onClick={() => setIsViewerOpen(true)}
      >
        {isImage ? (
          <img
            src={fileUrl}
            alt={fileName}
            className="w-full h-full object-cover rounded-lg"
          />
        ) : (
          <div className="flex flex-col items-center gap-2 text-gray-500">
            <FileText className="w-12 h-12" />
            <span className="text-sm">{fileName}</span>
          </div>
        )}

        <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-lg transition-all flex items-center justify-center">
          <Eye className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>

      <Dialog open={isViewerOpen} onOpenChange={setIsViewerOpen}>
        <DialogContent className="max-w-4xl h-[80vh] p-0">
          <FileViewer
            fileUrl={fileUrl}
            fileName={fileName}
            fileType={fileType}
            onClose={() => setIsViewerOpen(false)}
            isOpen={isViewerOpen}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};

/**
 * File Upload Component with Preview
 */
interface FileUploadProps {
  onFileSelect: (file: File) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  accept = '.pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFile(files[0]);
    }
  };

  const handleFile = (file: File) => {
    if (file.size > maxSize) {
      alert(`حجم الملف يتجاوز الحد الأقصى المسموح (${maxSize / 1024 / 1024}MB)`);
      return;
    }
    onFileSelect(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div
      className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
        isDragging
          ? 'border-blue-500 bg-blue-50'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleFileInput}
        disabled={disabled}
        className="hidden"
      />

      <File className="w-12 h-12 text-gray-400 mx-auto mb-3" />
      <p className="text-gray-700 font-medium mb-1">
        اسحب الملف هنا أو انقر للاختيار
      </p>
      <p className="text-sm text-gray-500">
        الملفات المدعومة: PDF, صور, مستندات (Max {maxSize / 1024 / 1024}MB)
      </p>
    </div>
  );
};
