'use client';

/**
 * Upload Component
 * Handles screenshot upload and user interaction
 */

import { useState, useRef, useEffect, ChangeEvent, FormEvent, DragEvent } from 'react';
import { JobRecord, UploadResponse } from '@/lib/types';

const VALID_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
const MAX_SIZE = 10 * 1024 * 1024;

function validateFile(file: File, onError: (msg: string) => void): boolean {
  if (!VALID_TYPES.includes(file.type)) {
    onError('Invalid image format. Please upload PNG, JPG, JPEG, or WebP');
    return false;
  }
  if (file.size > MAX_SIZE) {
    onError('Image size must be less than 10MB');
    return false;
  }
  return true;
}

function setFileAndPreview(file: File, setSelectedFile: (f: File | null) => void, setPreviewUrl: (u: string | null) => void) {
  setSelectedFile(file);
  const reader = new FileReader();
  reader.onloadend = () => setPreviewUrl(reader.result as string);
  reader.readAsDataURL(file);
}

interface UploadComponentProps {
  onUploadComplete: (jobRecord: JobRecord) => void;
  onError: (error: string) => void;
}

export default function UploadComponent({ onUploadComplete, onError }: UploadComponentProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [promptText, setPromptText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle file selection (input change)
   */
  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!validateFile(file, onError)) return;
    setFileAndPreview(file, setSelectedFile, setPreviewUrl);
  };

  /**
   * Handle drag over - allow drop
   */
  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isLoading && !selectedFile) setIsDragging(true);
  };

  /**
   * Handle drag leave
   */
  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  };

  /**
   * Handle drop - validate and set file
   */
  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isLoading || selectedFile) return;
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    if (!validateFile(file, onError)) return;
    setFileAndPreview(file, setSelectedFile, setPreviewUrl);
  };

  /**
   * Handle paste - use image from clipboard (e.g. screenshot)
   */
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isLoading) return;
      const target = e.target as HTMLElement | null;
      if (target?.tagName === 'INPUT' || target?.tagName === 'TEXTAREA') return;
      const data = e.clipboardData;
      if (!data) return;
      let file: File | null = data.files?.[0] ?? null;
      if (!file && data.items) {
        for (const item of data.items) {
          if (item.kind === 'file' && item.type.startsWith('image/')) {
            file = item.getAsFile();
            break;
          }
        }
      }
      if (!file || !file.type.startsWith('image/')) return;
      if (!validateFile(file, onError)) return;
      setFileAndPreview(file, setSelectedFile, setPreviewUrl);
      e.preventDefault();
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isLoading, onError]);

  /**
   * Handle form submission
   */
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile || !previewUrl) {
      onError('Please select an image');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Send to upload API
      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: previewUrl,
          promptText: promptText.trim() || undefined
        })
      });
      
      const data: UploadResponse = await response.json();
      
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Upload failed');
      }
      
      if (data.jobRecord) {
        onUploadComplete(data.jobRecord);
        
        // Reset form
        setSelectedFile(null);
        setPreviewUrl(null);
        setPromptText('');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      
    } catch (error) {
      onError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsLoading(false);
    }
  };
  
  /**
   * Clear selected file
   */
  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  return (
    <div className="w-full max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* File Input - with drag and drop */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging
              ? 'border-[var(--blue-bright)] bg-[var(--blue-soft)]'
              : 'border-[var(--border)] hover:border-[var(--border-hover)] hover:bg-[rgba(255,255,255,0.01)]'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/jpg,image/webp"
            onChange={handleFileChange}
            className="hidden"
            id="file-upload"
            disabled={isLoading}
          />
          <label
            htmlFor="file-upload"
            className="cursor-pointer block"
          >
            {previewUrl ? (
              <div className="space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={previewUrl}
                  alt="Preview"
                  className="max-h-64 mx-auto rounded-lg"
                />
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-sm text-[var(--gray)] hover:text-[var(--white)]"
                  disabled={isLoading}
                >
                  Change image
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg
                  className="mx-auto h-12 w-12 text-[var(--faint)]"
                  stroke="currentColor"
                  fill="none"
                  viewBox="0 0 48 48"
                  aria-hidden="true"
                >
                  <path
                    d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <div className="text-sm text-[var(--gray)]">
                  <span className="font-medium text-[var(--blue-bright)] hover:text-[var(--white)] transition-colors">
                    Upload a screenshot
                  </span>
                  , paste from clipboard, or drag and drop
                </div>
                <p className="text-xs text-[var(--dim)]">
                  PNG, JPG, JPEG, WebP up to 10MB
                </p>
              </div>
            )}
          </label>
        </div>
        
        {/* Optional Prompt Input */}
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-[var(--gray)] mb-1">
            Additional context (optional)
          </label>
          <textarea
            id="prompt"
            value={promptText}
            onChange={(e) => setPromptText(e.target.value)}
            placeholder="Add any specific instructions or context..."
            className="form-field"
            rows={3}
            disabled={isLoading}
          />
        </div>
        
        {/* Submit Button */}
        <button
          type="submit"
          disabled={!selectedFile || isLoading}
          className="btn btn-fill btn-lg w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              Processing...
            </>
          ) : (
            'Upload & Schedule'
          )}
        </button>
      </form>
    </div>
  );
}
