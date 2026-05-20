const fs = require('fs');
const path = require('path');

const manifestPath = path.join(__dirname, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');

if (!fs.existsSync(manifestPath)) {
  console.error('❌ Error: Android project not found. Please run "npx cap add android" first.');
  process.exit(1);
}

let content = fs.readFileSync(manifestPath, 'utf8');

// 1. Add permissions
const permissions = [
  '<uses-permission android:name="android.permission.CAMERA" />',
  '<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />',
  '<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />',
  '<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />'
];

let permissionsAdded = false;
permissions.forEach(perm => {
  if (!content.includes(perm)) {
    const index = content.indexOf('<application');
    if (index !== -1) {
      content = content.substring(0, index) + '    ' + perm + '\n' + content.substring(index);
      permissionsAdded = true;
    }
  }
});

// 2. Add AdMob Metadata
const admobMetadata = `        <meta-data
            android:name="com.google.android.gms.ads.APPLICATION_ID"
            android:value="ca-app-pub-3940256099942544~3347511713"/>`;

if (!content.includes('com.google.android.gms.ads.APPLICATION_ID')) {
  const index = content.indexOf('</application>');
  if (index !== -1) {
    content = content.substring(0, index) + admobMetadata + '\n' + content.substring(index);
    console.log('✅ Added AdMob metadata to AndroidManifest.xml');
  }
} else {
  console.log('ℹ️ AdMob metadata already present in AndroidManifest.xml');
}

if (permissionsAdded) {
  console.log('✅ Added camera and storage permissions to AndroidManifest.xml');
} else {
  console.log('ℹ️ Permissions already present in AndroidManifest.xml');
}

fs.writeFileSync(manifestPath, content, 'utf8');
console.log('🎉 Android manifest successfully updated!');
