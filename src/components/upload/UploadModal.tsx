import React, { useState, useRef } from 'react';
import { 
  X, 
  UploadCloud, 
  Image as ImageIcon, 
  Film, 
  Sparkles, 
  MapPin, 
  Music,
  ArrowLeft
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Post, Reel, Story } from '../../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePost: (data: { mediaUrl: string; caption: string; location?: string; type?: 'image' | 'video' }) => Post;
  onCreateReel: (data: { videoUrl: string; caption: string; audioTrack?: string }) => Reel;
  onAddStory: (mediaUrl: string, type?: 'image' | 'video') => Story;
}

type UploadType = 'post' | 'reel' | 'story';

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onCreatePost,
  onCreateReel,
  onAddStory,
}) => {
  const [uploadType, setUploadType] = useState<UploadType>('post');
  const [mediaUrl, setMediaUrl] = useState<string>('');
  const [isVideo, setIsVideo] = useState<boolean>(false);
  const [caption, setCaption] = useState<string>('');
  const [location, setLocation] = useState<string>('');
  const [audioTrack, setAudioTrack] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Preset sample media for instant 1-click testing
  const presets = [
    {
      title: 'Neon Cyberpunk (Photo)',
      url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1000&q=80',
      isVideo: false,
    },
    {
      title: 'Sunset Cliffs (Photo)',
      url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80',
      isVideo: false,
    },
    {
      title: 'Studio Portrait (Video Reel)',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-taking-photos-of-a-model-in-a-studio-41440-large.mp4',
      isVideo: true,
    },
    {
      title: 'City Lights (Video Reel)',
      url: 'https://assets.mixkit.co/videos/preview/mixkit-aerial-view-of-city-traffic-at-night-42407-large.mp4',
      isVideo: true,
    },
  ];

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isVid = file.type.startsWith('video');
    setIsVideo(isVid);
    if (isVid && uploadType === 'post') {
      setUploadType('reel');
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setMediaUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handlePublish = () => {
    if (!mediaUrl) return;
    setIsSubmitting(true);

    try {
      if (uploadType === 'post') {
        onCreatePost({
          mediaUrl,
          caption: caption || '✨ Sharing a moment with the YANAR community.',
          location: location || undefined,
          type: isVideo ? 'video' : 'image',
        });
      } else if (uploadType === 'reel') {
        onCreateReel({
          videoUrl: mediaUrl,
          caption: caption || '🔥 New reel drop! Check this out.',
          audioTrack: audioTrack || 'Original Audio',
        });
      } else if (uploadType === 'story') {
        onAddStory(mediaUrl, isVideo ? 'video' : 'image');
      }

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
        colors: ['#f59e0b', '#ec4899', '#8b5cf6'],
      });

      onClose();
      // Reset form
      setMediaUrl('');
      setCaption('');
      setLocation('');
      setAudioTrack('');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in select-none">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          {mediaUrl ? (
            <button
              onClick={() => setMediaUrl('')}
              className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200"
            >
              <ArrowLeft className="w-4 h-4" /> Change Media
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-rose-500" />
              <h3 className="text-base font-bold text-zinc-900 dark:text-white">
                Create New Content
              </h3>
            </div>
          )}

          <div className="flex items-center gap-3">
            {mediaUrl && (
              <button
                onClick={handlePublish}
                disabled={isSubmitting}
                className="px-4 py-1.5 rounded-full bg-yanar-gradient text-white text-xs font-bold shadow-md hover:opacity-95 active:scale-95 transition-all cursor-pointer"
              >
                {isSubmitting ? 'Sharing...' : 'Share Now'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Format Tabs: Post vs Reel vs Story */}
          <div className="flex rounded-xl bg-zinc-100 dark:bg-zinc-800/80 p-1">
            <button
              onClick={() => setUploadType('post')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                uploadType === 'post'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 inline mr-1.5" />
              Feed Post
            </button>

            <button
              onClick={() => {
                setUploadType('reel');
                setIsVideo(true);
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                uploadType === 'reel'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Film className="w-3.5 h-3.5 inline mr-1.5" />
              Reel (Short Video)
            </button>

            <button
              onClick={() => setUploadType('story')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                uploadType === 'story'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 inline mr-1.5" />
              Story
            </button>
          </div>

          {!mediaUrl ? (
            /* Upload Drop Area */
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-rose-500 rounded-3xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-colors bg-zinc-50 dark:bg-zinc-800/30"
              >
                <div className="w-16 h-16 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mb-3">
                  <UploadCloud className="w-8 h-8" />
                </div>
                <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">
                  Select Photos or Videos from Device
                </h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
                  Drag and drop files here, or click to browse. Supports JPG, PNG, WEBP, MP4, and MOV.
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,video/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </div>

              {/* Instant Preset Assets for quick demo */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Or pick a demo media asset to test instantly:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {presets.map((preset, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setMediaUrl(preset.url);
                        setIsVideo(preset.isVideo);
                        if (preset.isVideo && uploadType === 'post') {
                          setUploadType('reel');
                        }
                      }}
                      className="group relative h-24 rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-700 cursor-pointer"
                    >
                      {preset.isVideo ? (
                        <video src={preset.url} className="w-full h-full object-cover" />
                      ) : (
                        <img src={preset.url} alt={preset.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent flex items-end p-2">
                        <span className="text-[10px] font-semibold text-white truncate">
                          {preset.title}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Media Preview & Caption Details Form */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Media Preview */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black flex items-center justify-center border border-zinc-200 dark:border-zinc-800">
                {isVideo ? (
                  <video
                    src={mediaUrl}
                    controls
                    autoPlay
                    loop
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                )}
              </div>

              {/* Metadata Inputs */}
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                    Caption
                  </label>
                  <textarea
                    rows={4}
                    placeholder="Write a caption... Add #hashtags and @mentions"
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500 resize-none"
                  />
                </div>

                {uploadType === 'post' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Location
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Add location (e.g. Tokyo, Shibuya)"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                )}

                {uploadType === 'reel' && (
                  <div>
                    <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-400 mb-1.5">
                      Audio Track Name
                    </label>
                    <div className="relative">
                      <Music className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                      <input
                        type="text"
                        placeholder="Track title (e.g. City Vibes • Original Audio)"
                        value={audioTrack}
                        onChange={(e) => setAudioTrack(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-rose-500"
                      />
                    </div>
                  </div>
                )}

                <div className="p-3 bg-zinc-50 dark:bg-zinc-800/40 rounded-xl border border-zinc-200 dark:border-zinc-700/60 text-[11px] text-zinc-500 space-y-1">
                  <p>• Ready for Supabase Storage free-tier bucket</p>
                  <p>• Auto-compresses for smooth web delivery</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
