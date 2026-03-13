import pandas as pd
from app.domain.interfaces.eeg_reader_interface import EegReaderInterface


class CsvEegReader(EegReaderInterface):
    """Reader for .csv EEG files"""

    def read(self, file_path: str) -> pd.DataFrame:
        """
        Read a CSV file and validate required columns.
        
        Args:
            file_path: Path to the .csv file
            
        Returns:
            pd.DataFrame: DataFrame with only required columns
        """
        df = pd.read_csv(file_path)
        return self._validate_and_filter_columns(df)
