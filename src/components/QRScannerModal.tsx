import React, { useState, useEffect, useRef } from 'react';
import jsQR from 'jsqr';
import { 
  Camera, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  UserCheck, 
  Boxes, 
  Sparkles, 
  QrCode, 
  RefreshCw, 
  FlipHorizontal,
  Volume2,
  VolumeX,
  History,
  ArrowRight
} from 'lucide-react';
import { HealthFacility } from '../types';

interface ScannedRecord {
  id: string;
  timestamp: string;
  type: 'PATIENT' | 'MEDICINE';
  title: string;
  detail: string;
  actionTaken: string;
}

interface QRScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  facility: HealthFacility;
  onPatientScanned: (patient: { name: string; abhaId: string; triageType: 'opd' | 'emergency'; age?: number; gender?: string }) => void;
  onMedicineScanned: (medicine: { batchNo: string; name: string; quantity: number; actionType: 'RECEIVE' | 'DISPENSE' }) => void;
}

export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  isOpen,
  onClose,
  facility,
  onPatientScanned,
  onMedicineScanned,
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scanMode, setScanMode] = useState<'ALL' | 'PATIENT' | 'MEDICINE'>('ALL');
  const [lastScannedResult, setLastScannedResult] = useState<{
    type: 'PATIENT' | 'MEDICINE' | 'RAW';
    title: string;
    description: string;
    payload: any;
  } | null>(null);

  const [scanHistory, setScanHistory] = useState<ScannedRecord[]>([
    {
      id: 'sc-1',
      timestamp: '09:42 AM',
      type: 'PATIENT',
      title: 'Sunita Devi (ABHA: 91-8840-2190)',
      detail: 'Maternal OPD Triage • Age 28',
      actionTaken: '+1 OPD Patient Walk-in Logged',
    },
    {
      id: 'sc-2',
      timestamp: '09:30 AM',
      type: 'MEDICINE',
      title: 'Amoxicillin 500mg (Batch AMX-2024-88)',
      detail: 'Reconstituted shipment from CMS Depot',
      actionTaken: '+100 Capsules Added to In-Stock',
    },
  ]);

  // Audio beep generator using Web Audio API
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // 880 Hz high beep
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.18);
    } catch (e) {
      // AudioContext may be restricted before user gesture
    }
  };

  // Start Camera Stream
  useEffect(() => {
    if (!isOpen) return;
    let stream: MediaStream | null = null;

    const startCamera = async () => {
      setCameraError(null);
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setCameraError('Camera API not accessible in this environment. Use the sample simulation triggers below.');
          return;
        }

        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode,
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.setAttribute('playsinline', 'true');
          await videoRef.current.play();
          setCameraActive(true);
        }
      } catch (err: any) {
        console.warn('Camera access issue:', err);
        setCameraError(
          err.name === 'NotAllowedError' 
            ? 'Camera permission denied by user. Please allow camera access in browser permissions or use sample QR triggers below.'
            : 'Device camera unavailable or in use by another application.'
        );
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
      if (stream) {
        stream.getTracks().forEach(t => t.stop());
      }
      if (videoRef.current && videoRef.current.srcObject) {
        const currentStream = videoRef.current.srcObject as MediaStream;
        currentStream.getTracks().forEach(t => t.stop());
        videoRef.current.srcObject = null;
      }
      setCameraActive(false);
    };
  }, [isOpen, facingMode]);

  // QR Scanning Loop using jsQR
  useEffect(() => {
    if (!cameraActive) return;

    let isScanning = true;
    let lastScanTime = 0;

    const scanFrame = () => {
      if (!isScanning) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;

      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });

        if (ctx) {
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          const now = Date.now();
          if (code && code.data && now - lastScanTime > 2500) {
            lastScanTime = now;
            handleScannedData(code.data);
          }
        }
      }

      animFrameIdRef.current = requestAnimationFrame(scanFrame);
    };

    animFrameIdRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [cameraActive, scanMode]);

  // Parse and process scanned QR code data
  const handleScannedData = (rawText: string) => {
    playBeep();
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      // Try JSON format first
      let parsed: any = null;
      if (rawText.trim().startsWith('{') && rawText.trim().endsWith('}')) {
        parsed = JSON.parse(rawText);
      }

      // Check if PATIENT / ABHA QR
      if (
        (parsed && (parsed.type === 'PATIENT' || parsed.abhaId)) ||
        rawText.toUpperCase().includes('ABHA') ||
        rawText.toUpperCase().includes('PATIENT')
      ) {
        const patientName = parsed?.name || extractField(rawText, 'name') || 'Anand Kumar';
        const abhaId = parsed?.abhaId || parsed?.id || extractField(rawText, 'abha') || 'ABHA-9821-4402';
        const triageType = (parsed?.triageCategory?.toLowerCase() === 'emergency' || rawText.toLowerCase().includes('emergency')) ? 'emergency' : 'opd';
        const age = parsed?.age || 38;
        const gender = parsed?.gender || 'M';

        onPatientScanned({ name: patientName, abhaId, triageType, age, gender });

        const resultInfo = {
          type: 'PATIENT' as const,
          title: `Touchless Patient Arrival: ${patientName}`,
          description: `Verified Health ID ${abhaId} (${gender}, ${age}y). Automatically checked into ${facility.name} ${triageType.toUpperCase()} queue.`,
          payload: { patientName, abhaId, triageType },
        };

        setLastScannedResult(resultInfo);

        setScanHistory(prev => [
          {
            id: `sc-${Date.now()}`,
            timestamp: timeStr,
            type: 'PATIENT',
            title: `${patientName} (${abhaId})`,
            detail: `${triageType.toUpperCase()} Queue Arrival Logged`,
            actionTaken: `+1 ${triageType.toUpperCase()} Patient Count Updated`,
          },
          ...prev.slice(0, 9),
        ]);
        return;
      }

      // Check if MEDICINE / BATCH QR
      if (
        (parsed && (parsed.type === 'MEDICINE' || parsed.batchNo)) ||
        rawText.toUpperCase().includes('BATCH') ||
        rawText.toUpperCase().includes('AMX') ||
        rawText.toUpperCase().includes('MED')
      ) {
        const batchNo = parsed?.batchNo || extractField(rawText, 'batch') || 'AMX-2024-88';
        const medName = parsed?.name || extractField(rawText, 'medicine') || 'Amoxicillin 500mg Caps';
        const qty = parsed?.quantity || 100;
        const actionType: 'RECEIVE' | 'DISPENSE' = parsed?.action === 'DISPENSE' ? 'DISPENSE' : 'RECEIVE';

        onMedicineScanned({ batchNo, name: medName, quantity: qty, actionType });

        const resultInfo = {
          type: 'MEDICINE' as const,
          title: `Batch Lot Verified: ${batchNo}`,
          description: `${medName} — Touchless receipt of +${qty} units logged at ${facility.name}. Days-of-supply recalibrated.`,
          payload: { batchNo, medName, qty },
        };

        setLastScannedResult(resultInfo);

        setScanHistory(prev => [
          {
            id: `sc-${Date.now()}`,
            timestamp: timeStr,
            type: 'MEDICINE',
            title: `${medName} (Lot ${batchNo})`,
            detail: `Incoming Shipment Verified from CMS`,
            actionTaken: `+${qty} Units Credited to Stock`,
          },
          ...prev.slice(0, 9),
        ]);
        return;
      }

      // Fallback: Generic Code
      const resultInfo = {
        type: 'RAW' as const,
        title: 'QR Code Decoded',
        description: `Raw Content: "${rawText.slice(0, 100)}"`,
        payload: { rawText },
      };
      setLastScannedResult(resultInfo);
    } catch (e) {
      console.error('QR parsing error:', e);
    }
  };

  const extractField = (text: string, key: string): string | null => {
    const match = text.match(new RegExp(`${key}[:=]\\s*([^,\\n]+)`, 'i'));
    return match ? match[1].trim() : null;
  };

  // Demo simulation triggers
  const handleSimulatePatientScan = (type: 'opd' | 'emergency') => {
    const names = ['Pooja Sharma', 'Devendra Singh', 'Rameshwar Yadav', 'Anita Devi', 'Mohammad Tariq'];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const mockQR = JSON.stringify({
      type: 'PATIENT',
      id: `ABHA-9${Math.floor(100 + Math.random() * 899)}-${Math.floor(1000 + Math.random() * 8999)}`,
      name: randomName,
      gender: Math.random() > 0.5 ? 'F' : 'M',
      age: Math.floor(22 + Math.random() * 45),
      triageCategory: type,
    });
    handleScannedData(mockQR);
  };

  const handleSimulateMedicineScan = () => {
    const meds = [
      { name: 'Amoxicillin 500mg Caps', batch: 'AMX-2024-88', qty: 150 },
      { name: 'Oral Rehydration Salts (ORS)', batch: 'ORS-24-912', qty: 200 },
      { name: 'Normal Saline (0.9% NaCl 500ml)', batch: 'NS-9021', qty: 40 },
      { name: 'Anti-Rabies Vaccine (ARV 0.5ml)', batch: 'ARV-2024-03', qty: 20 },
    ];
    const chosen = meds[Math.floor(Math.random() * meds.length)];
    const mockQR = JSON.stringify({
      type: 'MEDICINE',
      batchNo: chosen.batch,
      name: chosen.name,
      quantity: chosen.qty,
      action: 'RECEIVE',
      mfgDate: '2024-08-01',
      expiryDate: '2027-02-28',
    });
    handleScannedData(mockQR);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 text-slate-100 my-auto">
        {/* Modal Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
              <Camera className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Touchless QR Optical Scanner</span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              </h3>
              <p className="text-xs text-slate-400">
                {facility.name} • Patient Triage Registration & Drug Batch Tracking
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Audio Toggle */}
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              title={soundEnabled ? 'Mute Beep' : 'Enable Beep'}
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4 text-teal-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
            </button>

            {/* Camera Switch */}
            <button
              onClick={() => setFacingMode(prev => prev === 'environment' ? 'user' : 'environment')}
              title="Flip Camera (Front/Rear)"
              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition"
            >
              <FlipHorizontal className="w-4 h-4" />
            </button>

            <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Mode Selector Chips */}
        <div className="flex items-center justify-between gap-2 text-xs">
          <span className="text-slate-400 font-medium">Scanning Target:</span>
          <div className="flex items-center bg-slate-800/80 p-0.5 rounded-lg border border-slate-700">
            <button
              onClick={() => setScanMode('ALL')}
              className={`px-2.5 py-1 rounded-md transition font-semibold ${
                scanMode === 'ALL' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Auto-Detect
            </button>
            <button
              onClick={() => setScanMode('PATIENT')}
              className={`px-2.5 py-1 rounded-md transition font-semibold flex items-center gap-1 ${
                scanMode === 'PATIENT' ? 'bg-purple-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <UserCheck className="w-3 h-3" />
              Patient ABHA
            </button>
            <button
              onClick={() => setScanMode('MEDICINE')}
              className={`px-2.5 py-1 rounded-md transition font-semibold flex items-center gap-1 ${
                scanMode === 'MEDICINE' ? 'bg-teal-600 text-white font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Boxes className="w-3 h-3" />
              Drug Batch
            </button>
          </div>
        </div>

        {/* Video Viewport & Aiming Reticle */}
        <div className="relative bg-black rounded-2xl overflow-hidden aspect-video border border-slate-700 flex items-center justify-center shadow-inner">
          <video
            ref={videoRef}
            className="w-full h-full object-cover"
            muted
            playsInline
          />
          <canvas ref={canvasRef} className="hidden" />

          {/* Aiming Reticle Overlay */}
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            {/* Darkened vignette surround */}
            <div className="w-56 h-56 sm:w-64 sm:h-64 border-2 border-teal-400/80 rounded-2xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]">
              {/* Corner brackets */}
              <div className="absolute -top-1 -left-1 w-6 h-6 border-t-4 border-l-4 border-teal-400 rounded-tl-lg" />
              <div className="absolute -top-1 -right-1 w-6 h-6 border-t-4 border-r-4 border-teal-400 rounded-tr-lg" />
              <div className="absolute -bottom-1 -left-1 w-6 h-6 border-b-4 border-l-4 border-teal-400 rounded-bl-lg" />
              <div className="absolute -bottom-1 -right-1 w-6 h-6 border-b-4 border-r-4 border-teal-400 rounded-br-lg" />

              {/* Animated laser scan bar */}
              <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-teal-400 to-transparent absolute top-0 animate-[bounce_2.5s_infinite] shadow-[0_0_8px_#2dd4bf]" />
            </div>
          </div>

          {/* Live Stream Status Tag */}
          <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-sm px-2.5 py-1 rounded-lg border border-slate-800 text-[11px] flex items-center gap-1.5 font-mono">
            {cameraActive ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-emerald-300">Optical Camera Stream Active</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-amber-300">Initializing Sensor...</span>
              </>
            )}
          </div>

          {/* Fallback error if permission denied */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-950/90 flex flex-col items-center justify-center p-6 text-center space-y-2 z-10">
              <AlertCircle className="w-8 h-8 text-amber-400" />
              <h4 className="text-sm font-bold text-white">Camera Permission / Device Notice</h4>
              <p className="text-xs text-slate-300 max-w-sm">{cameraError}</p>
              <div className="pt-2 text-[11px] text-teal-400 font-semibold">
                Use the One-Tap QR Simulators below to test touchless patient intake & batch logs instantly!
              </div>
            </div>
          )}
        </div>

        {/* Live Detected Result Confirmation Banner */}
        {lastScannedResult && (
          <div className="bg-emerald-950/50 border border-emerald-500/40 rounded-xl p-3.5 flex items-start gap-3 animate-in fade-in">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="text-xs flex-1">
              <div className="font-bold text-emerald-300 text-sm">
                {lastScannedResult.title}
              </div>
              <p className="text-emerald-100/90 mt-0.5 leading-relaxed">
                {lastScannedResult.description}
              </p>
            </div>
          </div>
        )}

        {/* One-Tap Simulation Triggers (For immediate touchless testing) */}
        <div className="bg-slate-800/80 p-3.5 rounded-xl border border-slate-700/80 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-teal-400" />
              Simulate Touchless QR Optical Scan:
            </span>
            <span className="text-[10px] text-slate-400">Point phone camera OR test simulated cards</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <button
              onClick={() => handleSimulatePatientScan('opd')}
              className="px-3 py-2 bg-purple-600/30 hover:bg-purple-600/50 border border-purple-500/40 text-purple-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-left"
            >
              <UserCheck className="w-4 h-4 text-purple-400 shrink-0" />
              <span>Scan Patient ABHA Card (OPD)</span>
            </button>

            <button
              onClick={() => handleSimulatePatientScan('emergency')}
              className="px-3 py-2 bg-rose-600/30 hover:bg-rose-600/50 border border-rose-500/40 text-rose-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-left"
            >
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>Scan Emergency Patient Token</span>
            </button>

            <button
              onClick={() => handleSimulateMedicineScan()}
              className="px-3 py-2 bg-teal-600/30 hover:bg-teal-600/50 border border-teal-500/40 text-teal-200 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition text-left"
            >
              <Boxes className="w-4 h-4 text-teal-400 shrink-0" />
              <span>Scan Drug Lot Shipment QR</span>
            </button>
          </div>
        </div>

        {/* Recent Touchless Scan History */}
        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <History className="w-3.5 h-3.5" />
            Recent Touchless QR Scan Log
          </h4>

          <div className="max-h-32 overflow-y-auto space-y-1.5 pr-1 text-xs">
            {scanHistory.map((rec) => (
              <div 
                key={rec.id}
                className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800 flex items-center justify-between gap-2"
              >
                <div className="flex items-center gap-2">
                  {rec.type === 'PATIENT' ? (
                    <div className="w-6 h-6 rounded bg-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
                      <UserCheck className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div className="w-6 h-6 rounded bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                      <Boxes className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-white text-[11px]">{rec.title}</div>
                    <div className="text-[10px] text-slate-400">{rec.detail}</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-mono font-bold text-teal-400 block">
                    {rec.actionTaken}
                  </span>
                  <span className="text-[9px] text-slate-500 font-mono">
                    {rec.timestamp}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Camera feed processed 100% on-device for patient privacy</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl transition"
          >
            Close Scanner
          </button>
        </div>
      </div>
    </div>
  );
};
