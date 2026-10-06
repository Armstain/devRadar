'use client';

import { useState } from 'react';
import axios from 'axios';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { parseApplicationsCsv } from '@/lib/csv-import';

const MAX_FILE_BYTES = 1024 * 1024;
const MAX_ROWS = 500;

export function CSVImport({ size = "md" }: { size?: "md" | "lg" }) {
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const input = event.target;
    const file = input.files?.[0];
    if (!file) return;

    // Check file extension instead of MIME type, which varies by OS
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      input.value = '';
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error('CSV files must be smaller than 1 MB');
      input.value = '';
      return;
    }

    setIsUploading(true);

    try {
      const { applications, totalRows, skippedRows, error } = parseApplicationsCsv(await file.text());

      if (error) {
        toast.error(error);
        return;
      }
      if (applications.length === 0) {
        toast.error('No valid applications found in CSV');
        return;
      }
      if (applications.length > MAX_ROWS) {
        toast.error(`You can import up to ${MAX_ROWS} applications at a time`);
        return;
      }

      const { data } = await axios.post('/api/applications/import', { applications });
      await queryClient.invalidateQueries({ queryKey: ['applications'] });

      const skipped = skippedRows.length
        ? ` Skipped ${skippedRows.length} of ${totalRows} rows with missing or invalid fields (rows ${skippedRows.slice(0, 5).join(', ')}${skippedRows.length > 5 ? ', …' : ''}).`
        : '';
      toast.success(`Imported ${data.imported} applications.${skipped}`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import applications');
    } finally {
      input.value = '';
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv,text/csv"
        onChange={handleFileUpload}
        className="peer sr-only"
        id="csv-upload"
        disabled={isUploading}
      />
      <Button
        variant="secondary"
        size={size}
        className="cursor-pointer peer-focus-visible:outline-2 peer-focus-visible:outline-signal"
        disabled={isUploading}
        asChild
      >
        <label htmlFor="csv-upload">
          <Upload aria-hidden="true" />
          {isUploading ? 'Importing…' : 'Import CSV'}
        </label>
      </Button>
    </div>
  );
}
