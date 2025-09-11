import React, { useState, useRef, useEffect } from 'react';
import { 
  MicrophoneIcon, 
  StopIcon, 
  PlayIcon, 
  PauseIcon,
  TrashIcon,
  SpeakerWaveIcon
} from '@heroicons/react/24/outline';

const VoiceRecorder = ({ onRecordingComplete, onRecordingDelete, initialAudioUrl = null }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioUrl, setAudioUrl] = useState(initialAudioUrl);
  const [hasRecording, setHasRecording] = useState(!!initialAudioUrl);
  
  const mediaRecorderRef = useRef(null);
  const audioRef = useRef(null);
  const timerRef = useRef(null);
  const chunksRef = useRef([]);

  // Temizlik
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      if (audioUrl && audioUrl.startsWith('blob:')) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Kayıt başlat
  const startRecording = async () => {
    try {
      console.log('🎤 Mikrofon erişimi isteniyor...');
      console.log('🎤 navigator.mediaDevices:', navigator.mediaDevices);
      console.log('🎤 navigator.getUserMedia:', navigator.getUserMedia);
      console.log('🎤 window.location.protocol:', window.location.protocol);
      
      // Mikrofon erişimi kontrolü - hem yeni hem eski API'yi kontrol et
      let getUserMedia;
      
      if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
        // Modern API
        getUserMedia = navigator.mediaDevices.getUserMedia.bind(navigator.mediaDevices);
        console.log('🎤 Modern MediaDevices API kullanılıyor');
      } else if (navigator.getUserMedia) {
        // Eski API (Promise wrapper ile)
        getUserMedia = (constraints) => {
          return new Promise((resolve, reject) => {
            navigator.getUserMedia(constraints, resolve, reject);
          });
        };
        console.log('🎤 Eski getUserMedia API kullanılıyor');
      } else {
        throw new Error('Bu tarayıcı mikrofon erişimini desteklemiyor. HTTPS gerekiyor olabilir.');
      }
      
      const stream = await getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        }
      });
      
      console.log('🎤 Mikrofon erişimi başarılı:', stream);
      console.log('🎤 Stream tracks:', stream.getTracks());
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);
        setHasRecording(true);
        onRecordingComplete(blob);
        
        // Stream'i kapat
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Timer başlat
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('🎤 Mikrofon erişim hatası:', error);
      console.error('🎤 Hata detayı:', {
        name: error.name,
        message: error.message,
        constraint: error.constraint
      });
      
      let errorMessage = 'Mikrofon erişimi için izin verilmedi. ';
      
      if (error.name === 'NotAllowedError') {
        errorMessage += 'Lütfen tarayıcı ayarlarından mikrofon iznini etkinleştirin.';
      } else if (error.name === 'NotFoundError') {
        errorMessage += 'Mikrofon bulunamadı. Lütfen mikrofonunuzun bağlı olduğundan emin olun.';
      } else if (error.name === 'NotSupportedError') {
        errorMessage += 'Bu tarayıcı mikrofon erişimini desteklemiyor.';
      } else if (error.message.includes('HTTPS')) {
        errorMessage += 'HTTPS bağlantısı gerekiyor. Lütfen https://localhost:3000 adresini kullanın.';
      } else {
        errorMessage += `Hata: ${error.message}`;
      }
      
      alert(errorMessage);
    }
  };

  // Kayıt durdur
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
  };

  // Kayıt sil
  const deleteRecording = () => {
    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }
    setAudioUrl(null);
    setHasRecording(false);
    setRecordingTime(0);
    onRecordingDelete();
  };

  // Ses oynat
  const playAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  // Ses oynatma bittiğinde
  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  // Zaman formatı
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4">
      {/* Ses Kaydı Kontrolleri */}
      <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border">
        <div className="flex items-center space-x-4">
          {!hasRecording ? (
            <>
              <button
                onClick={isRecording ? stopRecording : startRecording}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  isRecording 
                    ? 'bg-red-500 text-white hover:bg-red-600' 
                    : 'bg-blue-500 text-white hover:bg-blue-600'
                }`}
              >
                {isRecording ? (
                  <>
                    <StopIcon className="w-5 h-5" />
                    <span>Kaydı Durdur</span>
                  </>
                ) : (
                  <>
                    <MicrophoneIcon className="w-5 h-5" />
                    <span>Kayıt Başlat</span>
                  </>
                )}
              </button>
              
              {isRecording && (
                <div className="flex items-center space-x-2 text-red-600">
                  <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="font-mono text-sm">{formatTime(recordingTime)}</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex items-center space-x-3">
              <button
                onClick={playAudio}
                className="flex items-center space-x-2 px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="w-4 h-4" />
                    <span>Duraklat</span>
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-4 h-4" />
                    <span>Oynat</span>
                  </>
                )}
              </button>
              
              <button
                onClick={deleteRecording}
                className="flex items-center space-x-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
              >
                <TrashIcon className="w-4 h-4" />
                <span>Sil</span>
              </button>
              
              <div className="flex items-center space-x-2 text-gray-600">
                <SpeakerWaveIcon className="w-4 h-4" />
                <span className="text-sm">Ses kaydı mevcut</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Ses Oynatıcı */}
      {hasRecording && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={handleAudioEnded}
          className="hidden"
        />
      )}

      {/* Kayıt Durumu */}
      {isRecording && (
        <div className="text-center text-sm text-gray-600">
          <p>🎤 Ses kaydı yapılıyor... Konuşmaya başlayabilirsiniz.</p>
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;
