import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  ZoomOut,
  Download,
  X,
  FileText,
  Image as ImageIcon,
} from "lucide-react";

/**
 * Document Viewer Component - عارض المستندات
 * Supports PDF, images, and other document formats
 */

interface DocumentViewerProps {
  url: string;
  title?: string;
  type?: "pdf" | "image" | "document";
  onClose?: () => void;
}

export function DocumentViewer({
  url,
  title = "عارض المستندات",
  type = "pdf",
  onClose,
}: DocumentViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [zoom, setZoom] = useState(100);
  const [isLoading, setIsLoading] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Handle PDF rendering (simplified - in production use pdf.js)
  useEffect(() => {
    if (type === "pdf") {
      // TODO: Implement PDF rendering with pdf.js
      setTotalPages(5); // Mock total pages
      setIsLoading(false);
    } else if (type === "image") {
      setTotalPages(1);
      setIsLoading(false);
    }
  }, [url, type]);

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(Math.min(zoom + 10, 200));
  };

  const handleZoomOut = () => {
    setZoom(Math.max(zoom - 10, 50));
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = url;
    link.download = title || "document";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 border-b">
          <div className="flex items-center gap-2">
            {type === "pdf" ? (
              <FileText className="w-5 h-5" />
            ) : (
              <ImageIcon className="w-5 h-5" />
            )}
            <CardTitle>{title}</CardTitle>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        {/* Content */}
        <CardContent className="flex-1 overflow-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                <p className="text-gray-600">جاري تحميل المستند...</p>
              </div>
            </div>
          ) : type === "image" ? (
            <div className="flex items-center justify-center h-full">
              <img
                ref={imageRef}
                src={url}
                alt={title}
                style={{ maxWidth: "100%", maxHeight: "100%", zoom: `${zoom}%` }}
                className="object-contain"
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full bg-gray-100 rounded">
              <div className="text-center">
                <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">عارض PDF (يتطلب تحديث)</p>
                <a
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline mt-2 inline-block"
                >
                  فتح في نافذة جديدة
                </a>
              </div>
            </div>
          )}
        </CardContent>

        {/* Footer - Controls */}
        <div className="border-t p-4 flex items-center justify-between bg-gray-50">
          <div className="flex items-center gap-2">
            {type === "pdf" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
                <span className="text-sm font-medium px-2">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoom === 50}
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium px-2 min-w-12 text-center">
              {zoom}%
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoom === 200}
            >
              <ZoomIn className="w-4 h-4" />
            </Button>

            <div className="w-px h-6 bg-gray-300 mx-2"></div>

            <Button variant="outline" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-2" />
              تحميل
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/**
 * Document Viewer Modal Hook
 */
export function useDocumentViewer() {
  const [isOpen, setIsOpen] = useState(false);
  const [document, setDocument] = useState<{
    url: string;
    title: string;
    type: "pdf" | "image" | "document";
  } | null>(null);

  const openDocument = (
    url: string,
    title: string,
    type: "pdf" | "image" | "document" = "pdf"
  ) => {
    setDocument({ url, title, type });
    setIsOpen(true);
  };

  const closeDocument = () => {
    setIsOpen(false);
    setTimeout(() => setDocument(null), 300);
  };

  return {
    isOpen,
    document,
    openDocument,
    closeDocument,
    DocumentViewer: isOpen && document ? (
      <DocumentViewer
        url={document.url}
        title={document.title}
        type={document.type}
        onClose={closeDocument}
      />
    ) : null,
  };
}
