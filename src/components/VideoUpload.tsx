import { useState, useCallback } from 'react';
import { Upload, FileVideo, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VideoUploadProps {
  onUpload: (file: File) => void;
  isUploading?: boolean;
  uploadProgress?: number;
}

export const VideoUpload = ({ onUpload, isUploading = false, uploadProgress = 0 }: VideoUploadProps) => {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    const videoFile = files.find(file => file.type.startsWith('video/'));
    
    if (videoFile) {
      onUpload(videoFile);
    }
  }, [onUpload]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      onUpload(file);
    }
  }, [onUpload]);

  return (
    <div className="flex min-h-screen items-center justify-center p-8 gradient-card">
      <div className="max-w-2xl w-full text-center space-y-8">
        {/* Hero Section */}
        <div className="space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <Sparkles className="h-16 w-16 text-primary animate-pulse-slow" />
              <div className="absolute inset-0 animate-glow rounded-full"></div>
            </div>
          </div>
          
          <div className="space-y-4">
            <h1 className="text-5xl font-bold gradient-primary bg-clip-text text-transparent">
              AI Video Analysis
            </h1>
            <p className="text-xl text-muted-foreground">
              Upload your video and unlock intelligent insights with AI-powered analysis
            </p>
          </div>
        </div>

        {/* Upload Area */}
        <div
          className={`
            relative border-2 border-dashed rounded-2xl p-12 transition-smooth cursor-pointer
            shadow-card hover:shadow-elevated
            ${isDragOver 
              ? 'border-primary bg-primary/5 shadow-glow' 
              : 'border-border hover:border-primary/50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            accept="video/*"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            disabled={isUploading}
          />
          
          <div className="space-y-6">
            <div className="flex justify-center">
              <div className={`
                p-6 rounded-full transition-smooth
                ${isDragOver ? 'bg-primary/10' : 'bg-muted/50'}
              `}>
                {isDragOver ? (
                  <FileVideo className="h-12 w-12 text-primary animate-bounce" />
                ) : (
                  <Upload className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="text-2xl font-semibold">
                {isUploading ? 'Uploading...' : isDragOver ? 'Drop your video here' : 'Choose your video file'}
              </h3>
              <p className="text-muted-foreground">
                {isUploading ? 'Please wait while your video is being uploaded' : 'Drag and drop your MP4 file here, or click to browse'}
              </p>
            </div>
            
            <Button 
              variant="outline" 
              size="lg"
              className="transition-bounce hover:shadow-glow"
              disabled={isUploading}
            >
              <Upload className="mr-2 h-5 w-5" />
              {isUploading ? 'Uploading...' : 'Select Video File'}
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        {isUploading && (
          <div className="mt-4 w-full">
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
          {[
            { icon: '🔍', title: 'Smart Search', desc: 'Find specific moments instantly' },
            { icon: '🎯', title: 'Frame Analysis', desc: 'AI-powered visual insights' },
            { icon: '💬', title: 'Interactive Chat', desc: 'Ask questions about your video' }
          ].map((feature, i) => (
            <div key={i} className="p-6 rounded-xl gradient-surface border border-border/50">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h4 className="font-semibold mb-2">{feature.title}</h4>
              <p className="text-sm text-muted-foreground">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};