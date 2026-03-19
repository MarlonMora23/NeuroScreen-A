# backend/app/ml/visualization.py

import numpy as np
import tensorflow as tf
from app.ml.eeg_config import CHANNELS, SAMPLING_RATE
from app.ml.model_loader import get_model
from app.domain.reader.eeg_reader_factory import EegReaderFactory

# Posiciones para topomap 2D
EEG_POSITIONS_2D = {

    # Frontal
    "AF7": (-0.55, 0.85),
    "AF8": (0.55, 0.85),

    "F1": (-0.15, 0.65),
    "F2": (0.15, 0.65),
    "F6": (0.65, 0.55),

    "FT7": (-0.85, 0.45),
    "FT8": (0.85, 0.45),

    "FC3": (-0.45, 0.35),
    "FC4": (0.45, 0.35),
    "FCZ": (0.0, 0.40),

    # Central
    "C1": (-0.15, 0.05),
    "C2": (0.15, 0.05),
    "C3": (-0.45, 0.0),
    "C4": (0.45, 0.0),
    "C5": (-0.7, 0.0),

    "CP2": (0.25, -0.25),
    "CP3": (-0.35, -0.25),
    "CP5": (-0.65, -0.25),
    "CP6": (0.65, -0.25),
    "CPZ": (0.0, -0.20),

    # Parietal
    "P1": (-0.15, -0.55),
    "P4": (0.35, -0.60),
    "P5": (-0.45, -0.60),
    "P6": (0.65, -0.55),
    "P7": (-0.75, -0.55),
    "P8": (0.85, -0.50),

    "PO1": (-0.20, -0.80),
    "PO7": (-0.65, -0.75),
    "PO8": (0.65, -0.75),

    # Occipital
    "O1": (-0.30, -0.95),
    "O2": (0.30, -0.95),

    # Temporal
    "T7": (-0.95, 0.0),
    "T8": (0.95, 0.0),
    "TP7": (-0.85, -0.35)
}


def generate_waveforms(
    parquet_path: str,
    trial_index: int = 0,
    win_size: int = 256,
    downsample_factor: int = 1
) -> dict:
    """
    Genera datos de waveform por canal para visualización.
    Retorna solo el primer trial por defecto para mantener payload liviano.

    Returns:
        {
          "timestamps_ms": [0, 3.9, 7.8, ...],   # en ms
          "channels": {
            "Fp1": [0.12, -0.34, ...],
            "F3":  [...],
            ...
          },
          "sampling_rate": 256,
          "duration_ms": 1000.0
        }
    """
    import pandas as pd
    from app.ml.preprocessing import normalize_signal

    df = EegReaderFactory.get_reader(parquet_path).read(parquet_path)
    trials = df["trial"].unique()

    if trial_index >= len(trials):
        trial_index = 0
    trial_data = df[df["trial"] == trials[trial_index]]

    channels_data = {}
    for ch in CHANNELS:
        ch_data = trial_data[trial_data["channel"] == ch].sort_values("sample")
        if ch_data.empty:
            continue
        signal = ch_data["value"].iloc[:win_size].values
        if len(signal) < win_size:
            signal = np.pad(signal, (0, win_size - len(signal)), mode="constant")

        signal = normalize_signal(signal)

        # Downsample si se pide (para reducir payload)
        if downsample_factor > 1:
            signal = signal[::downsample_factor]

        channels_data[ch] = signal.tolist()

    n_samples = win_size // downsample_factor
    fs_effective = SAMPLING_RATE / downsample_factor
    timestamps = [round(i / fs_effective * 1000, 2) for i in range(n_samples)]

    return {
        "timestamps_ms": timestamps,
        "channels": channels_data,
        "sampling_rate": SAMPLING_RATE,
        "duration_ms": round(win_size / SAMPLING_RATE * 1000, 2)
    }


def generate_channel_importance(X: np.ndarray) -> dict:
    """
    Gradient × Input attribution para estimar importancia por canal.

    Input shape:
    (N, C*bands, T, 1)
    """
    model = get_model()
    X_tf = tf.convert_to_tensor(X, dtype=tf.float32)

    with tf.GradientTape() as tape:
        tape.watch(X_tf)

        predictions = model(X_tf, training=False)

        class_idx = int(tf.argmax(predictions[0]).numpy())
        loss = predictions[:, class_idx]

    grads = tape.gradient(loss, X_tf)

    if grads is None:
        raise ValueError(
            "GradientTape returned None gradients. Verifica que el modelo "
            "sea diferenciable y que X_tf esté siendo watched correctamente."
        )

    attribution = (grads * X_tf).numpy()      # (N, C*bands, T, 1)
    attribution = attribution.mean(axis=0)    # (C*bands, T, 1)
    attribution = attribution.mean(axis=1).squeeze()  # (C*bands,)

    n_channels = len(CHANNELS)
    n_bands = 6

    importance = np.array([
        float(attribution[ch * n_bands : ch * n_bands + n_bands].mean())
        for ch in range(n_channels)
    ])

    importance = (importance - importance.min()) / (importance.max() - importance.min() + 1e-8)

    return {
        "channels": list(CHANNELS),
        "importance": importance.tolist(),
        "method": "gradient_input"
    }


def generate_topomap(channel_importance: dict) -> dict:
    """
    Genera datos para topomap 2D basados en importancia de canales.
    El frontend hará el render con D3/Canvas, aquí solo mandamos los datos.

    Returns:
        {
          "electrodes": [
            { "name": "Fp1", "x": -0.308, "y": 0.950, "importance": 0.87 },
            ...
          ],
          "method": "signal_variance"
        }
    """
    channels = channel_importance["channels"]
    importance = channel_importance["importance"]

    electrodes = []
    for ch, imp in zip(channels, importance):
        if ch in EEG_POSITIONS_2D:
            x, y = EEG_POSITIONS_2D[ch]
            electrodes.append({
                "name": ch,
                "x": x,
                "y": y,
                "importance": round(imp, 4)
            })

    return {
        "electrodes": electrodes,
        "method": channel_importance.get("method", "signal_variance")
    }