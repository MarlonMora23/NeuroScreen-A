import json
import pandas as pd
from app.domain.interfaces.eeg_reader_interface import EegReaderInterface


class JsonEegReader(EegReaderInterface):
    """Reader for .json EEG files"""

    def read(self, file_path: str) -> pd.DataFrame:
        """
        Read a JSON file and validate required columns.
        
        JSON can be in two formats:
        - Array of objects: [{"channel": "Fp1", "trial": 0, "value": 0.5, "sample": 0}, ...]
        - Object with array key: {"data": [...]}
        
        Args:
            file_path: Path to the .json file
            
        Returns:
            pd.DataFrame: DataFrame with only required columns
        """
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        # Handle wrapped data (e.g., {"data": [...]})
        if isinstance(data, dict) and not all(k in self.REQUIRED_COLUMNS for k in data.keys()):
            # Look for a key that contains the actual data
            for key, value in data.items():
                if isinstance(value, list) and len(value) > 0:
                    if isinstance(value[0], dict):
                        data = value
                        break
        
        df = pd.DataFrame(data)
        return self._validate_and_filter_columns(df)
