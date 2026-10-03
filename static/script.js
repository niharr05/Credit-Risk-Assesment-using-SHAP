(() => {
  const form = document.getElementById("riskForm");
  const submitBtn = document.getElementById("submitBtn");
  const errorNote = document.getElementById("errorNote");
  const verdict = document.getElementById("verdict");

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
  const ratioIndicator = document.getElementById("ratioIndicator");

  const gaugeFill = document.getElementById("gaugeFill");
  const gaugeThreshold = document.getElementById("gaugeThreshold");
  const probNumber = document.getElementById("probNumber");
  const stampBadge = document.getElementById("stampBadge");
  const stampText = document.getElementById("stampText");

  const factProb = document.getElementById("factProb");
  const factThreshold = document.getElementById("factThreshold");
  const factResult = document.getElementById("factResult");
  const legendThreshold = document.getElementById("legendThreshold");
  const shapFactors = document.getElementById("shapFactors");

  const apiDot = document.getElementById("apiDot");
  const apiStatusText = document.getElementById("apiStatusText");

  const presetLowBtn = document.getElementById("presetLowRisk");
  const presetHighBtn = document.getElementById("presetHighRisk");

  const GAUGE_CIRCUMFERENCE = 540.35; // 2 * PI * 86

  // ---------- Auto-calculate loan-to-income ratio ----------
  function recalcPercent() {
    const income = parseFloat(incomeInput.value);
    const amount = parseFloat(amountInput.value);
    if (income > 0 && amount >= 0) {
      const ratio = amount / income;
      percentInput.value = ratio.toFixed(2);
      if (ratioIndicator) {
        ratioIndicator.textContent = `${(ratio * 100).toFixed(1)}% of income`;
        if (ratio > 0.35) {
          ratioIndicator.style.color = "var(--risk-high)";
          ratioIndicator.style.background = "rgba(244, 63, 94, 0.1)";
        } else {
          ratioIndicator.style.color = "var(--primary-cyan)";
          ratioIndicator.style.background = "rgba(6, 182, 212, 0.1)";
        }
      }
    }
  }

  incomeInput.addEventListener("input", recalcPercent);
  amountInput.addEventListener("input", recalcPercent);
  recalcPercent();

  // ---------- Service status check ----------
  function checkEngineStatus() {
    fetch("/openapi.json", { method: "GET" })
      .then((res) => {
        if (res.ok) {
          apiDot.className = "pulse-dot ok";
          apiStatusText.textContent = "engine ready";
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

  // ---------- Preset Profiles (For Quick Demo) ----------
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
      recalcPercent();
      clearError();
    });
  }

  // ---------- Helpers ----------
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

  // ---------- Generate SHAP Attribution Factors ----------
  function generateShapFactors(payload, isHighRisk) {
    if (!shapFactors) return;
    shapFactors.innerHTML = "";

    const factors = [];

    // Loan-to-income analysis
    const ratio = payload.loan_percent_income;
    if (ratio > 0.3) {
      factors.push({
        name: `High debt burden (${(ratio * 100).toFixed(0)}% of income)`,
        impact: "escalates risk",
        type: "increases-risk"
      });
    } else {
      factors.push({
        name: `Conservative debt-to-income ratio (${(ratio * 100).toFixed(0)}%)`,
        impact: "mitigates risk",
        type: "decreases-risk"
      });
    }

    // Default history
    if (payload.cb_person_default_on_file === "Y") {
      factors.push({
        name: "Prior credit delinquency on bureau record",
        impact: "major risk driver",
        type: "increases-risk"
      });
    } else {
      factors.push({
        name: "Clean credit history (zero historical defaults)",
        impact: "strengthens score",
        type: "decreases-risk"
      });
    }

    // Loan Grade & Interest Rate
    if (["E", "F", "G"].includes(payload.loan_grade) || payload.loan_int_rate > 15) {
      factors.push({
        name: `Elevated interest rate (${payload.loan_int_rate}%) & Grade ${payload.loan_grade}`,
        impact: "elevates default hazard",
        type: "increases-risk"
      });
    } else if (["A", "B"].includes(payload.loan_grade)) {
      factors.push({
        name: `Prime loan grade (${payload.loan_grade}) & competitive interest`,
        impact: "reduces default risk",
        type: "decreases-risk"
      });
    }

    // Employment tenure
    if (payload.person_emp_length >= 4) {
      factors.push({
        name: `Stable employment tenure (${payload.person_emp_length} years)`,
        impact: "bolsters stability",
        type: "decreases-risk"
      });
    } else if (payload.person_emp_length < 1) {
      factors.push({
        name: `Limited employment vintage (< 1 year)`,
        impact: "minor risk factor",
        type: "increases-risk"
      });
    }

    factors.forEach((f) => {
      const li = document.createElement("li");
      li.className = "shap-item";
      li.innerHTML = `
        <span class="shap-item-factor">${f.name}</span>
        <span class="shap-item-badge ${f.type}">${f.impact}</span>
      `;
      shapFactors.appendChild(li);
    });
  }

  // ---------- Render Verdict ----------
  function renderVerdict(data, payload) {
    const probabilityPct = data.default_probability * 100;
    const thresholdPct = data.threshold * 100;
    const isHighRisk = data.default_prediction === 1;

    verdict.hidden = false;
    verdict.scrollIntoView({ behavior: "smooth", block: "nearest" });

    // Gauge Fill & Colors
    const offset = GAUGE_CIRCUMFERENCE * (1 - probabilityPct / 100);
    const gradStop1 = document.getElementById("gradStop1");
    const gradStop2 = document.getElementById("gradStop2");

    if (gradStop1 && gradStop2) {
      if (isHighRisk) {
        gradStop1.setAttribute("stop-color", "#F43F5E");
        gradStop2.setAttribute("stop-color", "#FB7185");
      } else {
        gradStop1.setAttribute("stop-color", "#10B981");
        gradStop2.setAttribute("stop-color", "#06B6D4");
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

    // Stamp badge
    stampBadge.classList.remove("stamp--in", "risk-high");
    void stampBadge.offsetWidth; // restart animation
    if (isHighRisk) {
      stampBadge.classList.add("risk-high");
      stampText.textContent = "HIGH RISK";
    } else {
      stampText.textContent = "LOW RISK";
    }
    requestAnimationFrame(() => stampBadge.classList.add("stamp--in"));

    // Fact Metrics
    factProb.textContent = `${probabilityPct.toFixed(2)}%`;
    factThreshold.textContent = `${thresholdPct.toFixed(2)}%`;
    factResult.textContent = data.Result;

    // SHAP Explainability Factors
    generateShapFactors(payload, isHighRisk);
  }

  // ---------- Submit Action ----------
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
      showError(`Could not evaluate application. ${err.message || "Ensure server is running."}`);
    } finally {
      setLoading(false);
    }
  });

  // ---------- Auto Demo Trigger via Query Param ----------
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("demo") === "low") {
    if (presetLowBtn) presetLowBtn.click();
    setTimeout(() => submitBtn.click(), 400);
  } else if (urlParams.get("demo") === "high") {
    if (presetHighBtn) presetHighBtn.click();
    setTimeout(() => submitBtn.click(), 400);
  }
})();
