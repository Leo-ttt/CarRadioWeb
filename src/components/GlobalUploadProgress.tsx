import React from 'react';
import { useUpload } from '../contexts/UploadContext';

const GlobalUploadProgress: React.FC = () => {
  const { isUploading, uploadProgress, uploadInfo, showGlobalProgress } = useUpload();

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) {return '0 B';}
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // 格式化速度
  const formatSpeed = (bytesPerSecond: number): string => {
    return formatFileSize(bytesPerSecond) + '/s';
  };

  // 格式化时间
  const formatTime = (seconds: number): string => {
    if (!isFinite(seconds) || seconds <= 0) {return '--';}

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${secs}秒`;
    }
  };

  if (!isUploading || !showGlobalProgress) {
    return null;
  }

  return (
    <div className="global-upload-progress">
      <div className="upload-header">
        <h4>📤 文件上传中</h4>
        {uploadInfo && (
          <span className="file-name">{uploadInfo.fileName}</span>
        )}
      </div>

      <div className="progress-bar">
        <div
          className="progress-fill"
          style={{ width: `${uploadProgress}%` }}
        />
        <span className="progress-text">{uploadProgress.toFixed(1)}%</span>
      </div>

      {uploadInfo && (
        <div className="upload-stats">
          <div className="stat-item">
            <span className="label">已上传:</span>
            <span className="value">{formatFileSize(uploadInfo.uploadedBytes)}</span>
          </div>
          <div className="stat-item">
            <span className="label">总大小:</span>
            <span className="value">{formatFileSize(uploadInfo.totalBytes)}</span>
          </div>
          <div className="stat-item">
            <span className="label">速度:</span>
            <span className="value">{formatSpeed(uploadInfo.speed)}</span>
          </div>
          <div className="stat-item">
            <span className="label">剩余:</span>
            <span className="value">{formatTime(uploadInfo.remainingTime)}</span>
          </div>
        </div>
      )}

      <style>{`
        .global-upload-progress {
          position: fixed;
          top: 20px;
          right: 20px;
          width: 350px;
          padding: 16px;
          background: #374151;
          border-radius: 12px;
          border: 1px solid #4B5563;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
          z-index: 1000;
          backdrop-filter: blur(10px);
        }

        .global-upload-progress .upload-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }

        .global-upload-progress .upload-header h4 {
          margin: 0;
          color: #F3F4F6;
          font-size: 14px;
          font-weight: 600;
        }

        .global-upload-progress .file-name {
          color: #9CA3AF;
          font-size: 12px;
          max-width: 200px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .global-upload-progress .progress-bar {
          position: relative;
          width: 100%;
          height: 8px;
          background: #4b5563;
          border-radius: 4px;
          overflow: hidden;
          margin-bottom: 12px;
        }

        .global-upload-progress .progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #10B981, #059669);
          transition: width 0.3s ease;
        }

        .global-upload-progress .progress-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          color: #F3F4F6;
          font-size: 10px;
          font-weight: 600;
          text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
        }

        .global-upload-progress .upload-stats {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 8px;
        }

        .global-upload-progress .stat-item {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .global-upload-progress .stat-item .label {
          font-size: 10px;
          color: #9CA3AF;
          font-weight: 500;
        }

        .global-upload-progress .stat-item .value {
          font-size: 12px;
          color: #F3F4F6;
          font-weight: 600;
        }

        @media (max-width: 768px) {
          .global-upload-progress {
            top: 10px;
            right: 10px;
            left: 10px;
            width: auto;
          }
        }
      `}</style>
    </div>
  );
};

export default GlobalUploadProgress;
