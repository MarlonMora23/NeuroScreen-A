import os
import threading
import numpy as np
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"
import tensorflow as tf
from tensorflow import keras

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
    return _model