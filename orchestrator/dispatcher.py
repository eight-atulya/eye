from typing import Dict, Any

class Dispatcher:
    def __init__(self):
        self.routes: Dict[str, str] = {}

    def register(self, task_type: str, engine_name: str) -> None:
        self.routes[task_type] = engine_name

    def resolve(self, task_type: str) -> str:
        return self.routes.get(task_type, "ultra_node")
