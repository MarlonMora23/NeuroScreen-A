from abc import ABC, abstractmethod
import pandas as pd

class EegReaderInterface(ABC):
    """Interface for reading EEG data files in different formats"""
    
    # Required columns for EEG inference
    REQUIRED_COLUMNS = {'channel', 'trial', 'value', 'sample'}

    @abstractmethod
    def read(self, file_path: str) -> pd.DataFrame:
        """
        Read EEG file and return DataFrame with only required columns.
        
        Args:
            file_path: Path to the EEG file
            
        Returns:
            pd.DataFrame: DataFrame with columns ['channel', 'trial', 'value', 'sample']
            
        Raises:
            ValueError: If required columns are missing
        """
        pass
    
    def _validate_and_filter_columns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Validate that required columns exist and return DataFrame with only those columns.
        
        Args:
            df: Input DataFrame
            
        Returns:
            pd.DataFrame: DataFrame with only required columns
            
        Raises:
            ValueError: If any required columns are missing
        """
        missing_columns = self.REQUIRED_COLUMNS - set(df.columns)
        if missing_columns:
            raise ValueError(f"Missing required columns: {', '.join(sorted(missing_columns))}")
        
        # Return only required columns
        return df[sorted(self.REQUIRED_COLUMNS)]
