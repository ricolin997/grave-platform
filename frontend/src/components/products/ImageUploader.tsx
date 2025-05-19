'use client';

import { useState, useRef } from 'react';
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

      // 創建預覽 URL
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          const newImages = [...previewImages, e.target.result.toString()];
          setPreviewImages(newImages);
          onChange(newImages);
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

  // 拖放處理
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

  return (
    <div className="space-y-4">
      {/* 圖片預覽區域 */}
      {previewImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {previewImages.map((image, index) => (
            <div
              key={index}
              className="relative rounded-lg overflow-hidden border border-gray-200 h-32"
            >
              <Image
                src={image}
                alt={`Preview ${index + 1}`}
                fill
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => handleDelete(index)}
                className={`absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 ${
                  disabled ? 'hidden' : ''
                }`}
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
          ))}
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
            JPG, PNG, GIF格式 • 最大5MB • 最多{maxImages}張
          </p>
        </div>
      )}
    </div>
  );
} 