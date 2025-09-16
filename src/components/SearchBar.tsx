import { useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

interface SearchBarProps {
  onSearch: (query: string) => void;
  isLoading?: boolean;
}

export const SearchBar = ({ onSearch, isLoading = false }: SearchBarProps) => {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6">
      <form onSubmit={handleSubmit} className="relative">
        <div className="relative group">
          <div className="absolute inset-0 gradient-primary rounded-xl blur-sm opacity-20 group-hover:opacity-30 transition-smooth"></div>
          
          <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl shadow-card">
            <div className="flex items-center p-4">
              <Search className="h-5 w-5 text-muted-foreground mr-3" />
              
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for specific moments, objects, or actions in your video..."
                className="flex-1 border-0 bg-transparent text-lg placeholder:text-muted-foreground focus-visible:ring-0 focus-visible:ring-offset-0"
              />
              
              <Button
                type="submit"
                disabled={isLoading || !query.trim()}
                variant="premium"
                className="ml-3 transition-smooth"
              >
                {isLoading ? (
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/20 border-t-white" />
                ) : (
                  <Sparkles className="h-5 w-5" />
                )}
                <span className="ml-2">Analyze</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Search suggestions */}
        <div className="mt-4 flex flex-wrap gap-2 justify-center">
          {[
            'people walking',
            'red objects',
            'outdoor scenes',
            'text and signs',
            'vehicles'
          ].map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => setQuery(suggestion)}
              className="px-3 py-1 text-sm rounded-full bg-muted/50 hover:bg-muted text-muted-foreground hover:text-foreground transition-smooth"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </form>
    </div>
  );
};