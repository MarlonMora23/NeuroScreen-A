FROM python:3.11-slim

# bash + gosu en un solo layer
RUN apt-get update \
    && apt-get install -y --no-install-recommends bash gosu \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    && pip install --no-cache-dir gunicorn==23.0.0

# Crear usuario sin home directory innecesario
RUN groupadd -r appuser && useradd -r -g appuser -d /app appuser

COPY . .

RUN chmod +x ./entrypoint.sh \
    # Permisos sobre el código (no sobre uploads, que viene de volumen)
    && chown -R appuser:appuser /app \
    # Crear directorio uploads dentro de la imagen como fallback
    && mkdir -p /app/uploads/eeg \
    && chown -R appuser:appuser /app/uploads

ENV PATH=/app/.local/bin:$PATH

EXPOSE 5000

ENTRYPOINT ["./entrypoint.sh"]
CMD ["gunicorn", "run:app", "--bind", "0.0.0.0:5000", "--workers", "2", "--timeout", "120"]