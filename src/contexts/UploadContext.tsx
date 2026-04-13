import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface UploadInfo {
  fileName: string;
  uploadedBytes: number;
  totalBytes: number;
  speed: number;
  remainingTime: number; // 剩余时间（秒）
}

interface UploadContextType {
  isUploading: boolean;
  uploadProgress: number;
  uploadInfo: UploadInfo | null;
  showGlobalProgress: boolean;
  setIsUploading: (uploading: boolean) => void;
  setUploadProgress: (progress: number) => void;
  setUploadInfo: (info: UploadInfo | null) => void;
  setShowGlobalProgress: (show: boolean) => void;
  resetUpload: () => void;
}

const UploadContext = createContext<UploadContextType | undefined>(undefined);

export const useUpload = () => {
  const context = useContext(UploadContext);
  if (context === undefined) {
    throw new Error('useUpload must be used within an UploadProvider');
  }
  return context;
};

interface UploadProviderProps {
  children: ReactNode;
}

export const UploadProvider: React.FC<UploadProviderProps> = ({ children }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadInfo, setUploadInfo] = useState<UploadInfo | null>(null);
  const [showGlobalProgress, setShowGlobalProgress] = useState(true);

  const resetUpload = () => {
    setIsUploading(false);
    setUploadProgress(0);
    setUploadInfo(null);
  };

  const value: UploadContextType = {
    isUploading,
    uploadProgress,
    uploadInfo,
    showGlobalProgress,
    setIsUploading,
    setUploadProgress,
    setUploadInfo,
    setShowGlobalProgress,
    resetUpload,
  };

  return (
    <UploadContext.Provider value={value}>
      {children}
    </UploadContext.Provider>
  );
};
