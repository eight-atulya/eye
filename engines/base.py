from abc import ABC, abstractmethod
from typing import Any, Dict

class EngineNode(ABC):
    name: str = "base"

    @abstractmethod
    def load(self, weights_path: str) -> None:
        ...

    @abstractmethod
    def infer(self, input_path: str) -> Dict[str, Any]:
        ...
