import React, { useState } from 'react';
import {
  CheckCircle2,
  Download,
  Laptop,
  Monitor,
  Smartphone,
  Tablet,
  X,
} from 'lucide-react';

interface DownloadAppModalProps {
  isOpen: boolean;
  onClose: () => void;
  isInstallable: boolean;
  isInstalled: boolean;
  isIOS: boolean;
  onNativeInstall: () => Promise<boolean>;
}

type TargetDevice = 'mobile' | 'tablet' | 'laptop' | 'desktop';

export const DownloadAppModal: React.FC<DownloadAppModalProps> = ({
  isOpen,
  onClose,
  isInstallable,
  isInstalled,
  isIOS,
  onNativeInstall,
}) => {
  const [selectedDevice, setSelectedDevice] = useState<TargetDevice>(
    isIOS ? 'mobile' : 'laptop'
  );
  const [installMessage, setInstallMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleInstallClick = async () => {
    if (isInstallable) {
      const accepted = await onNativeInstall();
      if (accepted) {
        setInstallMessage('Cadence has been installed to your device.');
      } else {
        setInstallMessage('Installation dismissed. You can install anytime from this menu.');
      }
      return;
    }

    setInstallMessage(
      'Use your browser install menu below or download the standalone launcher file for instant desktop/laptop access.'
    );
  };

  const handleDownloadLauncher = () => {
    const appUrl = window.location.origin;
    const launcherHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Cadence — AI Social Media Marketing Agent</title>
  <meta http-equiv="refresh" content="0; url=${appUrl}" />
  <style>
    body { font-family: system-ui, sans-serif; display: grid; place-items: center; min-height: 100vh; margin: 0; background: #f8fafc; color: #0f172a; }
    a { color: #1d4ed8; font-weight: 600; }
  </style>
</head>
<body>
  <p>Launching Cadence Workspace... <a href="${appUrl}">Open Cadence</a></p>
</body>
</html>`;

    const blob = new Blob([launcherHtml], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Cadence-Social-Agent.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setInstallMessage('Saved Cadence-Social-Agent.html launcher to your Downloads folder.');
  };

  const deviceOptions: Array<{
    id: TargetDevice;
    label: string;
    icon: React.ReactNode;
    subtitle: string;
    steps: string[];
  }> = [
    {
      id: 'mobile',
      label: 'Mobile',
      icon: <Smartphone className="w-4 h-4" />,
      subtitle: 'iPhone & Android Phones',
      steps: isIOS
        ? [
            'Open Cadence in Safari on your iPhone.',
            'Tap the Share icon at the bottom of the screen.',
            'Scroll down and tap "Add to Home Screen", then tap Add.',
          ]
        : [
            'Tap "Install App" below if prompted by Chrome or Edge.',
            'Or open your browser menu (three dots) and tap "Install app" or "Add to Home screen".',
            'Launch Cadence directly from your home screen with offline cache support.',
          ],
    },
    {
      id: 'tablet',
      label: 'Tablet',
      icon: <Tablet className="w-4 h-4" />,
      subtitle: 'iPad & Android Tablets',
      steps: [
        'On iPadOS Safari, tap the Share button in the top address bar and choose "Add to Home Screen".',
        'On Android tablets (Chrome/Samsung Internet), tap the install icon in the address bar or click "Install App" below.',
        'Supports split-screen multitasking alongside Meta Business Suite and LinkedIn.',
      ],
    },
    {
      id: 'laptop',
      label: 'Laptop',
      icon: <Laptop className="w-4 h-4" />,
      subtitle: 'MacBook, Windows & Chromebook',
      steps: [
        'Click "Install App" below in Chrome, Edge, Brave, or Arc to add Cadence to your Dock or Start Menu.',
        'Or click the install monitor icon on the right side of your browser address bar.',
        'Runs in a clean standalone window without browser tabs.',
      ],
    },
    {
      id: 'desktop',
      label: 'Desktop',
      icon: <Monitor className="w-4 h-4" />,
      subtitle: 'Windows, macOS & Linux Workstations',
      steps: [
        'Install directly as a standalone desktop Progressive Web App via Chrome or Microsoft Edge.',
        'Or download the lightweight HTML desktop launcher shortcut to keep on your Desktop.',
        'Includes offline asset caching and responsive multi-panel workspace layout.',
      ],
    },
  ];

  const activeGuide = deviceOptions.find((d) => d.id === selectedDevice)!;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-950/50 backdrop-blur-xs p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="download-modal-title"
    >
      <div className="w-full sm:max-w-xl rounded-t-2xl sm:rounded-2xl bg-white border border-slate-200 shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 id="download-modal-title" className="text-lg font-semibold text-slate-900">
              Download Cadence App
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Install across mobile, tablet, laptop, and desktop devices
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close download modal"
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {isInstalled && (
            <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>Cadence is running in installed standalone app mode on this device.</span>
            </div>
          )}

          {/* Device selector segmented tabs */}
          <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg">
            {deviceOptions.map((device) => (
              <button
                key={device.id}
                type="button"
                onClick={() => setSelectedDevice(device.id)}
                className={`min-h-[40px] flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  selectedDevice === device.id
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {device.icon}
                <span>{device.label}</span>
              </button>
            ))}
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-900">
                {activeGuide.label} Setup
              </span>
              <span className="text-xs text-slate-500">{activeGuide.subtitle}</span>
            </div>
            <ol className="space-y-2 text-sm text-slate-700 list-decimal list-inside">
              {activeGuide.steps.map((step, idx) => (
                <li key={idx} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>

          {installMessage && (
            <p className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
              {installMessage}
            </p>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-1">
            {!isInstalled && (
              <button
                type="button"
                onClick={handleInstallClick}
                className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-medium hover:bg-blue-800 transition-colors whitespace-nowrap"
              >
                <Download className="w-4 h-4 shrink-0" />
                <span>{isInstallable ? 'Install Native App Now' : 'Check Browser Install'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleDownloadLauncher}
              className="flex-1 min-h-[44px] inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-medium hover:bg-slate-50 transition-colors whitespace-nowrap"
            >
              <Laptop className="w-4 h-4 shrink-0" />
              <span>Download Shortcut File</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
