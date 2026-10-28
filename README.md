# 🎭 Emotion Classifier — NLP Web Application

A machine learning web application that analyzes the emotional sentiment of written text using Natural Language Processing (NLP). Built with **Python**, **Scikit-Learn**, **Flask**, and modern **HTML/CSS/Vanilla JavaScript**, the application classifies input sentences into six core human emotions: **Joy**, **Sadness**, **Anger**, **Fear**, **Love**, and **Surprise**.

---

## 📌 Table of Contents
- [Project Overview & Key Features](#-project-overview--key-features)
- [NLP Workflow & Model Architecture](#-nlp-workflow--model-architecture)
  - [Dataset & Target Classes](#dataset--target-classes)
  - [Text Preprocessing Pipeline](#text-preprocessing-pipeline)
  - [Feature Extraction (BoW vs. TF-IDF)](#feature-extraction-bow-vs-tf-idf)
  - [Model Training & Performance Comparison](#model-training--performance-comparison)
  - [Selected Model & Final Evaluation](#selected-model--final-evaluation)
  - [Serialization with Joblib](#serialization-with-joblib)
- [System Architecture & Flask Integration](#-system-architecture--flask-integration)
- [API Reference](#-api-reference)
- [Project Structure](#-project-structure)
- [Technologies Used](#-technologies-used)
- [Local Setup & Run Guide](#-local-setup--run-guide)
  - [Windows PowerShell](#windows-powershell)
  - [macOS / Linux / Bash](#macos--linux--bash)
- [Deployment on Render](#-deployment-on-render)
- [Limitations & Ethical Disclaimer](#-limitations--ethical-disclaimer)
- [Credits & Contact](#-credits--contact)

---

## 🚀 Project Overview & Key Features

This project demonstrates an end-to-end Machine Learning lifecycle: from data cleaning, exploratory analysis, and model experimentation in Jupyter Notebook (`NLP_with_ML.ipynb`), to pipeline serialization (`emotion_artifact.joblib`), backend API integration (`app.py`), and a responsive frontend interface.

### Key Highlights
- **Real-Time Classification**: Delivers instant sentiment evaluation with a primary predicted emotion and confidence score.
- **Multi-Class Distribution**: Provides full probability breakdowns across all six emotional dimensions.
- **Interactive 3D-Style Emoji Companion**: Pure CSS-rendered 3D emoji orb featuring physics-inspired cursor tilt, parallax depth highlights, and responsive emotion animations.
- **Dynamic UX States**: Strict mutual exclusivity between application states (Ready/Empty, Loading Shimmer, Result Card, and Error Banners).
- **Interactive Quick Prompts**: Built-in sample chips allowing one-click testing of distinct emotional scenarios.
- **Production-Ready WSGI**: Configured for local development (`Flask`) and scalable deployment (`Gunicorn`).

---

## 🔬 NLP Workflow & Model Architecture

The NLP pipeline was researched, implemented, and evaluated in [`NLP_with_ML.ipynb`](NLP_with_ML.ipynb).

### Dataset & Target Classes
The model was trained on the Emotion dataset (`train.txt`), consisting of **16,000 labeled text samples** split into:
- **Training Set**: 12,800 samples (80%)
- **Test Set**: 3,200 samples (20%)
- **Split Random State**: `42`

The target emotion variable was mapped to numeric labels as follows:

| Numeric ID | Emotion Class | Description |
|:---:|:---:|---|
| **0** | `sadness` | Grief, disappointment, feeling low or hopeless |
| **1** | `anger` | Frustration, annoyance, resentment, irritation |
| **2** | `love` | Affection, warmth, romance, nostalgia |
| **3** | `surprise` | Astonishment, shock, sudden realization, disbelief |
| **4** | `fear` | Anxiety, apprehension, dread, nervousness |
| **5** | `joy` | Happiness, celebration, relief, contentment |

---

### Text Preprocessing Pipeline
Raw text samples were processed through a multi-stage cleaning pipeline to normalize inputs and eliminate non-informative noise:

1. **Case Normalization**: Converts all text to lowercase.
2. **Punctuation Removal**: Strips all standard punctuation marks (`string.punctuation`) via character translation mapping.
3. **Digit Removal**: Filters out numeric digits (`0-9`).
4. **Emoji & Non-ASCII Filtering**: Strips out Unicode emoji symbols and non-ASCII characters to standardize token representations.
5. **Stop Word Removal**: Eliminates 198 common English stopwords (derived from NLTK's `stopwords` corpus, e.g., *"the"*, *"and"*, *"in"*, *"at"*).

> **Pipeline Consistency**: The identical 5-step preprocessing function is implemented in `app.py` to ensure feature parity between offline training and online inference.

---

### Feature Extraction (BoW vs. TF-IDF)
Two primary vectorization methodologies were compared to transform cleaned text into numerical feature matrices:

1. **Bag of Words (`CountVectorizer`)**:
   - Represents documents based on raw word frequency occurrences.
2. **TF-IDF (`TfidfVectorizer`)**:
   - Calculates Term Frequency multiplied by Inverse Document Frequency.
   - Penalizes words that occur uniformly across all documents while emphasizing terms that uniquely characterize specific emotional expressions.

---

### Model Training & Performance Comparison
Two classification algorithms were evaluated across vectorization techniques:

| Model Architecture | Vectorizer | Test Accuracy | Observations |
|---|---|:---:|---|
| **Multinomial Naive Bayes** | Bag of Words (`CountVectorizer`) | **76.81%** | Strong baseline, but lower recall on minor classes (e.g., surprise). |
| **Multinomial Naive Bayes** | TF-IDF (`TfidfVectorizer`) | **66.09%** | Noticeable accuracy drop; uniform frequency assumptions dampened TF-IDF weights. |
| **Logistic Regression** (`max_iter=1000`) | TF-IDF (`TfidfVectorizer`) | **86.28%** | **Best overall performance**. Exceptional separation across high-density classes with well-calibrated probabilities. |

---

### Selected Model & Final Evaluation
The **Logistic Regression model trained with TF-IDF features** achieved an overall test accuracy of **86.28%** across 3,200 unseen test samples.

#### Test Classification Report
```text
              precision    recall  f1-score   support

           0       0.90      0.94      0.92       946   (sadness)
           1       0.90      0.81      0.86       427   (anger)
           2       0.90      0.61      0.73       296   (love)
           3       0.88      0.47      0.61       113   (surprise)
           4       0.86      0.76      0.81       397   (fear)
           5       0.81      0.96      0.88      1021   (joy)

    accuracy                           0.86      3200
   macro avg       0.88      0.76      0.80      3200
weighted avg       0.87      0.86      0.86      3200
```

#### Test Confusion Matrix
```text
           Pred 0   Pred 1   Pred 2   Pred 3   Pred 4   Pred 5
True 0 [    893       13        1        0        7       32 ]  (sadness)
True 1 [     30      347        1        0       12       37 ]  (anger)
True 2 [     12        5      182        0        4       93 ]  (love)
True 3 [     15        0        1       53       24       20 ]  (surprise)
True 4 [     24       17        1        7      302       46 ]  (fear)
True 5 [     15        2       17        0        3      984 ]  (joy)
```

---

### Serialization with Joblib
The trained model components were exported into a single consolidated artifact (`emotion_artifact.joblib`). This artifact contains a Python dictionary with:
- `'model'`: Fitted `LogisticRegression` instance.
- `'vectorizer'`: Fitted `TfidfVectorizer` vocabulary mapping.
- `'emotion_labels'`: Target label decoding dictionary `{0: 'sadness', 1: 'anger', 2: 'love', 3: 'surprise', 4: 'fear', 5: 'joy'}`.
- `'stop_words'`: Serialized set of 198 stopwords (removing the need for external runtime NLTK downloads).

---

## ⚙️ System Architecture & Flask Integration

```
[ User Input in Web Browser ]
             │
             ▼
     [ POST /predict ]
             │
             ▼
[ Flask Controller (app.py) ]
             │
             ├─► Input Validation (empty, non-string, <3 chars)
             ├─► preprocess_text() (lowercase, punctuation, digits, non-ascii, stopwords)
             ├─► vectorizer.transform() (TF-IDF transformation)
             ├─► model.predict() & model.predict_proba()
             └─► Map numeric IDs to emotion string labels
             │
             ▼
   [ JSON Response Body ]
             │
             ▼
[ UI Update (script.js + CSS) ]
  • Morph 3D Emoji Companion
  • Render Confidence Progress Bar
  • Populate Class Distribution Grid
```

---

## 📡 API Reference

### 1. Web Page Route
- **URL**: `/`
- **Method**: `GET`
- **Response**: Renders `templates/index.html`.

### 2. Prediction Route
- **URL**: `/predict`
- **Method**: `POST`
- **Headers**: `Content-Type: application/json`

#### Request Body
```json
{
  "text": "I just received the best news of my career and feel ecstatic!"
}
```

#### Successful Response (`200 OK`)
```json
{
  "emotion": "joy",
  "confidence": 0.6124,
  "probabilities": {
    "anger": 0.0821,
    "fear": 0.0543,
    "joy": 0.6124,
    "love": 0.1712,
    "sadness": 0.0587,
    "surprise": 0.0213
  }
}
```

#### Validation Error Responses (`400 Bad Request`)
```json
{
  "error": "Input text cannot be empty or solely whitespace."
}
```
*Other validation errors include payload missing `"text"`, text with fewer than 3 characters, or text containing no recognizable words after stopword removal.*

---

## 📂 Project Structure

```text
emotion-classifier-app/
├── app.py                     # Flask web server and prediction controller
├── emotion_artifact.joblib    # Serialized model, TF-IDF vectorizer, and label mappings
├── requirements.txt           # Python dependencies pinned for local run & deployment
├── train.txt                  # Labeled training dataset (16,000 samples)
├── NLP_with_ML.ipynb          # Jupyter Notebook with full EDA, preprocessing, and training
│
├── templates/
│   └── index.html             # Semantic HTML5 template with Jinja tags
│
└── static/
    ├── css/
    │   └── style.css          # Responsive styling, 3D orb physics, and state control
    └── js/
        └── script.js          # Client-side validation, tilt tracker, and fetch API
```

---

## 💻 Technologies Used

- **Language**: Python 3.10+ (tested on Python 3.13)
- **Machine Learning & NLP**: Scikit-Learn (`1.6.1`), Joblib (`>=1.3.0`), NumPy (`>=1.26.0`)
- **Web Framework**: Flask (`>=3.0.0`), Jinja2, Werkzeug
- **Production Server**: Gunicorn (`>=21.0.0`)
- **Frontend**: Semantic HTML5, CSS3 Custom Properties (CSS Variables), Vanilla JavaScript (ES6+)

---

## 🛠️ Local Setup & Run Guide

### Windows PowerShell

1. **Clone or navigate into the repository**:
   ```powershell
   cd c:\path\to\emotion-classifier-app
   ```

2. **Create a virtual environment**:
   ```powershell
   python -m venv venv
   ```

3. **Activate the virtual environment**:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
   *(If prompted with an execution policy warning, run `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass` first).*

4. **Install pinned dependencies**:
   ```powershell
   pip install -r requirements.txt
   ```

5. **Run the Flask application**:
   ```powershell
   python app.py
   ```

6. **Open in browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

### macOS / Linux / Bash

1. **Navigate into the repository**:
   ```bash
   cd /path/to/emotion-classifier-app
   ```

2. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Start the application**:
   ```bash
   python app.py
   ```
   *Or with Gunicorn:*
   ```bash
   gunicorn -w 4 -b 127.0.0.1:5000 app:app
   ```

5. **Open in browser**:
   Navigate to [http://127.0.0.1:5000](http://127.0.0.1:5000).

---

## 🌐 Deployment on Render

This project is configured to deploy directly to [Render](https://render.com) as a **Web Service**:

1. **Connect Repository**: Link your GitHub repository to Render.
2. **Environment**: Select `Python 3`.
3. **Build Command**:
   ```bash
   pip install -r requirements.txt
   ```
4. **Start Command**:
   ```bash
   gunicorn app:app
   ```
5. **Plan**: Free or Starter.
6. **Health Check Path** *(Optional)*: `/`

---

## ⚠️ Limitations & Ethical Disclaimer

- **Estimations, Not Diagnostic**: Predictions produced by this application are statistical approximations derived from patterns in written text.
- **Context & Sarcasm**: Like most statistical NLP models, subtle linguistic phenomena such as sarcasm, irony, cultural idioms, or figurative language may lead to misclassifications.
- **Not a Medical Assessment**: This software is built for informational and educational purposes only. It is **not** a psychological, psychiatric, or mental health diagnostic tool.

---

## 👤 Credits & Contact

- **Created by**: Ghulam Murtaza
- **Live Demo**: https://emotion-classifier-nlp.onrender.com
