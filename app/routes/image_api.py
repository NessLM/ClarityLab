
import io
import json

import cv2
from flask import Blueprint, jsonify, request, send_file

from app.services.image_utils import read_uploaded_image
from app.services.quality_checker import analyze_quality
from app.services.recommendation import get_recommendations
from app.services.photo_fix import photo_fix
from app.services.docu_clear import docu_clear
from app.services.stencil_maker import stencil_maker


image_api_bp = Blueprint(
    "image_api",
    __name__,
    url_prefix="/api"
)


@image_api_bp.route("/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "success",
        "application": "ClarityLab",
        "message": "Flask API is running"
    })


@image_api_bp.route("/quality", methods=["POST"])
def check_quality():
    upload = request.files.get("image")

    try:
        image = read_uploaded_image(upload)

        quality = analyze_quality(image)
        recommendations = get_recommendations(quality)

        height, width = image.shape[:2]

        return jsonify({
            "status": "success",
            "filename": upload.filename,
            "width": width,
            "height": height,
            "quality": quality,
            "recommendations": recommendations
        })

    except ValueError as error:
        return jsonify({
            "status": "error",
            "message": str(error)
        }), 400


@image_api_bp.route("/photo-fix", methods=["POST"])
def transform_photo():
    try:
        image = read_uploaded_image(request.files.get("image"))
        result, settings = photo_fix(image, request.form)
        ok, encoded = cv2.imencode(".jpg", result, [cv2.IMWRITE_JPEG_QUALITY, 90])
        if not ok:
            return jsonify(status="error", message="Hasil gambar tidak dapat dibuat. Coba lagi."), 500
        # Keep binary responses below the planned serverless hosting payload limit.
        if encoded.nbytes > 4 * 1024 * 1024:
            return jsonify(status="error", message="Hasil terlalu besar. Perkecil resolusi gambar lalu coba lagi."), 413
        response = send_file(io.BytesIO(encoded.tobytes()), mimetype="image/jpeg", as_attachment=True, download_name="claritylab-photofix.jpg", max_age=0)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-PhotoFix-Settings"] = json.dumps(settings)
        return response
    except ValueError as error:
        return jsonify(status="error", message=str(error)), 400


@image_api_bp.route("/docu-clear", methods=["POST"])
def transform_document():
    try:
        image = read_uploaded_image(request.files.get("image"))
        result, settings = docu_clear(image, request.form)
        ok, encoded = cv2.imencode(".png", result)
        if not ok:
            return jsonify(status="error", message="Hasil dokumen tidak dapat dibuat. Coba lagi."), 500
        if encoded.nbytes > 4 * 1024 * 1024:
            return jsonify(status="error", message="Hasil terlalu besar. Perkecil resolusi gambar lalu coba lagi."), 413
        response = send_file(io.BytesIO(encoded.tobytes()), mimetype="image/png", as_attachment=True, download_name="claritylab-docuclear.png", max_age=0)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-DocuClear-Settings"] = json.dumps(settings)
        return response
    except ValueError as error:
        return jsonify(status="error", message=str(error)), 400


@image_api_bp.route("/stencil-maker", methods=["POST"])
def transform_stencil():
    try:
        image = read_uploaded_image(request.files.get("image"))
        result, settings = stencil_maker(image, request.form)
        ok, encoded = cv2.imencode(".png", result)
        if not ok:
            return jsonify(status="error", message="Hasil stencil tidak dapat dibuat. Coba lagi."), 500
        if encoded.nbytes > 4 * 1024 * 1024:
            return jsonify(status="error", message="Hasil terlalu besar. Perkecil resolusi gambar lalu coba lagi."), 413
        response = send_file(io.BytesIO(encoded.tobytes()), mimetype="image/png", as_attachment=True, download_name="claritylab-stencilmaker.png", max_age=0)
        response.headers["Cache-Control"] = "no-store"
        response.headers["X-StencilMaker-Settings"] = json.dumps(settings)
        return response
    except ValueError as error:
        return jsonify(status="error", message=str(error)), 400
