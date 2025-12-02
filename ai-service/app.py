from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image, ImageDraw, ImageFont
import io
import os
import base64
from io import BytesIO
import cv2
import numpy as np
import onnxruntime as ort

app = Flask(__name__)
CORS(app)

# ===== CẤU HÌNH =====
MODEL_PATH = "models/best.onnx"
CONFIDENCE_THRESHOLD = 0.15  # Giảm ngưỡng để giữ lại nhiều phát hiện hơn
IOU_THRESHOLD = 0.45
INPUT_SIZE = 640

print("🚀 Starting ONNX AI Service...")
print(f"📁 Model path: {MODEL_PATH}")

# ===== LOAD ONNX MODEL =====
try:
    if not os.path.exists(MODEL_PATH):
        raise FileNotFoundError(f"Model file not found: {MODEL_PATH}")
    
    session = ort.InferenceSession(MODEL_PATH)
    input_name = session.get_inputs()[0].name
    output_name = session.get_outputs()[0].name
    
    print("✅ ONNX Model loaded successfully!")
    print(f"📊 Input name: {input_name}")
    print(f"📊 Output name: {output_name}")
except Exception as e:
    print(f"❌ Error loading model: {e}")
    session = None

CLASS_NAMES = {
    0: "Phát hiện vùng gãy"
}

def letterbox_image_and_metadata(image, new_size=INPUT_SIZE, color=(114,114,114)):
    img = np.array(image)
    if img.ndim == 2:
        img = cv2.cvtColor(img, cv2.COLOR_GRAY2RGB)
    elif img.shape[2] == 4:
        img = cv2.cvtColor(img, cv2.COLOR_RGBA2RGB)
    
    h0, w0 = img.shape[:2]
    r = float(new_size) / max(h0, w0)
    new_unpad_w, new_unpad_h = int(round(w0 * r)), int(round(h0 * r))
    img_resized = cv2.resize(img, (new_unpad_w, new_unpad_h), interpolation=cv2.INTER_LINEAR)
    
    pad_w = new_size - new_unpad_w
    pad_h = new_size - new_unpad_h
    pad_left = pad_w // 2
    pad_top = pad_h // 2
    pad_right = pad_w - pad_left
    pad_bottom = pad_h - pad_top
    
    img_padded = cv2.copyMakeBorder(img_resized, pad_top, pad_bottom, pad_left, pad_right,
                                    borderType=cv2.BORDER_CONSTANT, value=color)
    
    assert img_padded.shape[0] == new_size and img_padded.shape[1] == new_size
    return img_padded, r, (pad_left, pad_top), (w0, h0)

def preprocess_image(image):
    img_padded, ratio, pad, original_size = letterbox_image_and_metadata(image, INPUT_SIZE)
    img_normalized = img_padded.astype(np.float32) / 255.0
    img_transposed = np.transpose(img_normalized, (2, 0, 1))
    img_batch = np.expand_dims(img_transposed, axis=0)
    meta = {
        'ratio': ratio,
        'pad': pad,
        'original_size': original_size
    }
    return img_batch, meta

def postprocess_output(output, meta, conf_threshold=CONFIDENCE_THRESHOLD, iou_threshold=IOU_THRESHOLD):
    detections = []
    if len(output.shape) == 3:
        output = output[0].T
    
    pad_left, pad_top = meta['pad']
    ratio = meta['ratio']
    orig_w, orig_h = meta['original_size']
    num_classes = len(CLASS_NAMES)
    
    max_coord = float(np.max(output[..., :4])) if output.size > 0 else 0.0
    coords_normalized = max_coord <= 1.0 + 1e-6
    
    for detection in output:
        if len(detection) < 4 + num_classes:
            continue
        
        x_center, y_center, w, h = detection[:4].astype(float)
        class_confs = detection[4:4+num_classes]
        class_id = int(np.argmax(class_confs))
        class_conf = float(class_confs[class_id])
        final_conf = float(class_conf)
        
        if final_conf < conf_threshold:
            continue
        
        if coords_normalized:
            x_center *= INPUT_SIZE
            y_center *= INPUT_SIZE
            w *= INPUT_SIZE
            h *= INPUT_SIZE
        
        x_center_unpad = x_center - pad_left
        y_center_unpad = y_center - pad_top
        
        x_center_orig = x_center_unpad / ratio
        y_center_orig = y_center_unpad / ratio
        w_orig = w / ratio
        h_orig = h / ratio
        
        x1 = x_center_orig - w_orig / 2
        y1 = y_center_orig - h_orig / 2
        x2 = x_center_orig + w_orig / 2
        y2 = y_center_orig + h_orig / 2
        
        x1 = max(0, min(x1, orig_w))
        y1 = max(0, min(y1, orig_h))
        x2 = max(0, min(x2, orig_w))
        y2 = max(0, min(y2, orig_h))
        
        conf_percentage = max(0.0, min(100.0, final_conf * 100.0))
        
        detections.append({
            'class_id': int(class_id),
            'class_name': CLASS_NAMES.get(int(class_id), f"Class {class_id}"),
            'confidence': float(conf_percentage),
            'bbox': [float(x1), float(y1), float(x2), float(y2)]
        })
    
    detections = apply_nms(detections, iou_threshold)
    return detections

def apply_nms(detections, iou_threshold):
    if len(detections) == 0:
        return []
    detections = sorted(detections, key=lambda x: x['confidence'], reverse=True)
    keep = []
    while len(detections) > 0:
        keep.append(detections[0])
        detections = detections[1:]
        if len(detections) == 0:
            break
        new_detections = []
        for det in detections:
            iou = calculate_iou(keep[-1]['bbox'], det['bbox'])
            if iou < iou_threshold:
                new_detections.append(det)
        detections = new_detections
    return keep

