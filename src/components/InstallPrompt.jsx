import { useEffect, useState } from "react";
import { NC } from "../theme/tokens";
import { Body, GhostButton, PrimaryButton } from "./nc/ui";

const DISMISS_KEY = "neurochat_install_dismissed";

export function InstallPrompt() {
  const [deferred, setDeferred] = useState(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch {
      // ignore
    }

    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferred(e);
      setVisible(true);
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", onBeforeInstall);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    try {
      window.localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      // ignore
    }
    setVisible(false);
  };

  const install = async () => {
    await deferred.prompt();
    setVisible(false);
    setDeferred(null);
  };

  return (
    <div
      role="dialog"
      aria-label="Install NeuroChat"
      style={{
        position: "fixed",
        bottom: 16,
        left: "50%",
        transform: "translateX(-50%)",
        width: "min(400px, calc(100% - 32px))",
        background: NC.card,
        border: `1px solid ${NC.cardEdge}`,
        borderRadius: 16,
        padding: "14px 16px",
        boxShadow: NC.shadowLg,
        zIndex: 10000,
      }}
    >
      <Body size={14} color={NC.ink} style={{ fontWeight: 600, marginBottom: 4 }}>
        Install NeuroChat
      </Body>
      <Body size={13} color={NC.inkMute} style={{ lineHeight: 1.5, marginBottom: 12 }}>
        Add to your home screen for quick access and offline practice.
      </Body>
      <div style={{ display: "flex", gap: 8 }}>
        <PrimaryButton kind="ink" style={{ flex: 1, minHeight: 42, fontSize: 14 }} onClick={install}>
          Install
        </PrimaryButton>
        <GhostButton style={{ flex: 1, minHeight: 42, fontSize: 14 }} onClick={dismiss}>
          Not now
        </GhostButton>
      </div>
    </div>
  );
}
