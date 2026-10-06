(() => {
  // ============================================================
  // DOM Elements
  // ============================================================
  const form = document.getElementById("riskForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorNote = document.getElementById("errorNote");
  const verdict = document.getElementById("verdict");

  // Form Inputs
  const ageInput = document.getElementById("person_age");
  const incomeInput = document.getElementById("person_income");
  const ownershipInput = document.getElementById("person_home_ownership");
  const empInput = document.getElementById("person_emp_length");
  const intentInput = document.getElementById("loan_intent");
  const gradeInput = document.getElementById("loan_grade");
  const amountInput = document.getElementById("loan_amnt");
  const intRateInput = document.getElementById("loan_int_rate");
  const percentInput = document.getElementById("loan_percent_income");
  const defaultInput = document.getElementById("cb_person_default_on_file");
  const credHistInput = document.getElementById("cb_person_cred_hist_length");

  // Visual DTI & Sliders
  const ratioIndicator = document.getElementById("ratioIndicator");
  const dtiMeterBar = document.getElementById("dtiMeterBar");
  const sliderAge = document.getElementById("slider_age");
  const sliderEmp = document.getElementById("slider_emp");
  const sliderRate = document.getElementById("slider_rate");
  const sliderCredHist = document.getElementById("slider_cred_hist");

  // Verdict Components
  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeThreshold = document.getElementById("gaugeThreshold");
  const probNumber = document.getElementById("probNumber");
  const stampBadge = document.getElementById("stampBadge");
  const stampText = document.getElementById("stampText");
  const gaugeHalo = document.getElementById("gaugeHalo");
  const laserScanner = document.getElementById("laserScanner");

  const factProb = document.getElementById("factProb");
  const factThreshold = document.getElementById("factThreshold");
  const factResult = document.getElementById("factResult");
  const factSub = document.getElementById("factSub");
  const decisionPill = document.getElementById("decisionPill");
  const legendThreshold = document.getElementById("legendThreshold");
  const shapFactors = document.getElementById("shapFactors");
  const probProgFill = document.getElementById("probProgFill");
  const threshProgFill = document.getElementById("threshProgFill");

  // Presets & Service Dot
  const apiDot = document.getElementById("apiDot");
  const apiStatusText = document.getElementById("apiStatusText");
  const presetLowBtn = document.getElementById("presetLowRisk");
  const presetHighBtn = document.getElementById("presetHighRisk");

  // Audio & What-If
  const soundToggle = document.getElementById("soundToggle");
  const whatifToggle = document.getElementById("whatifToggle");
  const whatifBtn = document.getElementById("whatifBtn");
  const whatifBody = document.getElementById("whatifBody");
  const simAmntSlider = document.getElementById("simAmntSlider");
  const simRateSlider = document.getElementById("simRateSlider");
  const simIncomeSlider = document.getElementById("simIncomeSlider");
  const simAmntVal = document.getElementById("simAmntVal");
  const simRateVal = document.getElementById("simRateVal");
  const simIncomeVal = document.getElementById("simIncomeVal");
  const applyWhatIfBtn = document.getElementById("applyWhatIfBtn");

  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * 86

  // ============================================================
  // Audio Synthesizer (Web Audio API - No external assets)
  // ============================================================
  let audioEnabled = localStorage.getItem("aura_audio") === "true";
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playTone(freq, type = "sine", duration = 0.15, vol = 0.1) {
    if (!audioEnabled || !audioCtx) return;
    try {
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(vol, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (_) {}
  }

  function playSuccessSound() {
    if (!audioEnabled || !audioCtx) return;
    // Pleasant ascending chime
    const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
    notes.forEach((freq, idx) => {
      setTimeout(() => playTone(freq, "triangle", 0.35, 0.08), idx * 80);
    });
  }

  function playAlertSound() {
    if (!audioEnabled || !audioCtx) return;
    // Low cinematic warning tone
    playTone(180, "sawtooth", 0.45, 0.12);
    setTimeout(() => playTone(120, "sine", 0.6, 0.15), 100);
  }

  function updateSoundUI() {
    if (!soundToggle) return;
    const iconOn = soundToggle.querySelector(".sound-icon-on");
    const iconOff = soundToggle.querySelector(".sound-icon-off");
    if (audioEnabled) {
      soundToggle.classList.add("active");
      if (iconOn) iconOn.style.display = "block";
      if (iconOff) iconOff.style.display = "none";
    } else {
      soundToggle.classList.remove("active");
      if (iconOn) iconOn.style.display = "none";
      if (iconOff) iconOff.style.display = "block";
    }
  }

  if (soundToggle) {
    soundToggle.addEventListener("click", () => {
      audioEnabled = !audioEnabled;
      localStorage.setItem("aura_audio", audioEnabled);
      if (audioEnabled) {
        initAudio();
        playTone(600, "sine", 0.1, 0.08);
      }
      updateSoundUI();
    });
    updateSoundUI();
  }

  // ============================================================
  // Neural Particle Background Canvas
  // ============================================================
  const canvas = document.getElementById("particleCanvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const particles = [];
    const PARTICLE_COUNT = Math.min(50, Math.floor(window.innerWidth / 28));

    for (let i = 0; i < PARTICLE_COUNT; i++) {
      particles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.45,
        vy: (Math.random() - 0.5) * 0.45,
        radius: Math.random() * 1.8 + 1,
        alpha: Math.random() * 0.5 + 0.2,
      });
    }

    let mouseX = -1000;
    let mouseY = -1000;

    window.addEventListener("mousemove", (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    window.addEventListener("resize", () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    });

    function drawNeuralNetwork() {
      ctx.clearRect(0, 0, width, height);

      // Draw connections
      for (let i = 0; i < particles.length; i++) {
        const p1 = particles[i];
        p1.x += p1.vx;
        p1.y += p1.vy;

        if (p1.x < 0 || p1.x > width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > height) p1.vy *= -1;

        // Draw node
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(99, 102, 241, ${p1.alpha})`;
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < 130) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            const lineAlpha = (1 - dist / 130) * 0.16;
            ctx.strokeStyle = `rgba(6, 182, 212, ${lineAlpha})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      requestAnimationFrame(drawNeuralNetwork);
    }
    requestAnimationFrame(drawNeuralNetwork);
  }

  // ============================================================
  // Dynamic Cursor Spotlight Aura
  // ============================================================
  const cursorGlow = document.getElementById("cursorGlow");
  if (cursorGlow) {
    let curX = window.innerWidth / 2;
    let curY = window.innerHeight / 2;
    let targetX = curX;
    let targetY = curY;

    window.addEventListener("mousemove", (e) => {
      targetX = e.clientX;
      targetY = e.clientY;
    });

    function updateCursor() {
      curX += (targetX - curX) * 0.12;
      curY += (targetY - curY) * 0.12;
      cursorGlow.style.transform = `translate(${curX}px, ${curY}px) translate(-50%, -50%)`;
      requestAnimationFrame(updateCursor);
    }
    requestAnimationFrame(updateCursor);
  }

  // ============================================================
  // 3D Perspective Card Tilt
  // ============================================================
  const tiltElements = document.querySelectorAll(".tilt-element");
  tiltElements.forEach((el) => {
    el.addEventListener("mousemove", (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const midX = rect.width / 2;
      const midY = rect.height / 2;
      const rotateX = ((y - midY) / midY) * -3;
      const rotateY = ((x - midX) / midX) * 3;
      el.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
    });

    el.addEventListener("mouseleave", () => {
      el.style.transform = "perspective(1000px) rotateX(0deg) rotateY(0deg)";
    });
  });

  // ============================================================
  // Button Ripple Micro-Animation
  // ============================================================
  document.querySelectorAll(".ripple-btn").forEach((btn) => {
    btn.addEventListener("click", function (e) {
      initAudio();
      playTone(450, "sine", 0.08, 0.05);

      const circle = document.createElement("span");
      const diameter = Math.max(btn.clientWidth, btn.clientHeight);
      const radius = diameter / 2;
      const rect = btn.getBoundingClientRect();

      circle.style.width = circle.style.height = `${diameter}px`;
      circle.style.left = `${e.clientX - rect.left - radius}px`;
      circle.style.top = `${e.clientY - rect.top - radius}px`;
      circle.classList.add("ripple");

      const existingRipple = btn.querySelector(".ripple");
      if (existingRipple) existingRipple.remove();

      btn.appendChild(circle);
      setTimeout(() => circle.remove(), 600);
    });
  });

  // ============================================================
  // Synchronized Inputs & Sliders
  // ============================================================
  function syncSliderAndInput(inputEl, sliderEl) {
    if (!inputEl || !sliderEl) return;
    sliderEl.addEventListener("input", () => {
      inputEl.value = sliderEl.value;
      inputEl.dispatchEvent(new Event("input"));
    });
    inputEl.addEventListener("input", () => {
      sliderEl.value = inputEl.value;
    });
  }

  syncSliderAndInput(ageInput, sliderAge);
  syncSliderAndInput(empInput, sliderEmp);
  syncSliderAndInput(intRateInput, sliderRate);
  syncSliderAndInput(credHistInput, sliderCredHist);

  // Quick Adjustment Buttons
  document.querySelectorAll(".quick-inc-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      initAudio();
      playTone(500, "sine", 0.06, 0.04);
      const targetId = btn.getAttribute("data-target");
      const delta = parseFloat(btn.getAttribute("data-delta"));
      const targetInput = document.getElementById(targetId);
      if (targetInput) {
        let val = parseFloat(targetInput.value) || 0;
        val = Math.max(0, val + delta);
        targetInput.value = val;
        targetInput.dispatchEvent(new Event("input"));
      }
    });
  });

  // ============================================================
  // Real-Time Animated DTI Calculation & Visual Meter
  // ============================================================
  function recalcPercent() {
    const income = parseFloat(incomeInput.value) || 0;
    const amount = parseFloat(amountInput.value) || 0;
    if (income > 0 && amount >= 0) {
      const ratio = amount / income;
      percentInput.value = ratio.toFixed(2);

      const ratioPct = Math.min(100, Math.max(0, ratio * 100));

      if (dtiMeterBar) {
        dtiMeterBar.style.width = `${ratioPct}%`;
        if (ratio <= 0.2) {
          dtiMeterBar.style.background = "linear-gradient(90deg, #10B981, #06B6D4)";
        } else if (ratio <= 0.35) {
          dtiMeterBar.style.background = "linear-gradient(90deg, #06B6D4, #F59E0B)";
        } else {
          dtiMeterBar.style.background = "linear-gradient(90deg, #F59E0B, #F43F5E)";
        }
      }

      if (ratioIndicator) {
        ratioIndicator.textContent = `${ratioPct.toFixed(1)}% of income`;
        if (ratio > 0.35) {
          ratioIndicator.style.color = "var(--risk-high)";
          ratioIndicator.style.background = "rgba(244, 63, 94, 0.15)";
        } else if (ratio > 0.2) {
          ratioIndicator.style.color = "var(--risk-warn)";
          ratioIndicator.style.background = "rgba(245, 158, 11, 0.15)";
        } else {
          ratioIndicator.style.color = "var(--primary-cyan)";
          ratioIndicator.style.background = "rgba(6, 182, 212, 0.12)";
        }
      }
    }
  }

  incomeInput.addEventListener("input", recalcPercent);
  amountInput.addEventListener("input", recalcPercent);
  recalcPercent();

  // ============================================================
  // Service Status Check
  // ============================================================
  function checkEngineStatus() {
    fetch("/openapi.json", { method: "GET" })
      .then((res) => {
        if (res.ok) {
          apiDot.className = "pulse-dot ok";
          apiStatusText.textContent = "engine active";
        } else {
          throw new Error("bad status");
        }
      })
      .catch(() => {
        apiDot.className = "pulse-dot down";
        apiStatusText.textContent = "engine offline";
      });
  }
  checkEngineStatus();

  // ============================================================
  // Preset Profiles
  // ============================================================
  if (presetLowBtn) {
    presetLowBtn.addEventListener("click", () => {
      ageInput.value = 34;
      incomeInput.value = 95000;
      ownershipInput.value = "MORTGAGE";
      empInput.value = 8;
      intentInput.value = "HOMEIMPROVEMENT";
      gradeInput.value = "A";
      amountInput.value = 10000;
      intRateInput.value = 7.5;
      defaultInput.value = "N";
      credHistInput.value = 9;
      [sliderAge, sliderEmp, sliderRate, sliderCredHist].forEach((s) => {
        if (s) s.dispatchEvent(new Event("change"));
      });
      recalcPercent();
      clearError();
    });
  }

  if (presetHighBtn) {
    presetHighBtn.addEventListener("click", () => {
      ageInput.value = 22;
      incomeInput.value = 25000;
      ownershipInput.value = "RENT";
      empInput.value = 1;
      intentInput.value = "DEBTCONSOLIDATION";
      gradeInput.value = "D";
      amountInput.value = 20000;
      intRateInput.value = 16.5;
      defaultInput.value = "Y";
      credHistInput.value = 2;
      [sliderAge, sliderEmp, sliderRate, sliderCredHist].forEach((s) => {
        if (s) s.dispatchEvent(new Event("change"));
      });
      recalcPercent();
      clearError();
    });
  }

  // ============================================================
  // Helpers & Animations
  // ============================================================
  function setLoading(isLoading) {
    submitBtn.disabled = isLoading;
    submitBtn.classList.toggle("loading", isLoading);
    const label = submitBtn.querySelector(".btn-label");
    if (label) {
      label.textContent = isLoading ? "Computing Risk Vector…" : "Assess Credit Risk";
    }
  }

  function showError(message) {
    errorNote.textContent = message;
    errorNote.hidden = false;
  }

  function clearError() {
    errorNote.hidden = true;
    errorNote.textContent = "";
  }

  function animateNumber(el, from, to, duration) {
    const start = performance.now();
    function tick(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (to - from) * eased;
      el.textContent = value.toFixed(1);
      if (t < 1) requestAnimationFrame(tick);
      else el.textContent = to.toFixed(1);
    }
    requestAnimationFrame(tick);
  }

  // ============================================================
  // Shockwave Particle Burst for Verdict Stamp
  // ============================================================
  function triggerVerdictShockwave(isHighRisk) {
    const shockCanvas = document.getElementById("verdictShockwave");
    if (!shockCanvas) return;
    const sCtx = shockCanvas.getContext("2d");
    shockCanvas.width = window.innerWidth;
    shockCanvas.height = window.innerHeight;

    const particles = [];
    const color = isHighRisk ? "#F43F5E" : "#10B981";
    const count = 40;
    const originX = window.innerWidth / 2;
    const originY = window.innerHeight * 0.45;

    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 8 + 3;
      particles.push({
        x: originX,
        y: originY,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        radius: Math.random() * 4 + 2,
        life: 1,
        decay: Math.random() * 0.03 + 0.015,
      });
    }

    function renderParticles() {
      sCtx.clearRect(0, 0, shockCanvas.width, shockCanvas.height);
      let alive = false;
      for (const p of particles) {
        if (p.life > 0) {
          alive = true;
          p.x += p.vx;
          p.y += p.vy;
          p.life -= p.decay;
          sCtx.beginPath();
          sCtx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
          sCtx.fillStyle = color;
          sCtx.globalAlpha = p.life;
          sCtx.fill();
        }
      }
      if (alive) {
        requestAnimationFrame(renderParticles);
      } else {
        sCtx.clearRect(0, 0, shockCanvas.width, shockCanvas.height);
      }
    }
    requestAnimationFrame(renderParticles);
  }

  // ============================================================
  // SHAP Waterfall Bar Visualization
  // ============================================================
  function generateShapFactors(payload, isHighRisk) {
    if (!shapFactors) return;
    shapFactors.innerHTML = "";

    const factors = [];
    const ratio = payload.loan_percent_income;

    // Debt burden
    if (ratio > 0.3) {
      factors.push({
        title: `High Debt Burden Ratio (${(ratio * 100).toFixed(0)}% of income)`,
        score: `+${(ratio * 0.8).toFixed(2)} log-odds`,
        pct: Math.min(100, Math.round(ratio * 120)),
        isRisk: true,
      });
    } else {
      factors.push({
        title: `Prudent Debt-to-Income (${(ratio * 100).toFixed(0)}%)`,
        score: `-${(0.4 - ratio).toFixed(2)} log-odds`,
        pct: Math.min(100, Math.round((0.35 - ratio) * 150)),
        isRisk: false,
      });
    }

    // Default history
    if (payload.cb_person_default_on_file === "Y") {
      factors.push({
        title: "Prior Credit Delinquency on File",
        score: "+0.85 log-odds",
        pct: 88,
        isRisk: true,
      });
    } else {
      factors.push({
        title: "Clean Bureau History (0 Prior Defaults)",
        score: "-0.65 log-odds",
        pct: 75,
        isRisk: false,
      });
    }

    // Loan Grade & Interest Rate
    if (["E", "F", "G"].includes(payload.loan_grade) || payload.loan_int_rate > 15) {
      factors.push({
        title: `High Interest (${payload.loan_int_rate}%) & Grade ${payload.loan_grade}`,
        score: "+0.54 log-odds",
        pct: 68,
        isRisk: true,
      });
    } else if (["A", "B"].includes(payload.loan_grade)) {
      factors.push({
        title: `Prime Loan Grade ${payload.loan_grade} (${payload.loan_int_rate}%)`,
        score: "-0.48 log-odds",
        pct: 62,
        isRisk: false,
      });
    }

    // Employment Tenure
    if (payload.person_emp_length >= 4) {
      factors.push({
        title: `Stable Employment Tenure (${payload.person_emp_length} yrs)`,
        score: "-0.32 log-odds",
        pct: 50,
        isRisk: false,
      });
    } else if (payload.person_emp_length < 1) {
      factors.push({
        title: `Limited Employment Vintage (${payload.person_emp_length} yrs)`,
        score: "+0.28 log-odds",
        pct: 42,
        isRisk: true,
      });
    }

    factors.forEach((f, index) => {
      const row = document.createElement("div");
      row.className = "shap-row";
      row.style.animation = `slideFadeUp 0.5s ease ${index * 0.1}s both`;

      row.innerHTML = `
        <div class="shap-row-header">
          <span class="shap-row-title">${f.title}</span>
          <span class="shap-row-score ${f.isRisk ? "red" : "green"}">${f.score}</span>
        </div>
        <div class="shap-track-wrapper">
          <div class="shap-bar ${f.isRisk ? "bar-risk" : "bar-safe"}" id="shapBar_${index}"></div>
        </div>
      `;
      shapFactors.appendChild(row);

      // Trigger animated width expansion
      setTimeout(() => {
        const bar = document.getElementById(`shapBar_${index}`);
        if (bar) bar.style.width = `${f.pct}%`;
      }, 50 + index * 80);
    });
  }

  // ============================================================
  // Render Verdict
  // ============================================================
  function renderVerdict(data, payload) {
    const probabilityPct = data.default_probability * 100;
    const thresholdPct = data.threshold * 100;
    const isHighRisk = data.default_prediction === 1;

    verdict.hidden = false;
    verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Laser scanner sweep animation
    if (laserScanner) {
      laserScanner.classList.remove("scanning");
      void laserScanner.offsetWidth;
      laserScanner.classList.add("scanning");
    }

    // Gauge Fill & Colors
    const offset = GAUGE_CIRCUMFERENCE * (1 - probabilityPct / 100);
    const gradStop1 = document.getElementById("gradStop1");
    const gradStop2 = document.getElementById("gradStop2");

    if (gradStop1 && gradStop2) {
      if (isHighRisk) {
        gradStop1.setAttribute("stop-color", "#F43F5E");
        gradStop2.setAttribute("stop-color", "#FB7185");
        if (gaugeHalo) {
          gaugeHalo.style.background = "radial-gradient(circle, rgba(244, 63, 94, 0.35) 0%, transparent 65%)";
        }
      } else {
        gradStop1.setAttribute("stop-color", "#10B981");
        gradStop2.setAttribute("stop-color", "#06B6D4");
        if (gaugeHalo) {
          gaugeHalo.style.background = "radial-gradient(circle, rgba(16, 185, 129, 0.35) 0%, transparent 65%)";
        }
      }
    }

    requestAnimationFrame(() => {
      gaugeFill.style.strokeDashoffset = offset;
    });

    // Threshold tick & legend
    gaugeThreshold.style.transform = `rotate(${thresholdPct * 3.6}deg)`;
    if (legendThreshold) {
      legendThreshold.textContent = `${thresholdPct.toFixed(1)}%`;
    }

    // Number readout
    animateNumber(probNumber, 0, probabilityPct, 800);

    // Audio Cue
    if (isHighRisk) {
      playAlertSound();
    } else {
      playSuccessSound();
    }

    // Stamp badge slam
    stampBadge.classList.remove("stamp--in", "risk-high");
    void stampBadge.offsetWidth;
    if (isHighRisk) {
      stampBadge.classList.add("risk-high");
      stampText.textContent = "HIGH RISK";
    } else {
      stampText.textContent = "LOW RISK";
    }
    requestAnimationFrame(() => stampBadge.classList.add("stamp--in"));

    // Shockwave particles
    triggerVerdictShockwave(isHighRisk);

    // Fact Metrics
    factProb.textContent = `${probabilityPct.toFixed(2)}%`;
    factThreshold.textContent = `${thresholdPct.toFixed(2)}%`;
    factResult.textContent = data.Result;

    if (probProgFill) probProgFill.style.width = `${Math.min(100, probabilityPct)}%`;
    if (threshProgFill) threshProgFill.style.width = `${Math.min(100, thresholdPct)}%`;

    if (factSub && decisionPill) {
      if (isHighRisk) {
        factSub.textContent = "Escalate for manual secondary review";
        decisionPill.textContent = "Adverse Action";
        decisionPill.style.color = "var(--risk-high)";
        decisionPill.style.background = "rgba(244, 63, 94, 0.15)";
      } else {
        factSub.textContent = "Automatic Tier-1 Fast-Track Approval";
        decisionPill.textContent = "Approved";
        decisionPill.style.color = "var(--risk-low)";
        decisionPill.style.background = "rgba(16, 185, 129, 0.15)";
      }
    }

    // SHAP Waterfall
    generateShapFactors(payload, isHighRisk);

    // Sync What-If initial values
    if (simAmntSlider) {
      simAmntSlider.value = payload.loan_amnt;
      if (simAmntVal) simAmntVal.textContent = `₹${Number(payload.loan_amnt).toLocaleString()}`;
    }
    if (simRateSlider) {
      simRateSlider.value = payload.loan_int_rate;
      if (simRateVal) simRateVal.textContent = `${payload.loan_int_rate}%`;
    }
    if (simIncomeSlider) {
      simIncomeSlider.value = payload.person_income;
      if (simIncomeVal) simIncomeVal.textContent = `₹${Number(payload.person_income).toLocaleString()}`;
    }
  }

  // ============================================================
  // Interactive "What-If" Sensitivity Simulator
  // ============================================================
  if (whatifToggle && whatifBody && whatifBtn) {
    whatifToggle.addEventListener("click", () => {
      const isHidden = whatifBody.hidden;
      whatifBody.hidden = !isHidden;
      whatifToggle.classList.toggle("open", !isHidden);
      const span = whatifBtn.querySelector("span");
      if (span) span.textContent = isHidden ? "Close Simulator" : "Open Simulator";
    });
  }

  if (simAmntSlider) {
    simAmntSlider.addEventListener("input", () => {
      if (simAmntVal) simAmntVal.textContent = `₹${Number(simAmntSlider.value).toLocaleString()}`;
    });
  }
  if (simRateSlider) {
    simRateSlider.addEventListener("input", () => {
      if (simRateVal) simRateVal.textContent = `${simRateSlider.value}%`;
    });
  }
  if (simIncomeSlider) {
    simIncomeSlider.addEventListener("input", () => {
      if (simIncomeVal) simIncomeVal.textContent = `₹${Number(simIncomeSlider.value).toLocaleString()}`;
    });
  }

  if (applyWhatIfBtn) {
    applyWhatIfBtn.addEventListener("click", () => {
      if (simAmntSlider) amountInput.value = simAmntSlider.value;
      if (simRateSlider) intRateInput.value = simRateSlider.value;
      if (simIncomeSlider) incomeInput.value = simIncomeSlider.value;
      recalcPercent();
      submitBtn.click();
    });
  }

  // ============================================================
  // Form Submit Action
  // ============================================================
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    clearError();
    setLoading(true);

    const payload = {
      person_age: parseInt(ageInput.value, 10),
      person_income: parseFloat(incomeInput.value),
      person_home_ownership: ownershipInput.value,
      person_emp_length: parseFloat(empInput.value),
      loan_intent: intentInput.value,
      loan_grade: gradeInput.value,
      loan_amnt: parseFloat(amountInput.value),
      loan_int_rate: parseFloat(intRateInput.value),
      loan_percent_income: parseFloat(percentInput.value),
      cb_person_default_on_file: defaultInput.value,
      cb_person_cred_hist_length: parseInt(credHistInput.value, 10),
    };

    try {
      const res = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => null);
        const detail = body && body.detail ? JSON.stringify(body.detail) : `HTTP ${res.status}`;
        throw new Error(detail);
      }

      const data = await res.json();
      renderVerdict(data, payload);
    } catch (err) {
      showError(`Could not evaluate application: ${err.message || "Ensure server is running."}`);
    } finally {
      setLoading(false);
    }
  });

  // ============================================================
  // Demo Query Params
  // ============================================================
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("demo") === "low") {
    if (presetLowBtn) presetLowBtn.click();
    setTimeout(() => submitBtn.click(), 400);
  } else if (urlParams.get("demo") === "high") {
    if (presetHighBtn) presetHighBtn.click();
    setTimeout(() => submitBtn.click(), 400);
  }
})();
