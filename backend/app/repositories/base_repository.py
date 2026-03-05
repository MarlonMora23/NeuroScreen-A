"""
Repositorio base para operaciones CRUD comunes.
"""

from typing import TypeVar, Generic, Optional, List, Dict, Any
from sqlalchemy.orm import Session
from ..logging_config import get_technical_logger
from ..audit import log_tech

T = TypeVar("T")  # Tipo genérico para modelos

technical_logger = get_technical_logger()


class BaseRepository(Generic[T]):
    """
    Repositorio genérico para operaciones CRUD básicas.
    """
    
    def __init__(self, db_session: Session, model_class: type[T]):
        self.db = db_session
        self.model = model_class
    
    def create(self, **kwargs) -> T:
        """Crea una nueva instancia del modelo."""
        try:
            instance = self.model(**kwargs)
            self.db.add(instance)
            self.db.commit()
            log_tech.info(f"Created {self.model.__name__}", {"id": getattr(instance, "id")})
            return instance
        except Exception as e:
            self.db.rollback()
            log_tech.error(f"Error creating {self.model.__name__}", {"error": str(e)})
            raise
    
    def get_by_id(self, id: Any) -> Optional[T]:
        """Obtiene una instancia por ID."""
        try:
            return self.db.query(self.model).filter(self.model.id == id).first()
        except Exception as e:
            log_tech.error(f"Error fetching {self.model.__name__} by ID", {"error": str(e)})
            raise
    
    def get_all(self, limit: Optional[int] = None, offset: int = 0) -> List[T]:
        """Obtiene todas las instancias."""
        try:
            query = self.db.query(self.model).offset(offset)
            if limit:
                query = query.limit(limit)
            return query.all()
        except Exception as e:
            log_tech.error(f"Error fetching all {self.model.__name__}", {"error": str(e)})
            raise
    
    def update(self, id: Any, **kwargs) -> Optional[T]:
        """Actualiza una instancia."""
        try:
            instance = self.get_by_id(id)
            if not instance:
                return None
            
            for key, value in kwargs.items():
                if hasattr(instance, key):
                    setattr(instance, key, value)
            
            self.db.commit()
            log_tech.info(f"Updated {self.model.__name__}", {"id": id})
            return instance
        except Exception as e:
            self.db.rollback()
            log_tech.error(f"Error updating {self.model.__name__}", {"error": str(e)})
            raise
    
    def delete(self, id: Any) -> bool:
        """Elimina una instancia."""
        try:
            instance = self.get_by_id(id)
            if not instance:
                return False
            
            self.db.delete(instance)
            self.db.commit()
            log_tech.info(f"Deleted {self.model.__name__}", {"id": id})
            return True
        except Exception as e:
            self.db.rollback()
            log_tech.error(f"Error deleting {self.model.__name__}", {"error": str(e)})
            raise
