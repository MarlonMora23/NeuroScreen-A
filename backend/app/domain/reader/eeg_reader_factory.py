import os
from app.domain.interfaces.eeg_reader_interface import EegReaderInterface
from app.domain.reader.parquet_reader import ParquetEegReader
from app.domain.reader.csv_reader import CsvEegReader
from app.domain.reader.json_reader import JsonEegReader
from app.domain.reader.edf_reader import EdfEegReader


class EegReaderFactory:
    """Factory for creating appropriate EEG readers based on file extension"""
    
    # Mapping of file extensions to reader classes
    READERS = {
        '.parquet': ParquetEegReader,
        '.csv': CsvEegReader,
        '.json': JsonEegReader,
        '.edf': EdfEegReader,
    }
    
    @classmethod
    def get_reader(cls, file_path: str) -> EegReaderInterface:
        """
        Get the appropriate reader for a file.
        
        Args:
            file_path: Path to the EEG file
            
        Returns:
            EegReaderInterface: Reader instance for the file type
            
        Raises:
            ValueError: If file extension is not supported
        """
        _, ext = os.path.splitext(file_path)
        ext = ext.lower()
        
        if ext not in cls.READERS:
            supported = ', '.join(cls.READERS.keys())
            raise ValueError(
                f"Unsupported file format: {ext}. "
                f"Supported formats: {supported}"
            )
        
        reader_class = cls.READERS[ext]
        return reader_class()
    
    @classmethod
    def get_supported_extensions(cls) -> list[str]:
        """Get list of supported file extensions"""
        return list(cls.READERS.keys())