def calculate_iou(box1, box2):
    x1_1, y1_1, x2_1, y2_1 = box1
    x1_2, y1_2, x2_2, y2_2 = box2
    x1_i = max(x1_1, x1_2)
    y1_i = max(y1_1, y1_2)
    x2_i = min(x2_1, x2_2)
    y2_i = min(y2_1, y2_2)
    if x2_i < x1_i or y2_i < y1_i:
        return 0.0
    intersection = (x2_i - x1_i) * (y2_i - y1_i)
    area1 = max(0.0, (x2_1 - x1_1) * (y2_1 - y1_1))
    area2 = max(0.0, (x2_2 - x1_2) * (y2_2 - y1_2))
    union = area1 + area2 - intersection
    return intersection / union if union > 0 else 0.0

def draw_boxes_on_image(image, detections):
    img_copy = image.copy()
    draw = ImageDraw.Draw(img_copy)
    try:
        font = ImageFont.truetype("arial.ttf", 20)
    except:
        font = ImageFont.load_default()
    for det in detections:
        x1, y1, x2, y2 = det['bbox']
        confidence = det['confidence']
        draw.rectangle([x1, y1, x2, y2], outline="red", width=3)
        label = f"Phát hiện vùng gãy {confidence:.1f}%"
        draw.text((x1, max(0, y1 - 25)), label, fill="red", font=font)
    return img_copy

def image_to_base64(image):
    buffered = BytesIO()
    image.save(buffered, format="JPEG")
    img_str = base64.b64encode(buffered.getvalue()).decode()
    return f"data:image/jpeg;base64,{img_str}"



# ===== ROUTES =====
@app.route('/', methods=['GET'])
def home():
    """Health check"""
    return jsonify({
        'status': 'running',
        'model_loaded': session is not None,
        'model_type': 'YOLO ONNX Object Detection',
        'model_path': MODEL_PATH,
        'input_size': INPUT_SIZE,
        'classes': CLASS_NAMES,
        'message': 'X-Ray Bone Fracture Detection Service (ONNX)'
    })

@app.route('/predict', methods=['POST'])
def predict():
    """ONNX prediction endpoint"""
    if session is None:
        return jsonify({'error': 'Model not loaded'}), 500
    if 'file' not in request.files:
        return jsonify({'error': 'No file uploaded'}), 400
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'Empty filename'}), 400
    try:
        print(f"📸 Processing: {file.filename}")
        image_bytes = file.read()
        image = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        original_shape = np.array(image).shape
        print(f"🐛 DEBUG - Original image shape: {original_shape}")

        input_data, meta = preprocess_image(image)
        print(f"🐛 DEBUG - Input data shape: {input_data.shape}, meta: {meta}")

        print("🔮 Running ONNX inference...")
        outputs = session.run(None, {input_name: input_data})

        detections = postprocess_output(outputs[0], meta, CONFIDENCE_THRESHOLD, IOU_THRESHOLD)

        has_fracture = len(detections) > 0
        max_confidence = max([d['confidence'] for d in detections]) if detections else 0.0
        print(f"🐛 DEBUG - Max confidence: {max_confidence:.2f}%")

        # ✅ Logic kết quả
        if has_fracture:
            result_text = "Phát hiện vùng gãy"
            details = f"Phát hiện {len(detections)} vùng bất thường"
        else:
            result_text = "Xương bình thường"
            details = "Không phát hiện dấu hiệu xương gãy"
            max_confidence = 0.0

        annotated_image = draw_boxes_on_image(image, detections)
        annotated_base64 = image_to_base64(annotated_image)

        print(f"✅ Detection completed: {len(detections)} objects found")

        formatted_detections = [{
            'class': "Phát hiện vùng gãy",
            'class_id': d['class_id'],
            'confidence': round(d['confidence'], 2),
            'bbox': {
                'x1': d['bbox'][0],
                'y1': d['bbox'][1],
                'x2': d['bbox'][2],
                'y2': d['bbox'][3]
            }
        } for d in detections]

        response = {
            'result': result_text,
            'confidence': round(max_confidence, 2),
            'details': details,
            'total_detections': len(detections),
            'detections': formatted_detections,
            'annotated_image': annotated_base64
        }

        print(f"🐛 DEBUG - Response confidence: {response['confidence']}%")
        return jsonify(response), 200
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({'error': f'Prediction error: {str(e)}'}), 500

@app.route('/test', methods=['POST'])
def test():
    """Test endpoint"""
    if 'file' not in request.files:
        return jsonify({'error': 'No file'}), 400
    file = request.files['file']
    return jsonify({
        'message': 'File received',
        'filename': file.filename,
        'size': f"{len(file.read())} bytes"
    })

# ===== RUN SERVER =====
if __name__ == '__main__':
    print("=" * 60)
    print(" X-Ray Bone Fracture Detection (ONNX) - Fixed mapping")
    print("=" * 60)
    print(f" Server: http://localhost:5000")
    print(f" Input size: {INPUT_SIZE}x{INPUT_SIZE}")
    print(f" Endpoints:")
    print(f"   GET  /          - Health check")
    print(f"   POST /predict   - Bone fracture detection")
    print(f"   POST /test      - Test upload")
    print("=" * 60)
    
    app.run(
        host='0.0.0.0',
        port=5000,
        debug=True,
        threaded=True
    )