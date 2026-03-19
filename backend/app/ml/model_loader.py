import os
import threading
import numpy as np

# Optimizations to reduce TensorFlow memory footprint
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"  # Reduce TF logging overhead

import tensorflow as tf
from tensorflow import keras

# Configure TensorFlow memory and threading
tf.config.threading.set_intra_op_parallelism_threads(2)
tf.config.threading.set_inter_op_parallelism_threads(2)

_model = None
_model_version = None
_model_lock = threading.Lock()
MODEL_PATH = "dl_models/eegnet_model_balanced.keras"

def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:  # double-checked locking
                np.random.seed(42)
                tf.random.set_seed(42)
                
                _model = keras.models.load_model(MODEL_PATH)
                _model.trainable = False

                # Validar que el input shape es el esperado
                expected_shape = (None, 204, 256, 1)
                actual_shape = tuple(_model.inputs[0].shape)
                if actual_shape != expected_shape:
                    raise RuntimeError(
                        f"Model input shape mismatch: expected {expected_shape}, got {actual_shape}."
                    )
                
                _set_model_version()
                
    return _model


def _set_model_version():
    """Extract and set the model version from MODEL_PATH."""
    global _model_version
    # Get filename without extension (e.g., "eegnet_model.keras" -> "eegnet_model")
    filename = os.path.basename(MODEL_PATH)
    _model_version = os.path.splitext(filename)[0]


def get_model_version() -> str:
    """Get the version/name of the loaded model."""
    # Ensure model is loaded first
    get_model()
    return _model_version