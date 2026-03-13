import pandas as pd
from app.domain.interfaces.eeg_reader_interface import EegReaderInterface


class EdfEegReader(EegReaderInterface):
    """Reader for .edf EEG files"""

    def read(self, file_path: str) -> pd.DataFrame:
        """
        Read an EDF file and validate required columns.
        
        Args:
            file_path: Path to the .edf file
            
        Returns:
            pd.DataFrame: DataFrame with only required columns
            
        Raises:
            ImportError: If mne is not installed
        """
        raise NotImplementedError("EDF reading is not implemented yet.")
