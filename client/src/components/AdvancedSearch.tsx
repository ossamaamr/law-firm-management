import React, { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  Calendar,
  Tag,
  User,
} from "lucide-react";

/**
 * Advanced Search Component - مكون البحث المتقدم
 * Provides comprehensive search and filtering capabilities
 */

export interface SearchFilter {
  id: string;\n  label: string;
  type: \"text\" | \"select\" | \"date\" | \"multiselect\" | \"range\";
  placeholder?: string;
  options?: Array<{ value: string; label: string }>;
  value?: any;
}

interface AdvancedSearchProps {
  filters: SearchFilter[];
  onSearch: (query: string, filters: Record<string, any>) => void;
  onReset?: () => void;
  placeholder?: string;
  showAdvanced?: boolean;
}

export function AdvancedSearch({
  filters,
  onSearch,
  onReset,
  placeholder = "ابحث...",
  showAdvanced = true,
}: AdvancedSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterValues, setFilterValues] = useState<Record<string, any>>({});
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeFilters, setActiveFilters] = useState<string[]>([]);

  const handleSearch = () => {
    onSearch(searchQuery, filterValues);
  };

  const handleFilterChange = (filterId: string, value: any) => {
    const newValues = { ...filterValues, [filterId]: value };
    setFilterValues(newValues);

    if (value) {
      setActiveFilters((prev) =>
        prev.includes(filterId) ? prev : [...prev, filterId]
      );
    } else {
      setActiveFilters((prev) => prev.filter((f) => f !== filterId));
    }

    onSearch(searchQuery, newValues);
  };

  const handleReset = () => {
    setSearchQuery("");
    setFilterValues({});
    setActiveFilters([]);
    onReset?.();
  };

  const activeFilterCount = activeFilters.length;

  return (
    <div className="space-y-4">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder={placeholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && handleSearch()}
            className="pr-10"
          />
        </div>

        <Button onClick={handleSearch} className="gap-2">
          <Search className="w-4 h-4" />
          بحث
        </Button>

        {showAdvanced && (
          <Button
            variant="outline"
            onClick={() => setIsExpanded(!isExpanded)}
            className="gap-2"
          >
            <Filter className="w-4 h-4" />
            تصفية
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
            <ChevronDown
              className={`w-4 h-4 transition ${
                isExpanded ? "rotate-180" : ""
              }`}
            />
          </Button>
        )}

        {activeFilterCount > 0 && (
          <Button
            variant="ghost"
            onClick={handleReset}
            className="gap-2 text-red-600"
          >
            <X className="w-4 h-4" />
            إعادة تعيين
          </Button>
        )}
      </div>

      {/* Advanced Filters */}
      {isExpanded && showAdvanced && (
        <div className="bg-gray-50 border rounded-lg p-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filters.map((filter) => (
              <FilterField
                key={filter.id}
                filter={filter}
                value={filterValues[filter.id]}
                onChange={(value) => handleFilterChange(filter.id, value)}
              />
            ))}
          </div>

          {/* Active Filters Display */}
          {activeFilterCount > 0 && (
            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {activeFilters.map((filterId) => {
                const filter = filters.find((f) => f.id === filterId);
                const value = filterValues[filterId];
                return (
                  <Badge
                    key={filterId}
                    variant="secondary"
                    className="gap-2 px-3 py-1"
                  >
                    <span className="text-xs">
                      {filter?.label}: {value}
                    </span>
                    <button
                      onClick={() => handleFilterChange(filterId, null)}
                      className="hover:text-red-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Filter Field Component
 */
function FilterField({
  filter,
  value,
  onChange,
}: {
  filter: SearchFilter;
  value: any;
  onChange: (value: any) => void;
}) {
  switch (filter.type) {
    case "text":
      return (
        <div>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          <Input
            placeholder={filter.placeholder}
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case "select":
      return (
        <div>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          <Select value={value || ""} onValueChange={(v) => onChange(v || null)}>
            <SelectTrigger>
              <SelectValue placeholder={filter.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {filter.options?.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );

    case "date":
      return (
        <div>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          <Input
            type="date"
            value={value || ""}
            onChange={(e) => onChange(e.target.value || null)}
          />
        </div>
      );

    case "multiselect":
      return (
        <div>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          <div className="space-y-2">
            {filter.options?.map((opt) => (
              <label key={opt.value} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={value?.includes(opt.value) || false}
                  onChange={(e) => {
                    const newValue = value || [];
                    if (e.target.checked) {
                      onChange([...newValue, opt.value]);
                    } else {
                      onChange(
                        newValue.filter((v: string) => v !== opt.value)
                      );
                    }
                  }}
                  className="rounded"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case "range":
      return (
        <div>
          <label className="text-sm font-medium mb-2 block">{filter.label}</label>
          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="من"
              value={value?.min || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  min: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
            <Input
              type="number"
              placeholder="إلى"
              value={value?.max || ""}
              onChange={(e) =>
                onChange({
                  ...value,
                  max: e.target.value ? parseInt(e.target.value) : null,
                })
              }
            />
          </div>
        </div>
      );

    default:
      return null;
  }
}

/**
 * Search Results Component
 */
interface SearchResult {
  id: string;
  title: string;
  description?: string;
  type: string;
  metadata?: Record<string, any>;
}

interface SearchResultsProps {
  results: SearchResult[];
  isLoading?: boolean;
  onResultClick?: (result: SearchResult) => void;
}

export function SearchResults({
  results,
  isLoading = false,
  onResultClick,
}: SearchResultsProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
        <p className="text-gray-600">جاري البحث...</p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-center py-8">
        <Search className="w-8 h-8 text-gray-400 mx-auto mb-2" />
        <p className="text-gray-600">لم يتم العثور على نتائج</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {results.map((result) => (
        <div
          key={result.id}
          onClick={() => onResultClick?.(result)}
          className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{result.title}</h3>
              {result.description && (
                <p className="text-sm text-gray-600 mt-1">{result.description}</p>
              )}
            </div>
            <Badge variant="outline" className="ml-2">
              {result.type}
            </Badge>
          </div>
          {result.metadata && (
            <div className="flex gap-4 mt-2 text-xs text-gray-500">
              {Object.entries(result.metadata).map(([key, value]) => (
                <span key={key}>
                  {key}: {value}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
