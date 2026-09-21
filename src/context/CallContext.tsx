import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { CallSession, User } from '../types';
import { webrtcService } from '../services/webrtcService';

interface CallContextType {
  callSession: CallSession | null;
  localStream: MediaStream | null;
  screenStream: MediaStream | null;
  audioLevel: number;
  hasPermissionsError: string | null;
  startCall: (peer: User, type: 'audio' | 'video') => Promise<void>;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleScreenShare: () => Promise<void>;
}

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [callSession, setCallSession] = useState<CallSession | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [screenStream, setScreenStream] = useState<MediaStream | null>(null);
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [hasPermissionsError, setHasPermissionsError] = useState<string | null>(null);

  const durationTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Audio visualizer loop
  useEffect(() => {
    if (callSession?.status === 'connected') {
      audioIntervalRef.current = setInterval(() => {
        setAudioLevel(webrtcService.getAudioLevel());
      }, 100);
    } else {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      setAudioLevel(0);
    }
    return () => {
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    };
  }, [callSession?.status]);

  // Call duration counter
  useEffect(() => {
    if (callSession?.status === 'connected') {
      durationTimerRef.current = setInterval(() => {
        setCallSession(prev => (prev ? { ...prev, durationSeconds: prev.durationSeconds + 1 } : null));
      }, 1000);
    } else {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    }
    return () => {
      if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    };
  }, [callSession?.status]);

  const startCall = async (peer: User, type: 'audio' | 'video') => {
    setHasPermissionsError(null);

    const initialSession: CallSession = {
      id: `call_${Date.now()}`,
      peer,
      type,
      direction: 'outgoing',
      status: 'calling',
      durationSeconds: 0,
      isMuted: false,
      isVideoOff: type === 'audio',
      isScreenSharing: false,
    };

    setCallSession(initialSession);

    // Request actual camera / microphone devices
    const { stream, error } = await webrtcService.getLocalMedia(type === 'video', true);
    if (stream) {
      setLocalStream(stream);
    }
    if (error) {
      setHasPermissionsError(error);
    }

    // Auto-connect after 2 seconds to simulate remote party answering
    setTimeout(() => {
      setCallSession(prev => (prev ? { ...prev, status: 'connected' } : null));
    }, 2000);
  };

  const endCall = () => {
    webrtcService.stopAllTracks();
    setLocalStream(null);
    setScreenStream(null);
    setCallSession(null);
    setHasPermissionsError(null);
    if (durationTimerRef.current) clearInterval(durationTimerRef.current);
    if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
  };

  const toggleMute = () => {
    if (!callSession) return;
    const newMute = !callSession.isMuted;
    webrtcService.toggleAudio(!newMute);
    setCallSession({ ...callSession, isMuted: newMute });
  };

  const toggleVideo = () => {
    if (!callSession) return;
    const newVideoOff = !callSession.isVideoOff;
    webrtcService.toggleVideo(!newVideoOff);
    setCallSession({ ...callSession, isVideoOff: newVideoOff });
  };

  const toggleScreenShare = async () => {
    if (!callSession) return;
    if (callSession.isScreenSharing) {
      webrtcService.stopScreenShare();
      setScreenStream(null);
      setCallSession({ ...callSession, isScreenSharing: false });
    } else {
      const { stream, error } = await webrtcService.startScreenShare();
      if (stream) {
        setScreenStream(stream);
        setCallSession({ ...callSession, isScreenSharing: true });
        stream.getVideoTracks()[0].onended = () => {
          setScreenStream(null);
          setCallSession(prev => (prev ? { ...prev, isScreenSharing: false } : null));
        };
      } else if (error) {
        alert(`Screen share note: ${error}`);
      }
    }
  };

  return (
    <CallContext.Provider
      value={{
        callSession,
        localStream,
        screenStream,
        audioLevel,
        hasPermissionsError,
        startCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleScreenShare,
      }}
    >
      {children}
    </CallContext.Provider>
  );
};

export const useCall = () => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
