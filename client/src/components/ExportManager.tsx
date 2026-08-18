import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileText, Sheet, File } from "lucide-react";

/**
 * Export Manager Component - مدير التصدير
 * Handles exporting data in multiple formats
 */

export interface ExportColumn {
  id: string;
  label: string;
  value: (item: any) => string | number | boolean;
}

interface ExportManagerProps {
  data: any[];
  columns: ExportColumn[];
  filename?: string;
  onExport?: (format: string, data: any) => void;
}

export function ExportManager({
  data,
  columns,
  filename = "export",
  onExport,
}: ExportManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFormat, setSelectedFormat] = useState("csv");
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    columns.map((c) => c.id)
  );
  const [isExporting, setIsExporting] = useState(false);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((c) => c !== columnId)
        : [...prev, columnId]
    );
  };

  const getFilteredColumns = () =>
    columns.filter((c) => selectedColumns.includes(c.id));

  const exportToCSV = () => {
    const filteredColumns = getFilteredColumns();
    const headers = filteredColumns.map((c) => c.label).join(",");
    const rows = data.map((item) =>
      filteredColumns
        .map((col) => {
          const value = col.value(item);
          return typeof value === "string" && value.includes(",")
            ? `"${value}"`
            : value;
        })
        .join(",")
    );

    const csv = [headers, ...rows].join("\
");
    downloadFile(csv, `${filename}.csv`, "text/csv");
  };

  const exportToExcel = () => {
    const filteredColumns = getFilteredColumns();
    const headers = filteredColumns.map((c) => c.label);
    const rows = data.map((item) =>
      filteredColumns.map((col) => col.value(item))
    );

    // Create simple Excel-like format (TSV)
    const tsv = [
      headers.join("\\t"),
      ...rows.map((row) => row.join("\\t")),
    ].join("\
");

    downloadFile(tsv, `${filename}.xlsx`, "application/vnd.ms-excel");
  };

  const exportToJSON = () => {
    const filteredColumns = getFilteredColumns();
    const json = data.map((item) => {
      const obj: Record<string, any> = {};
      filteredColumns.forEach((col) => {
        obj[col.id] = col.value(item);
      });
      return obj;
    });

    downloadFile(
      JSON.stringify(json, null, 2),
      `${filename}.json`,
      "application/json"
    );
  };

  const exportToPDF = () => {
    // TODO: Implement PDF export with proper library
    alert("تصدير PDF قريباً");
  };

  const downloadFile = (content: string, name: string, type: string) => {
    setIsExporting(true);
    try {
      const blob = new Blob([content], { type });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      onExport?.(selectedFormat, data);
    } finally {
      setIsExporting(false);
      setIsOpen(false);
    }
  };

  const handleExport = () => {
    switch (selectedFormat) {
      case "csv":
        exportToCSV();
        break;
      case "excel":
        exportToExcel();
        break;
      case "json":
        exportToJSON();
        break;
      case "pdf":
        exportToPDF();
        break;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Download className="w-4 h-4" />
          تصدير
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>تصدير البيانات</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div>
            <label className="text-sm font-medium mb-2 block">الصيغة</label>
            <Select value={selectedFormat} onValueChange={setSelectedFormat}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="csv">
                  <div className="flex items-center gap-2">
                    <File className="w-4 h-4" />
                    CSV
                  </div>
                </SelectItem>
                <SelectItem value="excel">
                  <div className="flex items-center gap-2">
                    <Sheet className="w-4 h-4" />
                    Excel
                  </div>
                </SelectItem>
                <SelectItem value="json">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    JSON
                  </div>
                </SelectItem>
                <SelectItem value="pdf" disabled>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    PDF (قريباً)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Column Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">الأعمدة</label>
            <div className="space-y-2 max-h-64 overflow-y-auto border rounded-lg p-3">
              {columns.map((column) => (
                <label
                  key={column.id}
                  className="flex items-center gap-2 cursor-pointer"
                >
                  <Checkbox
                    checked={selectedColumns.includes(column.id)}
                    onCheckedChange={() => handleColumnToggle(column.id)}
                  />
                  <span className="text-sm">{column.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Summary */}
          <div className="bg-gray-50 p-3 rounded-lg text-sm">
            <p className="text-gray-600">
              سيتم تصدير <strong>{data.length}</strong> سجل مع{" "}
              <strong>{selectedColumns.length}</strong> عمود
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isExporting}
            >
              إلغاء
            </Button>
            <Button
              onClick={handleExport}
              disabled={isExporting || selectedColumns.length === 0}
              className="gap-2"
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  جاري التصدير...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  تصدير
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Batch Export Component
 */
interface BatchExportProps {
  datasets: Array<{
    name: string;
    data: any[];
    columns: ExportColumn[];
  }>;
  filename?: string;
}

export function BatchExport({ datasets, filename = "batch-export" }: BatchExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleBatchExport = async (format: string) => {
    setIsExporting(true);
    try {
      if (format === "csv") {
        // Export each dataset as separate CSV
        for (const dataset of datasets) {
          const headers = dataset.columns.map((c) => c.label).join(",");
          const rows = dataset.data.map((item) =>
            dataset.columns
              .map((col) => {
                const value = col.value(item);
                return typeof value === "string" && value.includes(",")
                  ? `"${value}"`
                  : value;
              })
              .join(",")
          );
          const csv = [headers, ...rows].join("\
");
          const blob = new Blob([csv], { type: "text/csv" });
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${filename}-${dataset.name}.csv`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        }
      }
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        variant="outline"
        onClick={() => handleBatchExport("csv")}
        disabled={isExporting}
        className="gap-2"
      >
        <Download className="w-4 h-4" />
        تصدير الكل (CSV)
      </Button>
    </div>
  );
}
