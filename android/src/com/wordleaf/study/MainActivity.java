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
    public final class LocalApp {
        @android.webkit.JavascriptInterface public void checkUpdate() {
            runOnUiThread(() -> updates.check());
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
