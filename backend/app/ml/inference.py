import numpy as np
from app.ml.model_loader import get_model
from app.models.prediction_result import AlcoholismRisk
import logging

logger = logging.getLogger(__name__)


def run_inference(X: np.ndarray) -> tuple[AlcoholismRisk, float, float]:
    model = get_model()

    preds = model.predict(X, verbose=0).flatten()
    
    # DEBUG: Log prediction statistics
    mean_prob = float(np.mean(preds))
    std_prob = float(np.std(preds))
    min_prob = float(np.min(preds))
    max_prob = float(np.max(preds))
    
    logger.debug(f"Inference on {len(preds)} samples: "
                f"mean={mean_prob:.4f}, std={std_prob:.4f}, "
                f"range=[{min_prob:.4f}, {max_prob:.4f}]")

    is_alcoholic = mean_prob >= 0.5

    label = AlcoholismRisk.ALCOHOLIC if is_alcoholic else AlcoholismRisk.NON_ALCOHOLIC
    confidence = mean_prob if is_alcoholic else 1.0 - mean_prob

    return label, mean_prob, confidence