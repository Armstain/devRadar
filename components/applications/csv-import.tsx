'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';
import { toast } from 'react-hot-toast';
import Papa from 'papaparse';

export function CSVImport() {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('File type:', file.type); // Debug log
    
    // Check file extension instead of MIME type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast.error('Please upload a CSV file');
      return;
    }

    setIsUploading(true);

    try {
      const text = await file.text();
      
      // Log the first few lines of the file for debugging
      console.log('File content preview:', text.split('\n').slice(0, 2));

      const result = Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        delimiter: '', // auto-detect delimiter
        transformHeader: (header) => header.trim().toLowerCase(),
        error: (error) => {
          console.error('Papa Parse Error:', error);
          toast.error('Error parsing CSV: ' + error.message);
        },
        complete: (results) => {
          console.log('Parsing complete:', results);
        }
      });
      
      if (result.errors.length > 0) {
        console.error('CSV parsing errors:', result.errors);
        toast.error(`Error parsing CSV: ${result.errors[0].message}`);
        return;
      }

      if (!result.data || result.data.length === 0) {
        toast.error('No data found in CSV file');
        return;
      }

      // Log the first row to see the structure
      console.log('First row:', result.data[0]);

      // Check if CSV has required columns
      const requiredColumns = ['company', 'position'];
      const headers = Object.keys(result.data[0] || {}).map(h => h.toLowerCase());
      
      // Log found columns
      console.log('Found CSV columns:', Object.keys(result.data[0] || {}));
      
      const missingColumns = requiredColumns.filter(
        col => !headers.includes(col.toLowerCase())
      );

      if (missingColumns.length > 0) {
        toast.error(`Missing required columns: ${missingColumns.join(', ')}`);
        return;
      }

      // Map column names to our expected fields
      const columnMap = {
        company: headers.find(h => ['company', 'companyname'].includes(h)) || '',
        position: headers.find(h => ['position', 'jobtitle', 'title'].includes(h)) || '',
        status: headers.find(h => ['status'].includes(h)) || '',
        link: headers.find(h => ['link', 'url'].includes(h)) || '',
        notes: headers.find(h => ['notes', 'comments'].includes(h)) || ''
      };

      console.log('Using columns:', columnMap);
      
      const applications = result.data.map((row: any) => {
        // Create application with mapped columns
        const application = {
          company: row[columnMap.company] || row.Company || row['Company Name'] || '',
          position: row[columnMap.position] || row.Position || row['Job Title'] || row.Title || '',
          status: (row[columnMap.status] || row.Status || 'applied').toLowerCase(),
          link: row[columnMap.link] || row.Link || row.URL || '',
          notes: row[columnMap.notes] || row.Notes || row.Comments || ''
        };

        // Validate required fields
        if (!application.company || !application.position) {
          console.warn('Skipping row due to missing required fields:', row);
          return null;
        }

        return application;
      }).filter(Boolean); // Remove null entries

      if (applications.length === 0) {
        toast.error('No valid applications found in CSV');
        return;
      }

      // Show summary to user
      toast.success(
        `Found ${result.data.length} rows, importing ${applications.length} valid applications`
      );

      const response = await fetch('/api/applications/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ applications }),
      });

      if (!response.ok) {
        throw new Error('Failed to import applications');
      }

      const data = await response.json();
      toast.success(`Successfully imported ${data.imported} applications`);
      
      // Reset the file input
      event.target.value = '';
      
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Failed to import applications');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="file"
        accept=".csv"
        onChange={handleFileUpload}
        className="hidden"
        id="csv-upload"
        disabled={isUploading}
      />
      <label htmlFor="csv-upload">
        <Button
          variant="outline"
          className="cursor-pointer"
          disabled={isUploading}
          asChild
        >
          <span>
            <Upload className="mr-2 h-4 w-4" />
            Import CSV
          </span>
        </Button>
      </label>
    </div>
  );
}
