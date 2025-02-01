from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
import imutils
from skimage.metrics import structural_similarity as compare_ssim

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  # ✅ Allow all origins

@app.route('/compare-images', methods=['POST'])
def compare_images():
    try:
        # Get uploaded images
        file1 = request.files.get('image1')
        file2 = request.files.get('image2')

        if not file1 or not file2:
            return jsonify({"error": "Both image1 and image2 are required"}), 400

        # Convert to OpenCV images
        img1 = cv2.imdecode(np.frombuffer(file1.read(), np.uint8), cv2.IMREAD_COLOR)
        img2 = cv2.imdecode(np.frombuffer(file2.read(), np.uint8), cv2.IMREAD_COLOR)

        # Resize images
        img1 = cv2.resize(img1, (600, 360))
        img2 = cv2.resize(img2, (600, 360))

        # Convert to grayscale
        gray1 = cv2.cvtColor(img1, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2, cv2.COLOR_BGR2GRAY)

        # Compute Structural Similarity Index (SSIM)
        (similarity, diff) = compare_ssim(gray1, gray2, full=True)
        difference_percentage = (1 - similarity) * 100

        return jsonify({
            "similarity": round(similarity, 2),
            "differencePercentage": round(difference_percentage, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)  # ✅ Run on 127.0.0.1
