import { Capacitor } from '@capacitor/core';
import axios from 'axios';

// Helper to determine if app is running in Capacitor native shell
export const isNative = () => {
  return Capacitor.isNativePlatform();
};

/**
 * CAMERA UTILITY
 * Capture photo via native camera or fallback.
 */
export const takePhoto = async () => {
  if (isNative()) {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
    try {
      const image = await Camera.getPhoto({
        quality: 90,
        allowEditing: false,
        resultType: CameraResultType.DataUrl,
        source: CameraSource.Camera,
      });
      return image.dataUrl;
    } catch (err) {
      console.error('Camera plugin error:', err);
      throw err;
    }
  } else {
    throw new Error('Camera is only supported on native mobile app.');
  }
};

/**
 * FILESYSTEM & SHARING UTILITY
 * Download a remote or base64 file, save it to device documents/cache, and share it.
 */
export const downloadOrShareFile = async (fileUrl, fileName) => {
  if (isNative()) {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');

    try {
      // 1. Fetch file as blob/arraybuffer
      let response;
      if (fileUrl.startsWith('data:')) {
        // Already a data URL
        response = fileUrl;
      } else {
        response = await axios.get(fileUrl, { responseType: 'blob' });
      }

      // Convert blob to base64
      let base64Data = '';
      if (typeof response === 'string') {
        base64Data = response.split(',')[1];
      } else {
        const blob = response.data;
        base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(',')[1]);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 2. Request Filesystem Permissions
      try {
        const permStatus = await Filesystem.checkPermissions();
        if (permStatus.publicStorage !== 'granted') {
          await Filesystem.requestPermissions();
        }
      } catch (_) {}

      // 3. Write file to Documents directory (Downloads/KolomFlow/)
      let documentWriteSuccess = false;
      try {
        await Filesystem.writeFile({
          path: `KolomFlow/${fileName}`,
          data: base64Data,
          directory: Directory.Documents,
          recursive: true,
        });
        documentWriteSuccess = true;
      } catch (err) {
        console.warn('Could not write to Documents directory:', err);
      }

      // 4. Write to Cache directory so it's shareable
      const cacheFile = await Filesystem.writeFile({
        path: fileName,
        data: base64Data,
        directory: Directory.Cache,
      });

      // 5. Open Android native Share sheet
      await Share.share({
        title: fileName,
        text: `Download/Share your KolomFlow document: ${fileName}`,
        url: cacheFile.uri,
        dialogTitle: 'Save/Share file',
      });

      if (documentWriteSuccess) {
        alert(`Saved successfully to Documents/KolomFlow/${fileName}`);
      }
    } catch (err) {
      console.error('File saving/sharing failed:', err);
      alert('Failed to save file: ' + err.message);
    }
  } else {
    // Standard web browser download fallback
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * ADMOB REWARDED ADS
 * Plays rewarded videos and returns a promise resolving on ad reward.
 */
export const initializeAdMob = async () => {
  if (isNative()) {
    const { AdMob } = await import('@capacitor-community/admob');
    try {
      await AdMob.initialize({
        requestTrackingAuthorization: true,
      });
    } catch (err) {
      console.warn('AdMob initialize failed:', err);
    }
  }
};

export const showRewardedVideoAd = async (onRewarded, onFailed) => {
  if (isNative()) {
    const { AdMob, RewardAdPluginEvents } = await import('@capacitor-community/admob');
    try {
      // Configure test rewarded video ad unit ID
      const options = {
        adId: 'ca-app-pub-3940256099942544/5224354917', // Google official test ID
      };
      await AdMob.prepareRewardVideoAd(options);

      const rewardListener = await AdMob.addListener(
        RewardAdPluginEvents.Rewarded,
        (reward) => {
          onRewarded(reward);
        }
      );

      await AdMob.showRewardVideoAd();

      // Clean up after standard delay
      setTimeout(() => {
        rewardListener.remove();
      }, 10000);

    } catch (err) {
      console.error('AdMob failed:', err);
      if (onFailed) onFailed(err);
    }
  } else {
    // Simulated web environment ad watcher
    const adDuration = 3000; // 3 seconds simulation
    setTimeout(() => {
      onRewarded({ amount: 10, type: 'credits' });
    }, adDuration);
  }
};

/**
 * NETWORK STATUS
 */
export const getNetworkStatus = async () => {
  if (isNative()) {
    const { Network } = await import('@capacitor/network');
    const status = await Network.getStatus();
    return status.connected;
  }
  return navigator.onLine;
};

export const addNetworkListener = (callback) => {
  if (isNative()) {
    let listenerPromise = (async () => {
      const { Network } = await import('@capacitor/network');
      return Network.addListener('networkStatusChange', (status) => {
        callback(status.connected);
      });
    })();
    return () => {
      listenerPromise.then(listener => listener.remove());
    };
  } else {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }
};

/**
 * STATUS BAR & SPLASH CUSTOMIZER
 */
export const customizeStatusBar = async () => {
  if (isNative()) {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    try {
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#059669' }); // brand emerald bg
    } catch (err) {
      console.warn('StatusBar styling failed:', err);
    }
  }
};

export const hideSplashScreen = async () => {
  if (isNative()) {
    const { SplashScreen } = await import('@capacitor/splash-screen');
    try {
      await SplashScreen.hide();
    } catch (err) {
      console.warn('SplashScreen hide failed:', err);
    }
  }
};

/**
 * PUSH NOTIFICATIONS
 */
export const registerPushNotifications = async () => {
  if (isNative()) {
    const { PushNotifications } = await import('@capacitor/push-notifications');
    try {
      let perm = await PushNotifications.checkPermissions();
      if (perm.receive !== 'granted') {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive === 'granted') {
        await PushNotifications.register();
      }
    } catch (err) {
      console.warn('Push registration failed:', err);
    }
  }
};
