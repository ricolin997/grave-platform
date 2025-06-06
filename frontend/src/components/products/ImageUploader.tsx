'use client';

import { useState, useRef, useCallback } from 'react';
import Image from 'next/image';

interface ImageUploaderProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  disabled?: boolean;
}

export default function ImageUploader({
  images = [],
  onChange,
  maxImages = 5,
  disabled = false,
}: ImageUploaderProps) {
  const [previewImages, setPreviewImages] = useState<string[]>(images);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [uploading, setUploading] = useState<{[key: string]: number}>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 處理文件選擇
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    handleFiles(Array.from(files));
  };

  // 處理文件
  const handleFiles = (files: File[]) => {
    // 檢查是否超過最大圖片數量
    if (previewImages.length + files.length > maxImages) {
      alert(`最多只能上傳 ${maxImages} 張圖片`);
      files = files.slice(0, maxImages - previewImages.length);
    }

    // 處理所選文件
    files.forEach((file) => {
      // 檢查文件類型
      if (!file.type.startsWith('image/')) {
        alert('請只上傳圖片文件');
        return;
      }

      // 檢查文件大小
      if (file.size > 5 * 1024 * 1024) {
        alert('圖片大小不能超過 5MB');
        return;
      }

      const fileId = `${file.name}-${Date.now()}`;
      setUploading(prev => ({ ...prev, [fileId]: 0 }));

      // 創建預覽 URL
      const reader = new FileReader();
      
      // 模擬上傳進度
      const interval = setInterval(() => {
        setUploading(prev => {
          const progress = (prev[fileId] || 0) + 10;
          if (progress >= 100) {
            clearInterval(interval);
            return { ...prev, [fileId]: 100 };
          }
          return { ...prev, [fileId]: progress };
        });
      }, 100);

      reader.onload = (event: ProgressEvent<FileReader>) => {
        const target = event.target;
        if (target && target.result && typeof target.result === 'string') {
          setTimeout(() => {
            setUploading(prev => {
              const newUploading = { ...prev };
              delete newUploading[fileId];
              return newUploading;
            });

            const newImages = [...previewImages, target.result];
            setPreviewImages(newImages);
            onChange(newImages);
          }, 1000); // 模擬完成時間
        }
      };
      reader.readAsDataURL(file);
    });
  };

  // 刪除圖片
  const handleDelete = (index: number) => {
    if (disabled) return;
    const newImages = [...previewImages];
    newImages.splice(index, 1);
    setPreviewImages(newImages);
    onChange(newImages);
  };

  // 觸發文件選擇對話框
  const handleClick = () => {
    if (disabled) return;
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // 拖放處理 - 上傳區域
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.preventDefault();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(Array.from(files));
    }
  };

  // 拖拽排序處理
  const handleImageDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (disabled) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    // 使拖拽圖標更加透明
    e.currentTarget.style.opacity = '0.4';
  };

  const handleImageDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    if (disabled) return;
    e.currentTarget.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleImageDragOver = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (disabled) return;
    e.preventDefault();
    if (draggedIndex === index) return;
    setDragOverIndex(index);
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    if (disabled || draggedIndex === null || draggedIndex === index) return;
    e.preventDefault();
    
    // 重新排序圖片
    const newImages = [...previewImages];
    const [draggedImage] = newImages.splice(draggedIndex, 1);
    newImages.splice(index, 0, draggedImage);
    
    setPreviewImages(newImages);
    onChange(newImages);
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  // 設置為主圖（第一張）
  const setAsMain = useCallback((index: number) => {
    if (disabled || index === 0) return;
    
    const newImages = [...previewImages];
    const [image] = newImages.splice(index, 1);
    newImages.unshift(image);
    
    setPreviewImages(newImages);
    onChange(newImages);
  }, [previewImages, onChange, disabled]);

  return (
    <div className="space-y-4">
      {/* 圖片預覽區域 */}
      {previewImages.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {previewImages.map((image, index) => (
              <div
                key={index}
                draggable={!disabled}
                onDragStart={(e) => handleImageDragStart(e, index)}
                onDragEnd={handleImageDragEnd}
                onDragOver={(e) => handleImageDragOver(e, index)}
                onDrop={(e) => handleImageDrop(e, index)}
                className={`relative rounded-lg overflow-hidden border ${
                  dragOverIndex === index 
                    ? 'border-indigo-500 border-2' 
                    : index === 0 
                      ? 'border-indigo-300 border-2'
                      : 'border-gray-200'
                } h-32 transition-all cursor-move`}
              >
                <Image
                  src={image}
                  alt={`Preview ${index + 1}`}
                  fill
                  className="object-cover"
                />
                {index === 0 && (
                  <div className="absolute top-0 left-0 bg-indigo-500 text-white text-xs px-2 py-1">
                    主圖
                  </div>
                )}
                <div className={`absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black bg-opacity-50 transition-opacity ${
                  disabled ? 'hidden' : ''
                }`}>
                  {index !== 0 && (
                    <button
                      type="button"
                      onClick={() => setAsMain(index)}
                      title="設為主圖"
                      className="bg-indigo-500 text-white rounded-full p-1 mr-2 hover:bg-indigo-600"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(index)}
                    title="刪除圖片"
                    className="bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-4 w-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500">
            {previewImages.length > 1 ? '拖拽圖片可調整順序，第一張為主圖' : ''}
          </p>
        </>
      )}

      {/* 上傳進度顯示 */}
      {Object.keys(uploading).length > 0 && (
        <div className="space-y-2 mb-4">
          {Object.entries(uploading).map(([id, progress]) => (
            <div key={id} className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
              <div className="bg-indigo-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
          ))}
          <p className="text-sm text-gray-500">上傳中，請稍候...</p>
        </div>
      )}

      {/* 上傳區域 */}
      {previewImages.length < maxImages && !disabled && (
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'
          }`}
          onClick={handleClick}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleFileChange}
          />
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2 text-sm text-gray-600">
            點擊或拖拽圖片到此區域上傳
          </p>
          <p className="mt-1 text-xs text-gray-500">
            JPG, PNG, GIF格式 • 最大5MB • 已上傳 {previewImages.length}/{maxImages} 張
          </p>
        </div>
      )}
    </div>
  );
} 