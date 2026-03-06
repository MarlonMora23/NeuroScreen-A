# backend/app/models/prediction_visualization.py

from app.extensions import db
from sqlalchemy.dialects.postgresql import UUID, JSONB
from app.models.base import BaseModel

class PredictionVisualization(BaseModel):
    __tablename__ = "prediction_visualizations"

    prediction_id = db.Column(
        UUID(as_uuid=True),
        db.ForeignKey("prediction_results.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
        index=True
    )

    # Estado del pipeline de visualización
    status = db.Column(
        db.Enum("pending", "processing", "completed", "failed", name="viz_status"),
        default="pending",
        nullable=False
    )

    # Datos serializados como JSONB (eficiente en Postgres)
    waveforms_data = db.Column(JSONB, nullable=True)
    topomap_data = db.Column(JSONB, nullable=True)
    channel_importance_data = db.Column(JSONB, nullable=True)

    error_msg = db.Column(db.Text, nullable=True)
    generated_at = db.Column(db.DateTime, server_default=db.func.now())

    prediction = db.relationship("PredictionResult", back_populates="visualization", uselist=False)