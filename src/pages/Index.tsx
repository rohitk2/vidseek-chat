import { useState } from 'react';
import { VideoUpload } from '@/components/VideoUpload';
import { SearchBar } from '@/components/SearchBar';
import { VideoChunks } from '@/components/VideoChunks';
import { Chatbot } from '@/components/Chatbot';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isSearching, setIsSearching] = useState(false);

  const handleFileUpload = (file: File) => {
    setUploadedFile(file);
  };

  const handleSearch = async (query: string) => {
    setIsSearching(true);
    setSearchQuery(query);
    
    // Simulate search processing
    setTimeout(() => {
      setIsSearching(false);
    }, 2000);
  };

  const handleReset = () => {
    setUploadedFile(null);
    setSearchQuery('');
    setIsSearching(false);
  };

  // Upload state - show VideoUpload component
  if (!uploadedFile) {
    return <VideoUpload onUpload={handleFileUpload} />;
  }

  // Analysis state - show transformed interface
  return (
    <div className="min-h-screen gradient-card">
      {/* Header with back button */}
      <div className="sticky top-0 z-10 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReset}
                className="hover:bg-muted"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Upload New Video
              </Button>
              
              <div className="h-6 w-px bg-border"></div>
              
              <div>
                <h1 className="font-semibold text-foreground">
                  {uploadedFile.name}
                </h1>
                <p className="text-sm text-muted-foreground">
                  {(uploadedFile.size / (1024 * 1024)).toFixed(1)} MB • Ready for analysis
                </p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-muted-foreground">AI Analyzed</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-8 space-y-12">
        {/* Search Section */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Search Your Video</h2>
            <p className="text-muted-foreground">
              Use AI to find specific moments, objects, or scenes in your video
            </p>
          </div>
          
          <SearchBar onSearch={handleSearch} isLoading={isSearching} />
        </section>

        {/* Video Chunks Section */}
        <section>
          <VideoChunks searchQuery={searchQuery} />
        </section>

        {/* Chatbot Section */}
        <section>
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-2">Ask Questions</h2>
            <p className="text-muted-foreground">
              Chat with AI about your video content and get detailed insights
            </p>
          </div>
          
          <Chatbot videoFileName={uploadedFile.name} />
        </section>
      </div>

      {/* Footer */}
      <footer className="border-t border-border/50 mt-16">
        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-muted-foreground">
            Powered by advanced AI video analysis technology
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
