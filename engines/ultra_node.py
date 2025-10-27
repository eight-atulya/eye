from typing import Any, Dict
from .base import EngineNode

class UltraNode(EngineNode):
    name = "ultra_node"

    def __init__(self):
        self.loaded = False

    def load(self, weights_path: str) -> None:
        self.loaded = True

    def infer(self, input_path: str) -> Dict[str, Any]:
        if not self.loaded:
            raise RuntimeError("Model not loaded")
        return {"input": input_path, "detections": []}
