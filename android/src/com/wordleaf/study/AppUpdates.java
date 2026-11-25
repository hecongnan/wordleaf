package com.wordleaf.study;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.provider.Settings;
import android.widget.Toast;
import java.io.*;
import java.net.URL;
import java.security.MessageDigest;
import java.util.Arrays;
import javax.net.ssl.HttpsURLConnection;
import org.json.*;

final class AppUpdates {
    static final int INSTALL_ACCESS = 208;
    private static final String API = "https://api.github.com/repos/hecongnan/wordleaf/releases/latest";
    private final Activity activity;
    private boolean busy;
    AppUpdates(Activity activity) { this.activity = activity; }

    private void message(String text) {
        Toast.makeText(activity, text, Toast.LENGTH_LONG).show();
    }
    private interface Work { Runnable run() throws Exception; }
    private void background(String status, Work work) {
        if (busy) return;
        busy = true;
        message(status);
        new Thread(() -> {
            Runnable next;
            try { next = work.run(); }
            catch (Exception e) { next = () -> message("更新未完成，请检查网络后重试。"); }
            Runnable result = next;
            activity.runOnUiThread(() -> {
                busy = false;
                if (!activity.isFinishing() && !activity.isDestroyed()) result.run();
            });
        }, "wordleaf-update").start();
    }
    private static HttpsURLConnection connect(String url) throws IOException {
        HttpsURLConnection connection = (HttpsURLConnection)new URL(url).openConnection();
        connection.setConnectTimeout(12000);
        connection.setReadTimeout(20000);
        connection.setRequestProperty("User-Agent", "Wordleaf-Android");
        return connection;
    }
    private static void copy(InputStream input, OutputStream output, long limit) throws IOException {
        byte[] buffer = new byte[16384];
        long count = 0;
        for (int n; (n=input.read(buffer)) != -1;) {
            count += n;
            if (count > limit) throw new IOException("Unexpected size");
            output.write(buffer, 0, n);
        }
    }
    static boolean newer(String candidate, String installed) {
        String[] a=candidate.split("\\."), b=installed.split("\\.");
        for (int i=0;i<3;i++) {
            int diff=Integer.compare(Integer.parseInt(a[i]),Integer.parseInt(b[i]));
            if (diff!=0) return diff>0;
        }
        return false;
    }
    void check() {
        background("正在检查新版本…", () -> {
            HttpsURLConnection connection=connect(API);
            JSONObject release;
            try (InputStream input=connection.getInputStream(); ByteArrayOutputStream bytes=new ByteArrayOutputStream()) {
                copy(input,bytes,1024*1024);release=new JSONObject(bytes.toString("UTF-8"));
            } finally { connection.disconnect(); }
            String tag=release.getString("tag_name");
            if (!tag.matches("v[0-9]+\\.[0-9]+\\.[0-9]+")) throw new IOException("Invalid version");
            String version=tag.substring(1);
            String current=activity.getPackageManager().getPackageInfo(activity.getPackageName(),0).versionName;
            if (!newer(version,current)) return () -> message("当前已是最新版本 v"+current);
            JSONArray assets=release.getJSONArray("assets");
            String name="Wordleaf-"+version+".apk";
            String url="https://github.com/hecongnan/wordleaf/releases/download/"+tag+"/"+name;
            for(int i=0;i<assets.length();i++) {
                JSONObject asset=assets.getJSONObject(i);
                if(!url.equals(asset.optString("browser_download_url"))) continue;
                String digest=asset.getString("digest");
                long size=asset.getLong("size");
                if(!digest.matches("sha256:[0-9a-f]{64}") || size<=0 || size>64L*1024*1024)
                    throw new IOException("Invalid asset");
                return () -> new AlertDialog.Builder(activity).setTitle("更新至 v"+version)
                    .setMessage("下载约 "+((size+1048575)/1048576)+" MB。系统将覆盖安装，保留本机学习记录。")
                    .setNegativeButton("稍后",null).setPositiveButton("下载并更新",(d,w)->download(url,digest.substring(7),size)).show();
            }
            throw new IOException("Asset unavailable");
        });
    }
    private File apk() { return new File(activity.getCacheDir(),"update.apk"); }
    private void verify(File file) throws Exception {
        PackageManager manager=activity.getPackageManager();
        PackageInfo current=manager.getPackageInfo(activity.getPackageName(),PackageManager.GET_SIGNATURES);
        PackageInfo incoming=manager.getPackageArchiveInfo(file.getAbsolutePath(),PackageManager.GET_SIGNATURES);
        if(incoming==null || !current.packageName.equals(incoming.packageName) ||
           incoming.versionCode<=current.versionCode || incoming.signatures==null ||
           !Arrays.equals(incoming.signatures,current.signatures)) throw new IOException("Incompatible update");
    }
    private void download(String url,String digest,long size) {
        background("正在下载安装包…",()->{
            File temp=File.createTempFile("wordleaf-",".apk",activity.getCacheDir());
            try {
                MessageDigest hash=MessageDigest.getInstance("SHA-256");
                HttpsURLConnection connection=connect(url);
                try (InputStream input=new java.security.DigestInputStream(connection.getInputStream(),hash);
                     OutputStream output=new FileOutputStream(temp)) { copy(input,output,size); }
                finally { connection.disconnect(); }
                StringBuilder actual=new StringBuilder();
                for(byte b:hash.digest()) actual.append(String.format(java.util.Locale.ROOT,"%02x",b&255));
                if(temp.length()!=size || !digest.contentEquals(actual)) throw new IOException("Checksum mismatch");
                verify(temp);
                if(!temp.renameTo(apk())) throw new IOException("Cannot save package");
                return this::install;
            } finally { temp.delete(); }
        });
    }
    private void install() {
        try {
            if (!activity.getPackageManager().canRequestPackageInstalls()) {
                activity.startActivityForResult(new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES,
                    Uri.parse("package:"+activity.getPackageName())),INSTALL_ACCESS);
                return;
            }
            activity.startActivity(new Intent(Intent.ACTION_VIEW).setDataAndType(UpdateFile.URI,
                "application/vnd.android.package-archive").addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION));
        } catch (RuntimeException e) { message("无法打开系统安装界面，请检查系统安装权限。"); }
    }
    void afterSettings() {
        if (!activity.getPackageManager().canRequestPackageInstalls()) { message("已取消安装。");return; }
        background("正在验证安装包…",()->{verify(apk());return this::install;});
    }
}
