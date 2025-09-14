import React, { useState, useRef, useEffect } from 'react';
import { 
  PlayIcon, 
  PauseIcon, 
  SpeakerWaveIcon,
  DocumentArrowDownIcon
} from '@heroicons/react/24/outline';

const VoicePlayer = ({ voiceRecording, userName, timestamp }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const audioRef = useRef(null);

  // Debug log
  console.log('🎤 VoicePlayer rendered with:', { voiceRecording, userName, timestamp });

  // Ses dosyası URL'si
  const audioUrl = voiceRecording && voiceRecording.filename ? 
    `http://91.98.135.16:5000/uploads/voice-recordings/${voiceRecording.filename}` :
    null;
    
  console.log('🎤 Audio URL:', audioUrl);

  // Audio element'ini yükle
  useEffect(() => {
    if (audioRef.current && audioUrl) {
      console.log('🎤 Loading audio with URL:', audioUrl);
      
      // Audio element'ini sıfırla
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      
      // Yeni src set et
      audioRef.current.src = audioUrl;
      
      // Load event'lerini dinle
      const handleLoadStart = () => console.log('🎤 Audio load started');
      const handleCanPlay = () => console.log('🎤 Audio can play');
      const handleError = (e) => console.error('🎤 Audio load error:', e);
      
      audioRef.current.addEventListener('loadstart', handleLoadStart);
      audioRef.current.addEventListener('canplay', handleCanPlay);
      audioRef.current.addEventListener('error', handleError);
      
      // Audio'yu yükle
      audioRef.current.load();
      
      // Cleanup
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadstart', handleLoadStart);
          audioRef.current.removeEventListener('canplay', handleCanPlay);
          audioRef.current.removeEventListener('error', handleError);
        }
      };
    }
  }, [audioUrl]);

  // Audio URL yoksa bileşeni render etme
  if (!audioUrl) {
    console.log('🎤 No audio URL, not rendering VoicePlayer');
    return null;
  }

  // Ses oynat/durdur
  const togglePlay = () => {
    console.log('🎤 Toggle play clicked, audioRef.current:', audioRef.current);
    console.log('🎤 Audio src:', audioRef.current?.src);
    console.log('🎤 Audio readyState:', audioRef.current?.readyState);
    
    if (audioRef.current) {
      if (isPlaying) {
        console.log('🎤 Pausing audio');
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        console.log('🎤 Playing audio');
        audioRef.current.play().then(() => {
          console.log('🎤 Audio play started successfully');
          setIsPlaying(true);
        }).catch((error) => {
          console.error('🎤 Audio play failed:', error);
        });
      }
    }
  };

  // Ses oynatma bittiğinde
  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  // Ses yüklendiğinde
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  // Ses oynatma sırasında
  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  // Zaman formatı
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  // Dosya boyutu formatı
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Ses dosyası indir
  const downloadAudio = () => {
    if (audioUrl) {
      const link = document.createElement('a');
      link.href = audioUrl;
      link.download = voiceRecording.originalName || 'voice-recording.webm';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (!voiceRecording || !audioUrl) {
    return null;
  }

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <SpeakerWaveIcon className="w-5 h-5 text-blue-600" />
          <span className="text-sm font-medium text-blue-800">
            🎤 Ses Kaydı
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {formatFileSize(voiceRecording.size)}
          </span>
          <button
            onClick={downloadAudio}
            className="text-gray-500 hover:text-gray-700 transition-colors"
            title="Ses dosyasını indir"
          >
            <DocumentArrowDownIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Ses Oynatıcı */}
      <div className="flex items-center space-x-3">
        <button
          onClick={togglePlay}
          className="flex items-center justify-center w-10 h-10 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? (
            <PauseIcon className="w-5 h-5" />
          ) : (
            <PlayIcon className="w-5 h-5 ml-0.5" />
          )}
        </button>

        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-1">
            <span className="text-xs text-gray-600">
              {formatTime(currentTime)}
            </span>
            <div className="flex-1 bg-gray-200 rounded-full h-1">
              <div 
                className="bg-blue-500 h-1 rounded-full transition-all duration-100"
                style={{ 
                  width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' 
                }}
              ></div>
            </div>
            <span className="text-xs text-gray-600">
              {formatTime(duration)}
            </span>
          </div>
          
          <div className="text-xs text-gray-500">
            {userName} tarafından kaydedildi • {new Date(timestamp).toLocaleString('tr-TR')}
          </div>
        </div>
      </div>

      {/* Gizli Audio Element */}
      <audio
        ref={audioRef}
        src={audioUrl}
        onEnded={handleEnded}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default VoicePlayer;
