<div align="center">

# 💳 Credit Risk Assessment & Explainable AI (XAI)

**A high-precision loan default prediction system backed by XGBoost and SHAP model explainability, served with a fast and intuitive FastAPI web application.**

[![Python](https://img.shields.io/badge/Python-3.10%20%7C%203.11%20%7C%203.12-3776AB?style=flat-square&logo=python&logoColor=white)](https://www.python.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115.0-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![XGBoost](https://img.shields.io/badge/Model-XGBoost-EB6B34?style=flat-square&logo=xgboost&logoColor=white)](https://xgboost.readthedocs.io/)
[![SHAP](https://img.shields.io/badge/Explainability-SHAP-blueviolet?style=flat-square)](https://shap.readthedocs.io/)
[![Deployment](https://img.shields.io/badge/Deploy-Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com/)
[![License](https://img.shields.io/badge/License-MIT-blue?style=flat-square)](LICENSE)

[Live Demo](#-quick-start) • [System Architecture](#-system-architecture) • [Key Features](#-key-features) • [API Reference](#-api-endpoints)

---

</div>

## 📌 Overview

Credit risk evaluation is traditionally viewed as a "black box" where complex algorithmic models make critical financial approvals without clear transparency. 

This project bridges the gap between **predictive accuracy** and **regulatory interpretability** by combining an **XGBoost Classifier** with **SHAP (SHapley Additive exPlanations)**. The system provides real-time default risk predictions alongside interpretable feature attribution for credit officers and applicants.

---

## ✨ Key Features

- **🎯 Optimal Threshold Calibration**: Moves beyond default $0.5$ classification cutoff using empirical threshold optimization (`best_threshold.pkl`) to balance precision and recall.
- **🔍 Explainable AI (XAI)**:
  - **Global Interpretability**: Highlights overarching risk drivers across the portfolio (e.g., loan-to-income ratio, interest rate).
  - **Local Interpretability**: Deconstructs individual loan applications to show exactly why a specific applicant was flagged as High or Low risk.
- **⚡ High-Performance Inference**: Built with **FastAPI** leveraging asynchronous lifespan events for zero-latency model loading and sub-millisecond scoring.
- **🖥️ Responsive UI**: Interactive frontend designed with clean HTML5, CSS3, and JavaScript, served directly by FastAPI static mounts.
- **🚀 Production Ready**: Container-ready architecture with declarative `render.yaml` configuration.

---

## 🏗️ System Architecture

```
┌─────────────────────┐
│  Applicant Details  │  (Age, Income, Loan Intent, Credit History...)
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│   FastAPI Engine    │  Pydantic Schema Validation & Lifespan Loader
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐      ┌─────────────────────────┐
│  XGBoost Classifier │ ───► │  Threshold Optimizer    │
└──────────┬──────────┘      │  (Dynamic Risk Cutoff)  │
           │                 └────────────┬────────────┘
           ▼                              ▼
┌─────────────────────┐      ┌─────────────────────────┐
│   SHAP Explainer    │ ───► │ Final Decision & Report │
│  (TreeExplainer)    │      │ (High Risk vs Low Risk) │
└─────────────────────┘      └─────────────────────────┘
```

---

## 🧠 Explainability with SHAP

The model utilizes **TreeExplainer** based on game-theoretic Shapley values to allocate credit scores fairly:

$$\phi_i(x) = \sum_{S \subseteq F \setminus \{i\}} \frac{|S|!(|F| - |S| - 1)!}{|F|!} \Big( f(S \cup \{i\}) - f(S) \Big)$$

- **Summary Plots**: Visualize portfolio distribution of feature effects.
- **Waterfall Plots**: Explain a single credit applicant's journey from baseline base value $E[f(x)]$ to the final predicted score $f(x)$.

---

## 📂 Project Structure

```bash
Credit-Risk-Assesment-using-SHAP/
├── static/                         # Frontend assets
│   ├── index.html                  # Loan assessment user interface
│   ├── style.css                   # Glassmorphic UI styling
│   └── script.js                   # Client-side validation & API integration
├── Credit_Risk.ipynb               # EDA, Feature Engineering, Model Training & SHAP analysis
├── credit_risk_dataset.csv         # Lending and borrower demographic dataset
├── credit_risk_model.pkl           # Serialized trained XGBoost model pipeline
├── best_threshold.pkl              # Optimal classification threshold
├── main.py                         # FastAPI backend service & routes
├── requirements.txt                # Python runtime dependencies
├── render.yaml                     # Render deployment configuration
└── README.md                       # Project documentation
```

---

## 🚀 Quick Start

### 1. Clone the Repository
```bash
git clone https://github.com/<your-username>/Credit-Risk-Assesment-using-SHAP.git
cd Credit-Risk-Assesment-using-SHAP
```

### 2. Set Up Virtual Environment
```bash
# Create environment
python3 -m venv .venv

# Activate environment
# On macOS / Linux:
source .venv/bin/activate
# On Windows:
.venv\Scripts\activate
```

### 3. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 4. Launch Application
```bash
uvicorn main:app --reload --port 8000
```

Open your browser and navigate to:
- **Web Interface**: `http://localhost:8000`
- **Interactive OpenAPI Documentation**: `http://localhost:8000/docs`

---

## 📡 API Endpoints

### `POST /predict`

Scores a loan application and classifies borrower risk.

#### **Request Body**
```json
{
  "person_age": 28,
  "person_income": 65000.0,
  "person_home_ownership": "RENT",
  "person_emp_length": 4.0,
  "loan_intent": "PERSONAL",
  "loan_grade": "B",
  "loan_amnt": 12000.0,
  "loan_int_rate": 11.2,
  "loan_percent_income": 0.18,
  "cb_person_default_on_file": "N",
  "cb_person_cred_hist_length": 6
}
```

#### **Response Body**
```json
{
  "default_probability": 0.1428,
  "default_prediction": 0,
  "threshold": 0.285,
  "Result": "Low Risk"
}
```

---

## 📊 Dataset Features

| Feature | Type | Description |
| :--- | :--- | :--- |
| `person_age` | Integer | Age of applicant |
| `person_income` | Float | Annual income ($) |
| `person_home_ownership` | String | Housing status (`RENT`, `OWN`, `MORTGAGE`, `OTHER`) |
| `person_emp_length` | Float | Employment tenure (years) |
| `loan_intent` | String | Intent (`PERSONAL`, `EDUCATION`, `MEDICAL`, `VENTURE`, etc.) |
| `loan_grade` | String | Credit score grade (`A` - `G`) |
| `loan_amnt` | Float | Requested loan amount ($) |
| `loan_int_rate` | Float | Interest rate (%) |
| `loan_percent_income` | Float | Ratio of loan amount to annual income |
| `cb_person_default_on_file` | String | Historical default flag (`Y` / `N`) |
| `cb_person_cred_hist_length` | Integer | Credit history age in years |

---

## 🌐 Deployment (Render)

This repository includes a [`render.yaml`](file:///Users/nihar/Downloads/Credit-Risk-Assesment-using-SHAP/render.yaml) specification for instant zero-configuration deployment:

1. Push your repository to GitHub.
2. Sign in to [Render](https://render.com/).
3. Create a **New Blueprint** and connect this repository.
4. Render will automatically configure dependencies and spin up the Uvicorn web server.

---

## 📄 License

This project is distributed under the MIT License. See [LICENSE](LICENSE) for more details.

---

<div align="center">
  <sub>Engineered with precision for transparent, reliable machine learning in FinTech.</sub>
</div>
