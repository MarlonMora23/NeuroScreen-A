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
_model_lock = threading.Lock()
MODEL_PATH = "dl_models/eegnet_model.keras"

def get_model():
    global _model
    if _model is None:
        with _model_lock:
            if _model is None:  # double-checked locking
                np.random.seed(42)
                tf.random.set_seed(42)
                
                _model = keras.models.load_model(MODEL_PATH)
                _model.trainable = False

                # Validar que el input layer tiene el nombre esperado
                expected = "input_layer"
                actual = _model.inputs[0].name
                if actual != expected:
                    raise RuntimeError(
                        f"Model input layer name mismatch: expected '{expected}', got '{actual}'. "
                        "Actualiza el nombre en generate_channel_importance()."
                    )
                
    return _model