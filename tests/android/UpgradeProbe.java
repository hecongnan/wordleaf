package com.wordleaf.probe;

import android.app.*;
import android.content.*;
import android.os.Bundle;
import android.webkit.WebView;
import android.view.View;
import android.view.ViewGroup;
import java.util.concurrent.*;
import org.json.*;

public class UpgradeProbe extends Instrumentation {
    private Bundle args;
    private WebView web;
    @Override public void onCreate(Bundle data) {args=data;start();}
    private WebView find(View v) {
        if(v instanceof WebView)return (WebView)v;
        if(v instanceof ViewGroup){ViewGroup g=(ViewGroup)v;for(int i=0;i<g.getChildCount();i++){WebView w=find(g.getChildAt(i));if(w!=null)return w;}}
        return null;
    }
    private String eval(String js) throws Exception {
        ArrayBlockingQueue<String> result=new ArrayBlockingQueue<>(1);
        runOnMainSync(()->web.evaluateJavascript(js,result::offer));
        String value=result.poll(8,TimeUnit.SECONDS);
        if(value==null)throw new Exception("WebView evaluation timed out");
        return value;
    }
    private void waitFor(String js) throws Exception {
        for(int n=0;n<100;n++){if("true".equals(eval(js)))return;Thread.sleep(100);}
        throw new Exception("Condition failed: "+js);
    }
    @Override public void onStart(){
        Bundle report=new Bundle();
        try {
            Intent launch=getTargetContext().getPackageManager().getLaunchIntentForPackage("com.wordleaf.study");
            Activity a=startActivitySync(launch.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            runOnMainSync(()->web=find(a.getWindow().getDecorView()));
            waitFor("!!document.querySelector('[data-act=learn]')");
            if("seed".equals(args.getString("phase"))){
                eval("document.querySelector('[data-act=learn]').click()");
                waitFor("!!document.querySelector('#sheet .focus-word')");
                eval("document.querySelector('#sheet').click();document.querySelector('dialog').dispatchEvent(new KeyboardEvent('keydown',{key:'f'}));document.querySelector('dialog').dispatchEvent(new KeyboardEvent('keydown',{key:'m'}));document.querySelector('#sheet').click()");
            }
            waitFor("JSON.parse(localStorage.getItem('wordleaf1')||'{}').cursor?.[0]===1");
            if(!"seed".equals(args.getString("phase"))){eval("document.querySelector('[data-act=learn]').click()");}
            waitFor("document.querySelector('#sheet .focus-word')?.textContent==='explosive'");
            String json=new JSONArray("["+eval("localStorage.getItem('wordleaf1')")+"]").getString(0);
            JSONObject st=new JSONObject(json);
            if(st.getJSONObject("due").length()!=1 || st.getJSONObject("saved").length()!=1 ||
               st.getJSONObject("fuzzy").length()!=1 || st.getJSONObject("days").length()!=1)throw new Exception("Fixture incomplete");
            byte[] digest=java.security.MessageDigest.getInstance("SHA-256").digest(json.getBytes("UTF-8"));
            report.putString("snapshot",android.util.Base64.encodeToString(digest,android.util.Base64.NO_WRAP));
            report.putString("status","PASS");finish(Activity.RESULT_OK,report);
        }catch(Throwable e){report.putString("error",e.toString());finish(Activity.RESULT_CANCELED,report);}
    }
}
