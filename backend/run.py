from app import create_app
from app.extensions import celery
from app.logging_config import add_console_handlers

app = create_app()

# Agregar handlers de consola para ver logs en desarrollo
add_console_handlers(debug=True)

if __name__ == "__main__":
    app.run(debug=True)
