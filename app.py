import os
import string
import logging
from flask import Flask, render_template, request, jsonify
import joblib

# Initialize Flask application
app = Flask(__name__)

# Configure application logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

# --------------------------------------------------------------------------
# Load Saved ML Artifacts
# --------------------------------------------------------------------------
ARTIFACT_CANDIDATES = [
    os.path.join(os.path.dirname(__file__), "emotion_artifact.joblib"),
    os.path.join(os.path.dirname(__file__), "emotion_artifacts.joblib"),
    "emotion_artifact.joblib",
    "emotion_artifacts.joblib"
]

artifact_path = None
for candidate in ARTIFACT_CANDIDATES:
    if os.path.exists(candidate):
        artifact_path = candidate
        break

if not artifact_path:
    raise FileNotFoundError(
        "Could not find 'emotion_artifact.joblib' or 'emotion_artifacts.joblib' in project root."
    )

logger.info(f"Loading trained emotion model artifact from: {artifact_path}")
artifact = joblib.load(artifact_path)

# Verify required keys in loaded artifact
required_keys = ['model', 'vectorizer', 'emotion_labels']
for key in required_keys:
    if key not in artifact:
        raise KeyError(f"Artifact at {artifact_path} is missing expected key: '{key}'")

model = artifact['model']
vectorizer = artifact['vectorizer']
emotion_labels = artifact['emotion_labels']
stop_words = set(artifact.get('stop_words') or [])

logger.info(f"Artifact successfully loaded with emotion classes: {emotion_labels}")


# --------------------------------------------------------------------------
# Preprocessing Pipeline (Matches Notebook Training Exactly)
# --------------------------------------------------------------------------
def preprocess_text(text: str, stopwords_set: set) -> str:
    """
    Applies the identical text preprocessing pipeline used during training:
    1. Lowercase conversion
    2. Punctuation removal
    3. Number removal
    4. Non-ASCII / Emoji removal
    5. Stop words removal
    """
    if not isinstance(text, str):
        return ""
    
    # 1. Lowercase
    text = text.lower()
    
    # 2. Remove punctuation
    text = text.translate(str.maketrans('', '', string.punctuation))
    
    # 3. Remove digits / numbers
    text = "".join(c for c in text if not c.isdigit())
    
    # 4. Remove emojis and non-ascii characters
    text = "".join(c for c in text if c.isascii())
    
    # 5. Remove stop words
    words = text.split()
    cleaned_words = [w for w in words if w not in stopwords_set]
    
    return " ".join(cleaned_words)


# --------------------------------------------------------------------------
# Routes
# --------------------------------------------------------------------------
@app.route("/", methods=["GET"])
def index():
    """Renders the main Emotion Classifier interface."""
    return render_template("index.html")


@app.route("/predict", methods=["POST"])
def predict():
    """
    Validates submitted text, cleans input, vectorizes with TfidfVectorizer,
    and returns predicted emotion, confidence, and probability distribution.
    """
    try:
        payload = request.get_json(silent=True)
        if not payload or not isinstance(payload, dict):
            return jsonify({
                "error": "Invalid request payload. Expected JSON body with a 'text' field."
            }), 400

        raw_text = payload.get("text")
        if raw_text is None or not isinstance(raw_text, str):
            return jsonify({
                "error": "The 'text' field is required and must be a string."
            }), 400

        trimmed_text = raw_text.strip()
        if not trimmed_text:
            return jsonify({
                "error": "Input text cannot be empty or solely whitespace."
            }), 400

        if len(trimmed_text) < 3:
            return jsonify({
                "error": "Please enter at least 3 characters for emotion analysis."
            }), 400

        # Preprocess text using exact training logic
        cleaned_text = preprocess_text(trimmed_text, stop_words)

        if not cleaned_text:
            return jsonify({
                "error": "Unable to extract meaningful features from the text. Please enter more descriptive text."
            }), 400

        # Transform features using saved TF-IDF vectorizer
        features = vectorizer.transform([cleaned_text])

        # Predict primary emotion class
        pred_class_raw = model.predict(features)[0]
        pred_class_int = int(pred_class_raw)
        
        # Decode emotion name using saved mapping
        predicted_emotion = str(
            emotion_labels.get(
                pred_class_int, 
                emotion_labels.get(str(pred_class_int), str(pred_class_int))
            )
        ).lower()

        # Extract probability distribution and confidence score
        probabilities = {}
        confidence = 0.0

        if hasattr(model, "predict_proba"):
            probs = model.predict_proba(features)[0]
            confidence = round(float(max(probs)), 4)
            
            for cls_idx, prob in zip(model.classes_, probs):
                cls_int = int(cls_idx)
                label_name = str(
                    emotion_labels.get(
                        cls_int, 
                        emotion_labels.get(str(cls_int), str(cls_int))
                    )
                ).lower()
                probabilities[label_name] = round(float(prob), 4)
        else:
            confidence = 1.0
            probabilities[predicted_emotion] = 1.0

        return jsonify({
            "emotion": predicted_emotion,
            "confidence": confidence,
            "probabilities": probabilities
        }), 200

    except Exception as exc:
        logger.exception("An error occurred during emotion prediction.")
        return jsonify({
            "error": f"An unexpected server error occurred: {str(exc)}"
        }), 500


@app.errorhandler(404)
def handle_not_found(err):
    if request.path.startswith("/predict"):
        return jsonify({"error": "API route not found."}), 404
    return render_template("index.html"), 404


@app.errorhandler(500)
def handle_internal_error(err):
    return jsonify({"error": "Internal server error."}), 500


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True)
