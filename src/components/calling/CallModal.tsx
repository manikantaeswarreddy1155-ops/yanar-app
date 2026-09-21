import React, { useEffect, useRef } from 'react';
import { 
  PhoneOff, 
  Mic, 
  MicOff, 
  Video, 
  VideoOff, 
  Monitor, 
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { useCall } from '../../context/CallContext';
import { Avatar } from '../common/Avatar';

export const CallModal: React.FC = () => {
  const { 
    callSession, 
    localStream, 
    screenStream,
    audioLevel,
    hasPermissionsError, 
    endCall, 
    toggleMute, 
    toggleVideo, 
    toggleScreenShare 
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenVideoRef = useRef<HTMLVideoElement>(null);

  // Attach local stream to video element
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  // Attach screen stream to video element
  useEffect(() => {
    if (screenVideoRef.current && screenStream) {
      screenVideoRef.current.srcObject = screenStream;
    }
  }, [screenStream]);

  if (!callSession) return null;

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isVideo = callSession.type === 'video';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-4 bg-black/90 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full h-full md:max-w-4xl md:h-[88vh] bg-zinc-950 md:rounded-3xl border border-zinc-800 overflow-hidden shadow-2xl flex flex-col justify-between">
        {/* Top Floating Bar */}
        <div className="absolute top-0 left-0 right-0 z-30 p-4 md:p-6 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <Avatar src={callSession.peer.avatar} alt={callSession.peer.name} size="md" />
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-base md:text-lg font-bold">
                  {callSession.peer.name}
                </h2>
                {callSession.peer.isVerified && (
                  <Sparkles className="w-4 h-4 text-amber-400 fill-amber-400" />
                )}
              </div>
              <p className="text-xs text-white/70">
                {callSession.status === 'calling'
                  ? 'Calling...'
                  : `${isVideo ? 'WebRTC Video' : 'WebRTC Audio'} • ${formatDuration(callSession.durationSeconds)}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block px-3 py-1 text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-full">
              P2P Encrypted
            </span>
          </div>
        </div>

        {/* Permission Warning Banner */}
        {hasPermissionsError && (
          <div className="absolute top-20 left-4 right-4 z-30 p-3 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-200 text-xs flex items-center gap-2 backdrop-blur-md">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Note: {hasPermissionsError}. Running in simulated peer preview mode.</span>
          </div>
        )}

        {/* Main Calling Stage */}
        <div className="relative w-full h-full flex items-center justify-center bg-zinc-900 overflow-hidden">
          {/* Screen share stream if active */}
          {callSession.isScreenSharing && screenStream ? (
            <video
              ref={screenVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain bg-black"
            />
          ) : isVideo && !callSession.isVideoOff ? (
            /* Remote Video / Simulated Partner View */
            <div className="relative w-full h-full flex items-center justify-center bg-black">
              {/* Simulated high quality interactive partner video stream */}
              <img
                src={callSession.peer.avatar}
                alt={callSession.peer.name}
                className="w-full h-full object-cover filter brightness-75 blur-xs scale-105"
              />

              {/* Centered caller presence badge */}
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40">
                <div className={`relative rounded-full p-2 ${audioLevel > 15 ? 'animate-ring-pulse' : ''}`}>
                  <Avatar src={callSession.peer.avatar} alt={callSession.peer.name} size="2xl" />
                </div>
                <h3 className="text-xl font-bold text-white mt-4">{callSession.peer.name}</h3>
                <p className="text-xs text-white/70 mt-1">Connected via WebRTC MediaStream</p>
              </div>
            </div>
          ) : (
            /* Audio Call / Video Muted Avatar Stage */
            <div className="flex flex-col items-center justify-center text-center p-6">
              <div className={`relative p-4 rounded-full ${audioLevel > 15 ? 'animate-ring-pulse' : ''}`}>
                <Avatar src={callSession.peer.avatar} alt={callSession.peer.name} size="2xl" />
              </div>
              <h3 className="text-2xl font-bold text-white mt-4">{callSession.peer.name}</h3>
              <p className="text-sm text-zinc-400 mt-1">
                {callSession.status === 'calling' ? 'Ringing...' : 'In Call'}
              </p>

              {/* Audio visualizer dots */}
              <div className="flex items-center gap-1.5 mt-6">
                {[...Array(9)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-rose-500 rounded-full transition-all duration-100"
                    style={{
                      height: `${Math.max(6, Math.sin((i + audioLevel / 10) * 1.5) * 24 + 10)}px`,
                      opacity: audioLevel > 5 ? 1 : 0.3,
                    }}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Picture-in-Picture (PiP) Local Camera Tile */}
          {isVideo && localStream && (
            <div className="absolute bottom-24 right-4 md:bottom-28 md:right-6 w-32 h-44 md:w-44 md:h-60 rounded-2xl overflow-hidden border-2 border-white/20 bg-zinc-800 shadow-2xl z-20 transition-all hover:scale-105">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover mirror scale-x-[-1]"
              />
              <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 text-[10px] font-semibold text-white backdrop-blur-xs">
                You
              </div>
            </div>
          )}
        </div>

        {/* Bottom Floating Control Dock */}
        <div className="absolute bottom-0 left-0 right-0 z-30 p-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-4 md:gap-6">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${
              callSession.isMuted
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                : 'bg-zinc-800/80 text-white hover:bg-zinc-700 border border-zinc-700/60'
            }`}
            title={callSession.isMuted ? 'Unmute Microphone' : 'Mute Microphone'}
          >
            {callSession.isMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          {/* Toggle Video Camera */}
          {isVideo && (
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all ${
                callSession.isVideoOff
                  ? 'bg-rose-500/20 text-rose-500 border border-rose-500/40'
                  : 'bg-zinc-800/80 text-white hover:bg-zinc-700 border border-zinc-700/60'
              }`}
              title={callSession.isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {callSession.isVideoOff ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>
          )}

          {/* Screen Share */}
          <button
            onClick={toggleScreenShare}
            className={`p-4 rounded-full transition-all ${
              callSession.isScreenSharing
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'bg-zinc-800/80 text-white hover:bg-zinc-700 border border-zinc-700/60'
            }`}
            title={callSession.isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-6 h-6" />
          </button>

          {/* End Call Button */}
          <button
            onClick={endCall}
            className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg shadow-rose-600/40 active:scale-95 transition-all"
            title="End Call"
          >
            <PhoneOff className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};
