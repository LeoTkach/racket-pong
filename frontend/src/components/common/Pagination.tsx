import React from "react";
import { Button } from "../ui/button";
import { typography } from "../../utils/typography";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  showPageInfo?: boolean;
  className?: string;
  maxButtons?: number;
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  showPageInfo = true,
  className = "",
  maxButtons = 5,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  // Calculate which page numbers to show (max 5 buttons by default)
  const getPageNumbers = () => {
    if (totalPages <= maxButtons) {
      // Show all pages if total is maxButtons or less
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    } else if (currentPage <= 3) {
      // Show first maxButtons pages if we're near the start
      return Array.from({ length: maxButtons }, (_, i) => i + 1);
    } else if (currentPage >= totalPages - 2) {
      // Show last maxButtons pages if we're near the end
      return Array.from(
        { length: maxButtons },
        (_, i) => totalPages - maxButtons + i + 1
      );
    } else {
      // Show 2 pages before, current, and 2 pages after (for maxButtons=5)
      const halfButtons = Math.floor(maxButtons / 2);
      return Array.from(
        { length: maxButtons },
        (_, i) => currentPage - halfButtons + i
      );
    }
  };

  const pageNumbers = getPageNumbers();

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
      >
        Previous
      </Button>
      <div className="flex items-center gap-1">
        {pageNumbers.map((page) => (
          <Button
            key={page}
            variant={currentPage === page ? "default" : "outline"}
            size="sm"
            onClick={() => onPageChange(page)}
            className="w-10"
          >
            {page}
          </Button>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
      >
        Next
      </Button>
      {showPageInfo && (
        <span className={`${typography.infoText} ml-2`}>
          Page {currentPage} of {totalPages}
        </span>
      )}
    </div>
  );
}

