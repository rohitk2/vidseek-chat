import { Play, Clock, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import videoPlaceholder1 from '@/assets/video-placeholder-1.jpg';
import videoPlaceholder2 from '@/assets/video-placeholder-2.jpg';
import videoPlaceholder3 from '@/assets/video-placeholder-3.jpg';

interface VideoSegment {
  start: number;
  end: number;
  relevance_score: number;
  explanation: string;
  timestamp_display: string;
}

interface VideoChunksProps {
  searchQuery?: string;
  segments?: VideoSegment[];
}

export const VideoChunks = ({ searchQuery, segments }: VideoChunksProps) => {
  // Use segments from API or fallback to placeholder data
  const displayChunks = segments ? segments.map((segment, index) => ({
    id: (index + 1).toString(),
    timestamp: segment.timestamp_display,
    confidence: segment.relevance_score / 10, // Convert 0-10 scale to 0-1
    description: segment.explanation,
    thumbnail: [videoPlaceholder1, videoPlaceholder2, videoPlaceholder3][index % 3]
  })) : [
    {
      id: '1',
      timestamp: '02:34',
      confidence: 0.95,
      description: 'Person walking in urban environment with clear visibility',
      thumbnail: videoPlaceholder1
    },
    {
      id: '2', 
      timestamp: '07:42',
      confidence: 0.88,
      description: 'Multiple people interacting near modern building entrance',
      thumbnail: videoPlaceholder2
    },
    {
      id: '3',
      timestamp: '12:18',
      confidence: 0.92,
      description: 'Close-up view of person with geometric patterns in background',
      thumbnail: videoPlaceholder3
    }
  ];

  return (
    <div className="w-full max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold">
            {searchQuery ? `Results for "${searchQuery}"` : 'Video Analysis Results'}
          </h2>
          <div className="flex items-center text-sm text-muted-foreground">
            <Zap className="h-4 w-4 mr-1" />
            {segments ? segments.length : displayChunks.length} matches found
          </div>
        </div>
        <p className="text-muted-foreground">
          {segments ? 'Showing the most relevant video frames based on AI analysis' : 'Showing placeholder video segments'}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayChunks.map((chunk) => (
          <div key={chunk.id} className="group relative bg-card rounded-lg border border-border overflow-hidden hover:shadow-lg transition-all duration-300 hover:border-primary/50">
            {/* Thumbnail */}
            <div className="relative aspect-video bg-muted overflow-hidden">
              <img 
                src={chunk.thumbnail} 
                alt={`Video segment at ${chunk.timestamp}`}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              
              {/* Play overlay */}
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-smooth flex items-center justify-center">
                <Button
                  size="lg"
                  variant="premium"
                >
                  <Play className="h-6 w-6 mr-2 fill-current" />
                  Play Segment
                </Button>
              </div>
              
              {/* Timestamp */}
              <div className="absolute top-3 right-3 bg-black/80 text-white px-2 py-1 rounded-md text-sm font-mono flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                {chunk.timestamp}
              </div>
              
              {/* Confidence score */}
              <div className="absolute top-3 left-3">
                <div 
                  className={`
                    px-2 py-1 rounded-md text-xs font-semibold
                    ${chunk.confidence > 0.9 
                      ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                      : chunk.confidence > 0.8
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }
                  `}
                >
                  {Math.round(chunk.confidence * 100)}% match
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="p-4">
              <p className="text-sm text-muted-foreground leading-relaxed">
                {chunk.description}
              </p>
              
              <div className="flex items-center justify-between mt-4">
                <Button variant="outline" size="sm">
                  View Details
                </Button>
                <Button variant="outline" size="sm">
                  Add to Highlights
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};