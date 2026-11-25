package com.wordleaf.study;

import android.app.Activity;
import android.content.Intent;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsets;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import java.io.ByteArrayInputStream;
import java.io.IOException;

public final class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final String START = "https://" + HOST + "/index.html";
    private WebView browser;
    private AppUpdates updates;
    private static final int PICK_BACKUP = 209, WRITE_BACKUP = 210;
    private android.webkit.ValueCallback<Uri[]> picked;
    private java.io.File pendingExport() { return new java.io.File(getCacheDir(), "pending-export.json"); }
    private void backupError() {
        android.widget.Toast.makeText(this, "无法读写备份文件，请重新选择位置。", android.widget.Toast.LENGTH_LONG).show();
    }
    public final class LocalApp {
        @android.webkit.JavascriptInterface public void checkUpdate() {
            runOnUiThread(() -> updates.check());
        }
        @android.webkit.JavascriptInterface public void exportBackup(String json, String name) {
            try (java.io.FileOutputStream out = new java.io.FileOutputStream(pendingExport())) {
                out.write(json.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            } catch (IOException e) { runOnUiThread(() -> backupError()); return; }
            runOnUiThread(() -> {
                Intent save = new Intent(Intent.ACTION_CREATE_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE)
                    .setType("application/json").putExtra(Intent.EXTRA_TITLE, name);
                try { startActivityForResult(save, WRITE_BACKUP); }
                catch (android.content.ActivityNotFoundException e) { pendingExport().delete(); backupError(); }
            });
        }
        @android.webkit.JavascriptInterface public String readProgress() {
            return getSharedPreferences("learning", MODE_PRIVATE).getString("snapshot", "");
        }
        @android.webkit.JavascriptInterface public boolean saveProgress(String value) {
            try {
                org.json.JSONObject data = new org.json.JSONObject(value);
                if (!data.has("cursor") || !data.has("days")) return false;
                return getSharedPreferences("learning", MODE_PRIVATE).edit().putString("snapshot", value).commit();
            } catch (org.json.JSONException e) { return false; }
        }
    }

    @Override protected void onActivityResult(int request, int result, Intent data) {
        super.onActivityResult(request, result, data);
        if (request == PICK_BACKUP && picked != null) {
            picked.onReceiveValue(result == RESULT_OK && data != null && data.getData() != null ? new Uri[]{data.getData()} : null);
            picked = null;
        }
        if (request == WRITE_BACKUP) {
            if (result != RESULT_OK || data == null || data.getData() == null) { pendingExport().delete(); return; }
            final Uri uri = data.getData();
            new Thread(() -> {
                try (java.io.InputStream in = new java.io.FileInputStream(pendingExport());
                     java.io.OutputStream out = getContentResolver().openOutputStream(uri, "wt")) {
                    if (out == null) throw new IOException("Missing output");
                    byte[] buf = new byte[16384]; int count;
                    while ((count = in.read(buf)) != -1) out.write(buf, 0, count);
                } catch (IOException | SecurityException e) { runOnUiThread(this::backupError); return; }
                finally { pendingExport().delete(); }
                runOnUiThread(() -> android.widget.Toast.makeText(this, "备份文件已保存", android.widget.Toast.LENGTH_SHORT).show());
            }, "wordleaf-export").start();
        }
        if (request == AppUpdates.INSTALL_ACCESS) updates.afterSettings();
    }

    @Override public void onCreate(Bundle state) {
        super.onCreate(state);
        browser = new WebView(this);
        browser.setBackgroundColor(Color.rgb(248, 249, 245));
        getWindow().getDecorView().setSystemUiVisibility(
            View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR | View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR);
        if (Build.VERSION.SDK_INT >= 35) {
            browser.setOnApplyWindowInsetsListener((view, insets) -> {
                android.graphics.Insets bars = insets.getInsets(
                    WindowInsets.Type.systemBars() | WindowInsets.Type.displayCutout() | WindowInsets.Type.ime());
                view.setPadding(bars.left, bars.top, bars.right, bars.bottom);
                return insets;
            });
        }
        WebSettings settings = browser.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        updates = new AppUpdates(this);
        browser.addJavascriptInterface(new LocalApp(), "WordleafLocal");
        browser.setWebChromeClient(new android.webkit.WebChromeClient() {
            @Override public boolean onShowFileChooser(WebView view, android.webkit.ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (picked != null) picked.onReceiveValue(null);
                picked = callback;
                try { startActivityForResult(new Intent(Intent.ACTION_OPEN_DOCUMENT).addCategory(Intent.CATEGORY_OPENABLE).setType("*/*"), PICK_BACKUP); }
                catch (android.content.ActivityNotFoundException e) { picked.onReceiveValue(null); picked=null; backupError(); }
                return true;
            }
        });
        browser.setWebViewClient(new WebViewClient() {
            @Override public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                String path = uri.getPath();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())
                        && path != null && path.matches("/[A-Za-z0-9_.-]+")) {
                    String name = path.substring(1);
                    try {
                        WebResourceResponse response = new WebResourceResponse(mime(name), "UTF-8", getAssets().open(name));
                        if ("index.html".equals(name)) response.setResponseHeaders(java.util.Collections.singletonMap(
                            "Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; frame-src 'none'; object-src 'none'; base-uri 'none'"));
                        return response;
                    } catch (IOException ignored) { /* Return the local 404 below. */ }
                }
                return new WebResourceResponse("text/plain", "UTF-8", 404, "Not Found", null,
                    new ByteArrayInputStream(new byte[0]));
            }
            @Override public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri uri = request.getUrl();
                if ("https".equals(uri.getScheme()) && HOST.equals(uri.getHost())) return false;
                if (request.isForMainFrame() && request.hasGesture() && "https".equals(uri.getScheme())) {
                    try { startActivity(new Intent(Intent.ACTION_VIEW, uri)); }
                    catch (android.content.ActivityNotFoundException ignored) { }
                }
                return true;
            }
        });
        setContentView(browser);
        browser.loadUrl(START);
    }

    private static String mime(String name) {
        if (name.endsWith(".html")) return "text/html";
        if (name.endsWith(".js")) return "text/javascript";
        if (name.endsWith(".css")) return "text/css";
        if (name.endsWith(".json")) return "application/json";
        if (name.endsWith(".svg")) return "image/svg+xml";
        return "text/plain";
    }

    @Override public void onBackPressed() {
        browser.evaluateJavascript("document.querySelector('dialog[open]') && location.hash !== '#study' ? (document.querySelector('dialog[open]').close(), true) : false",
            closed -> {
                if ("true".equals(closed)) return;
                if (browser.canGoBack()) browser.goBack();
                else finish();
            });
    }
}
