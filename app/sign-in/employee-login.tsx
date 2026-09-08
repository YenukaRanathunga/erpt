"use client";

import { SignIn } from "@clerk/nextjs";
import { useSignIn } from "@clerk/nextjs/legacy";
import type { EmailCodeFactor, SignInFirstFactor } from "@clerk/nextjs/types";
import { FormEvent, useState } from "react";

function messageFor(reason: unknown) {
  if (reason && typeof reason === "object" && "errors" in reason) {
    const errors = (reason as { errors?: Array<{ longMessage?: string; message?: string }> }).errors;
    if (errors?.[0]) return errors[0].longMessage ?? errors[0].message ?? "Unable to continue.";
  }
  return reason instanceof Error ? reason.message : "Unable to continue.";
}

export default function EmployeeLogin() {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [empNo, setEmpNo] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [code, setCode] = useState("");
  const [maskedEmail, setMaskedEmail] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [rootLogin, setRootLogin] = useState(false);
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const switchMode = (next: "signin" | "signup") => { setMode(next); setError(""); setEmail(""); setEmpNo(""); setFullName(""); setCode(""); setVerifying(false); };

  const startVerification = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || !signIn) return;
    setLoading(true); setError("");
    try {
      const normalizedEmail = email.trim().toLowerCase();

      if (mode === "signup") {
        const trimmedName = fullName.trim();
        if (!trimmedName || trimmedName.length < 2) throw new Error("Enter your full name.");
        const signupResponse = await fetch("/api/auth/employee-signup", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empNo, email: normalizedEmail, name: trimmedName }) });
        const signupResult = await signupResponse.json() as { error?: string };
        if (!signupResponse.ok) throw new Error(signupResult.error ?? "Unable to create your account.");
      } else {
        const response = await fetch("/api/auth/employee-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ empNo, email: normalizedEmail }) });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error ?? "Unable to verify this staff profile.");
      }

      const attempt = await signIn.create({ identifier: normalizedEmail });
      const isEmailCodeFactor = (factor: SignInFirstFactor): factor is EmailCodeFactor => factor.strategy === "email_code";
      const emailFactor = attempt.supportedFirstFactors?.find(isEmailCodeFactor);
      if (!emailFactor) throw new Error("Email verification codes are not enabled. Contact the Super Admin.");
      await signIn.prepareFirstFactor({ strategy: "email_code", emailAddressId: emailFactor.emailAddressId });
      setMaskedEmail(normalizedEmail.replace(/^(.{2}).*(@.*)$/, "$1••••$2"));
      setVerifying(true);
    } catch (reason) {
      const message = messageFor(reason);
      if (/already signed in/i.test(message)) { window.location.assign("/"); return; }
      setError(message);
    }
    finally { setLoading(false); }
  };

  const verifyCode = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isLoaded || !signIn || !setActive) return;
    setLoading(true); setError("");
    try {
      const attempt = await signIn.attemptFirstFactor({ strategy: "email_code", code });
      if (attempt.status !== "complete" || !attempt.createdSessionId) throw new Error("Verification is not complete. Check the code and try again.");
      await setActive({ session: attempt.createdSessionId });
      const response = await fetch("/api/auth/employee-verify", { method: "POST" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error ?? "Unable to complete secure sign-in.");
      window.location.assign("/");
    } catch (reason) { setError(messageFor(reason)); }
    finally { setLoading(false); }
  };

  if (rootLogin) return <><button type="button" className="employee-back" onClick={() => setRootLogin(false)}>← Employee login</button><SignIn routing="path" path="/sign-in" forceRedirectUrl="/" /></>;
  if (verifying) return <>
    <form className="employee-login-form employee-otp-form" onSubmit={verifyCode}>
      <button type="button" className="employee-back" onClick={() => { setVerifying(false); setCode(""); setError(""); }}>← Change details</button>
      <div className="employee-otp-heading"><span>✉</span><div><strong>Check your work email</strong><small>We sent a 6-digit verification code to {maskedEmail}.</small></div></div>
      <label htmlFor="employee-code">Verification code</label>
      <div className="employee-input employee-code-input"><input id="employee-code" inputMode="numeric" autoComplete="one-time-code" autoFocus maxLength={6} value={code} onChange={event => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="000000" required /></div>
      <p className="employee-help">The code expires shortly. Never share it with another person.</p>
      {error && <p className="employee-error" role="alert">{error}</p>}
      <button className="employee-submit" type="submit" disabled={loading || code.length !== 6}>{loading ? "Verifying…" : "Verify & trust this browser"}<span>→</span></button>
    </form>
    <button type="button" className="root-login-link" onClick={() => { setVerifying(false); setError(""); }}>Send a new code</button>
  </>;

  if (mode === "signup") return <>
    <form className="employee-login-form" onSubmit={startVerification}>
      <div className="employee-signup-badge">NEW ACCOUNT</div>
      <label htmlFor="signup-name">Full name</label>
      <div className="employee-input"><span>👤</span><input id="signup-name" type="text" autoComplete="name" autoFocus value={fullName} onChange={event => setFullName(event.target.value)} placeholder="Enter your full name" required /></div>
      <label className="employee-second-label" htmlFor="signup-email">Work email</label>
      <div className="employee-input"><span>@</span><input id="signup-email" type="email" autoComplete="email" value={email} onChange={event => setEmail(event.target.value)} placeholder="name@chrysaliscatalyz.com" required /></div>
      <label className="employee-second-label" htmlFor="signup-empno">Employee Number</label>
      <div className="employee-input"><span>#</span><input id="signup-empno" inputMode="numeric" autoComplete="username" value={empNo} onChange={event => setEmpNo(event.target.value.replace(/\D/g, ""))} placeholder="Enter your EMP No" required /></div>
      <p className="employee-help">A one-time verification code will be sent to your work email to confirm your identity.</p>
      {error && <p className="employee-error" role="alert">{error}</p>}
      <button className="employee-submit" type="submit" disabled={loading || !isLoaded}>{loading ? "Creating account…" : "Create account & verify"}<span>→</span></button>
    </form>
    <button type="button" className="root-login-link" onClick={() => switchMode("signin")}>Already have an account? Sign in</button>
  </>;

  return <>
    <form className="employee-login-form" onSubmit={startVerification}>
      <label htmlFor="employee-email">Work email</label>
      <div className="employee-input"><span>@</span><input id="employee-email" type="email" autoComplete="email" autoFocus value={email} onChange={event => setEmail(event.target.value)} placeholder="name@chrysaliscatalyz.com" required /></div>
      <label className="employee-second-label" htmlFor="employee-number">Employee Number</label>
      <div className="employee-input"><span>#</span><input id="employee-number" inputMode="numeric" autoComplete="username" value={empNo} onChange={event => setEmpNo(event.target.value.replace(/\D/g, ""))} placeholder="Enter your EMP No" required /></div>
      <p className="employee-help">On a new browser, a one-time code is sent to your official work email. This browser stays trusted after verification.</p>
      {error && <p className="employee-error" role="alert">{error}</p>}
      <button className="employee-submit" type="submit" disabled={loading || !isLoaded}>{loading ? "Sending secure code…" : "Continue securely"}<span>→</span></button>
    </form>
    <button type="button" className="root-login-link" onClick={() => switchMode("signup")}>First time? Create your account</button>
    <button type="button" className="root-login-link" onClick={() => setRootLogin(true)}>Super Admin secure login</button>
  </>;
}
