# EEG Reader Architecture

Este módulo proporciona una arquitectura extensible para leer archivos EEG en múltiples formatos.

## Formatos Soportados

- **.parquet**: Formato columnar eficiente
- **.csv**: Valores separados por comas
- **.json**: Formato JSON (array de objetos o con key wrapper)
- **.edf**: European Data Format (requiere `pip install mne`)

## Columnas Requeridas

Independientemente del formato de entrada, todos los archivos DEBEN contener las siguientes columnas:
- `channel`: Nombre del canal EEG (e.g., "Fp1", "F3", etc.)
- `trial`: ID del trial/sesión
- `value`: Valor de amplitud del signal en microvolts
- `sample`: Índice de muestra temporal

## Flujo de Procesamiento

1. **Validación de extensión**: `eeg_record_service` valida que la extensión esté permitida
2. **Lectura y validación**: La `EegReaderFactory` selecciona el reader apropiado
3. **Filtrado de columnas**: Se extraen solo las 4 columnas requeridas
4. **Guardado optimizado**: Se guarda como parquet (optimización de espacio)
5. **Limpieza**: Se elimina el archivo original

## Uso

### Leer un archivo EEG

```python
from app.domain.reader.eeg_reader_factory import EegReaderFactory

# Automáticamente selecciona el reader correcto
reader = EegReaderFactory.get_reader("data/patient_eeg.csv")
df = reader.read("data/patient_eeg.csv")

# df ahora contiene solo: ['channel', 'trial', 'value', 'sample']
```

### Crear un nuevo formato

1. Implementar la interfaz `EegReaderInterface`
2. Agregar la clase al mapeo en `EegReaderFactory.READERS`

```python
# app/domain/reader/my_format_reader.py
from app.domain.interfaces.eeg_reader_interface import EegReaderInterface

class MyFormatEegReader(EegReaderInterface):
    def read(self, file_path: str) -> pd.DataFrame:
        # Lógica para leer el formato
        df = ...
        return self._validate_and_filter_columns(df)
```

## Beneficios

✅ **Escalabilidad**: Soporta múltiples formatos sin cambiar el código principal
✅ **Validación centralizda**: Garantiza columnas consistentes
✅ **Optimización de almacenamiento**: Guarda solo datos necesarios (4 columnas vs original)
✅ **Mantenibilidad**: Cada formato tiene su propio módulo
✅ **Robustez**: Errores descriptivos para columnas faltantes
