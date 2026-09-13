package games.ovolar.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import androidx.activity.OnBackPressedCallback;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getOnBackPressedDispatcher().addCallback(this, new OnBackPressedCallback(true) {
            @Override
            public void handleOnBackPressed() {
                getBridge().getWebView().evaluateJavascript(
                    "window.location.hash === '#/block'", result -> {
                        if ("true".equals(result)) {
                            getBridge().getWebView().evaluateJavascript(
                                "window.location.replace('#/')", null);
                        } else {
                            moveTaskToBack(true);
                        }
                    });
            }
        });
    }

    @Override
    public void onPause() {
        if (getBridge() != null) {
            getBridge().getWebView().evaluateJavascript(
                "window.dispatchEvent(new Event('ovolar-background'))", null);
        }
        super.onPause();
    }
}
