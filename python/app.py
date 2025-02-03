from flask import Flask, request, jsonify
from flask_cors import CORS
import cv2
import numpy as np
from skimage.metrics import structural_similarity as compare_ssim

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})  

def remove_background(image):
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    
    _, binary_image = cv2.threshold(gray, 200, 255, cv2.THRESH_BINARY)
    
    contours, _ = cv2.findContours(binary_image, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    
    mask = np.zeros_like(image)
    cv2.drawContours(mask, contours, -1, (255, 255, 255), thickness=cv2.FILLED)
    
    object_only_image = cv2.bitwise_and(image, mask)
    
    return object_only_image

@app.route('/compare-images', methods=['POST'])
def compare_images():
    try:
        file1 = request.files.get('image1')
        file2 = request.files.get('image2')

        if not file1 or not file2:
            return jsonify({"error": "Both image1 and image2 are required"}), 400

        img1 = cv2.imdecode(np.frombuffer(file1.read(), np.uint8), cv2.IMREAD_COLOR)
        img2 = cv2.imdecode(np.frombuffer(file2.read(), np.uint8), cv2.IMREAD_COLOR)

        img1 = cv2.resize(img1, (600, 360))
        img2 = cv2.resize(img2, (600, 360))

        img1_no_bg = remove_background(img1)
        img2_no_bg = remove_background(img2)

        gray1 = cv2.cvtColor(img1_no_bg, cv2.COLOR_BGR2GRAY)
        gray2 = cv2.cvtColor(img2_no_bg, cv2.COLOR_BGR2GRAY)

        (similarity, diff) = compare_ssim(gray1, gray2, full=True)
        difference_percentage = (1 - similarity) * 100

        return jsonify({
            "similarity": round(similarity, 2),
            "differencePercentage": round(difference_percentage, 2)
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True) 
