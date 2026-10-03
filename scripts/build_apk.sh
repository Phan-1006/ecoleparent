#!/usr/bin/env bash
set -e

echo "=== [1/6] Building Web App with Vite ==="
npm run build

echo "=== [2/6] Preparing Android Project Structure ==="
BUILD_DIR="android-build"
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/drawable"
mkdir -p "$BUILD_DIR/src/com/parentecole/app"
mkdir -p "$BUILD_DIR/obj"
mkdir -p "$BUILD_DIR/bin"
mkdir -p "$BUILD_DIR/assets"

# Copy web dist into assets/dist
cp -r dist "$BUILD_DIR/assets/dist"
cp public/pwa-192x192.png "$BUILD_DIR/res/drawable/icon.png"

# Create AndroidManifest.xml
cat << 'EOF' > "$BUILD_DIR/AndroidManifest.xml"
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.parentecole.app"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:label="@string/app_name"
        android:icon="@drawable/icon"
        android:allowBackup="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">

        <activity
            android:name=".MainActivity"
            android:label="@string/app_name"
            android:configChanges="orientation|keyboardHidden|screenSize"
            android:windowSoftInputMode="adjustResize"
            android:exported="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

# Create strings.xml
cat << 'EOF' > "$BUILD_DIR/res/values/strings.xml"
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">ParentEcole</string>
</resources>
EOF

# Create MainActivity.java
cat << 'EOF' > "$BUILD_DIR/src/com/parentecole/app/MainActivity.java"
package com.parentecole.app;

import android.app.Activity;
import android.os.Bundle;
import android.view.KeyEvent;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        webView = new WebView(this);
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                view.loadUrl(url);
                return true;
            }
        });

        webView.setWebChromeClient(new WebChromeClient());

        // Load compiled local web app from android_asset
        webView.loadUrl("file:///android_asset/dist/index.html");

        setContentView(webView);
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (keyCode == KeyEvent.KEYCODE_BACK && webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return super.onKeyDown(keyCode, event);
    }
}
EOF

ANDROID_JAR="/usr/lib/android-sdk/platforms/android-23/android.jar"
DX="/usr/lib/android-sdk/build-tools/debian/dx"

echo "=== [3/6] Compiling Java Activity to Bytecode ==="
javac -cp "$ANDROID_JAR" -source 8 -target 8 -d "$BUILD_DIR/obj" "$BUILD_DIR/src/com/parentecole/app/MainActivity.java"

echo "=== [4/6] Converting to Dalvik Executable (classes.dex) ==="
"$DX" --dex --output="$BUILD_DIR/bin/classes.dex" "$BUILD_DIR/obj"

echo "=== [5/6] Packaging Resources & Assets with AAPT ==="
aapt package -f -m \
  -F "$BUILD_DIR/bin/parentecole-unaligned.apk" \
  -M "$BUILD_DIR/AndroidManifest.xml" \
  -S "$BUILD_DIR/res" \
  -A "$BUILD_DIR/assets" \
  -I "$ANDROID_JAR"

# Add classes.dex into the APK
cd "$BUILD_DIR/bin"
aapt add "parentecole-unaligned.apk" "classes.dex"
cd ../..

echo "=== [6/6] Aligning & Signing APK with Android Keystore ==="
zipalign -f -p 4 "$BUILD_DIR/bin/parentecole-unaligned.apk" "$BUILD_DIR/bin/parentecole-aligned.apk"

# Generate debug keystore if not exists
if [ ! -f "$BUILD_DIR/debug.keystore" ]; then
    keytool -genkeypair -v \
      -keystore "$BUILD_DIR/debug.keystore" \
      -alias androiddebugkey \
      -keyalg RSA -keysize 2048 -validity 10000 \
      -storepass android -keypass android \
      -dname "CN=ParentEcole, OU=Mobile, O=ParentEcole, L=Kinshasa, C=CD"
fi

apksigner sign \
  --ks "$BUILD_DIR/debug.keystore" \
  --ks-pass pass:android \
  --key-pass pass:android \
  --out "parentecole.apk" \
  "$BUILD_DIR/bin/parentecole-aligned.apk"

# Copy to public for direct download link
cp parentecole.apk public/parentecole.apk

echo "=========================================================="
echo "✅ APK COMPILED & SIGNED SUCCESSFULLY!"
echo "Binary path: $(pwd)/parentecole.apk"
echo "Public download path: $(pwd)/public/parentecole.apk"
ls -lh parentecole.apk
echo "=========================================================="
