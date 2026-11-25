
from flask import Flask
from config import Config


def create_app():
    app = Flask(
        __name__,
        template_folder="templates",
        static_folder="../public",
        static_url_path=""
    )

    app.config.from_object(Config)

    # Register halaman website
    from app.routes.pages import pages_bp
    app.register_blueprint(pages_bp)

    # Register API
    from app.routes.image_api import image_api_bp
    app.register_blueprint(image_api_bp)

    return app
