/* auth.js - login + register (DEMO ONLY: not secure authentication) */
(function () {
  const msg = document.getElementById("form-msg");
  const next = U.qs("next"), dest = next && /^[a-z-]+\.html(\?.*)?$/i.test(next) ? next : "account.html";
  const setErr = (id, t) => { const e = document.getElementById(id + "-err"); if (e) e.textContent = t || ""; };
  const showMsg = (t, type) => { msg.textContent = t; msg.className = "form-msg " + (type || "error"); };
  document.addEventListener("click", e => {
    const t = e.target.closest("[data-toggle]"); if (!t) return; const i = document.getElementById(t.dataset.toggle);
    i.type = i.type === "password" ? "text" : "password"; t.textContent = i.type === "password" ? "Show" : "Hide";
  });
  if (Auth.user() && !U.qs("stay")) { location.replace(dest); return; }

  const login = document.getElementById("login-form");
  if (login) login.addEventListener("submit", e => {
    e.preventDefault(); ["identity", "password"].forEach(k => setErr(k, "")); msg.className = "form-msg error hidden";
    const id = document.getElementById("identity").value.trim().toLowerCase(), pw = document.getElementById("password").value; let bad = false;
    if (!id) { setErr("identity", "Enter your email or phone"); bad = true; } else if (!V.email(id) && !V.phone(id)) { setErr("identity", "Enter a valid email or 10-digit phone"); bad = true; }
    if (!pw) { setErr("password", "Enter your password"); bad = true; }
    if (bad) return;
    const u = Store.users().find(x => (x.email.toLowerCase() === id || x.phone === id) && x.passwordHash === demoHash(pw));
    if (!u) { showMsg("Incorrect email/phone or password."); return; }
    Store.write(KEYS.currentUser, u.id); showMsg("Login successful! Redirecting…", "success"); setTimeout(() => location.href = dest, 700);
  });

  const reg = document.getElementById("register-form");
  if (reg) {
    const pw = document.getElementById("password"), bar = document.getElementById("strength-bar"), txt = document.getElementById("strength-text");
    pw.addEventListener("input", () => {
      const s = V.strength(pw.value), lv = [["#e5383b", "Too weak"], ["#e5383b", "Weak"], ["#f59e0b", "Fair"], ["#84cc16", "Good"], ["#03a685", "Strong"]][pw.value ? s : 0];
      bar.style.width = pw.value ? Math.max(1, s) * 25 + "%" : "0"; bar.style.background = lv[0]; txt.textContent = pw.value ? lv[1] : "";
    });
    reg.addEventListener("submit", e => {
      e.preventDefault(); ["name", "email", "phone", "password", "confirm"].forEach(k => setErr(k, "")); msg.className = "form-msg error hidden";
      const v = k => document.getElementById(k).value.trim(), name = v("name"), email = v("email").toLowerCase(), phone = v("phone"), p1 = pw.value, p2 = document.getElementById("confirm").value; let bad = false;
      if (name.length < 2) { setErr("name", "Enter your full name"); bad = true; }
      if (!V.email(email)) { setErr("email", "Enter a valid email"); bad = true; }
      if (!V.phone(phone)) { setErr("phone", "Enter a valid 10-digit mobile number"); bad = true; }
      if (p1.length < 8 || V.strength(p1) < 3) { setErr("password", "Min 8 characters with upper/lower case letters and a number"); bad = true; }
      if (p1 !== p2) { setErr("confirm", "Passwords do not match"); bad = true; }
      if (bad) return;
      const users = Store.users();
      if (users.some(u => u.email.toLowerCase() === email)) { setErr("email", "An account with this email already exists"); return; }
      if (users.some(u => u.phone === phone)) { setErr("phone", "An account with this phone already exists"); return; }
      const user = { id: "u_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6), name, email, phone, passwordHash: demoHash(p1), createdAt: Date.now() };
      users.push(user); Store.write(KEYS.users, users); Store.write(KEYS.currentUser, user.id);
      reg.reset(); showMsg("Account created! Redirecting…", "success"); setTimeout(() => location.href = dest, 800);
    });
  }
})();
