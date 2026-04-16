export function isMobile(): boolean {
  if (typeof window === 'undefined') return false;
  
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
}

export function isMobileChrome(): boolean {
  return isMobile() && /Chrome/.test(navigator.userAgent);
}

export function isMobileSafari(): boolean {
  return isMobile() && /Safari/.test(navigator.userAgent);
}

export function getMobileInfo() {
  return {
    isMobile: isMobile(),
    isChrome: isMobileChrome(),
    isSafari: isMobileSafari(),
    userAgent: navigator.userAgent,
    supportsWebRTC: !!window.RTCPeerConnection,
    supportsGetUserMedia: !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia)
  };
}

export function requestUserGesture(): Promise<void> {
  return new Promise((resolve) => {
    // Create a simple click handler to request user gesture
    const handleUserGesture = () => {
      document.removeEventListener('touchstart', handleUserGesture);
      document.removeEventListener('click', handleUserGesture);
      resolve();
    };
    
    document.addEventListener('touchstart', handleUserGesture, { once: true });
    document.addEventListener('click', handleUserGesture, { once: true });
    
    // Timeout in case user doesn't interact
    setTimeout(() => {
      resolve();
    }, 5000);
  });
}
