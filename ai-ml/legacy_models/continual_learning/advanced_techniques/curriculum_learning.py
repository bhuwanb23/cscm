"""
Curriculum Learning Strategies for Continual Learning

This module implements optimal data sequencing, difficulty progression,
transfer maximization, and robustness improvement through curriculum
learning for supply chain continual learning scenarios.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable
from collections import deque

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class DifficultyScorer:
    """
    Scores the difficulty of data samples based on various metrics
    including prediction error, uncertainty, and complexity.
    """

    def __init__(self, method: str = 'ensemble_variance'):
        self.method = method
        self.scores: Dict[int, float] = {}

    def score_samples(self, X: np.ndarray, y: np.ndarray,
                      predictions: Optional[np.ndarray] = None) -> np.ndarray:
        n = X.shape[0]
        if self.method == 'prediction_error' and predictions is not None:
            scores = (y - predictions) ** 2
        elif self.method == 'distance_from_mean':
            mean = np.mean(X, axis=0)
            scores = np.sum((X - mean) ** 2, axis=1)
        elif self.method == 'nearest_neighbor':
            from sklearn.neighbors import NearestNeighbors
            nn = NearestNeighbors(n_neighbors=min(5, n))
            nn.fit(X)
            distances, _ = nn.kneighbors(X)
            scores = np.mean(distances, axis=1)
        elif self.method == 'ensemble_variance' and predictions is not None:
            if predictions.ndim > 1:
                scores = np.var(predictions, axis=1)
            else:
                scores = np.ones(n) * 0.1
        else:
            scores = np.random.rand(n) * 0.5 + 0.5

        for i in range(n):
            self.scores[i] = float(scores[i])

        return scores

    def get_difficulty_distribution(self) -> Dict[str, float]:
        if not self.scores:
            return {}
        vals = list(self.scores.values())
        return {
            'mean': float(np.mean(vals)),
            'std': float(np.std(vals)),
            'min': float(np.min(vals)),
            'max': float(np.max(vals)),
        }


class CurriculumScheduler:
    """
    Schedules data presentation order based on difficulty progression,
    starting from easy samples and gradually introducing harder ones.
    """

    def __init__(self,
                 initial_pacing: float = 0.3,
                 pace_growth: float = 0.05,
                 max_pacing: float = 1.0,
                 steps_to_max: int = 100):
        self.pacing = initial_pacing
        self.pace_growth = pace_growth
        self.max_pacing = max_pacing
        self.steps_to_max = steps_to_max
        self.current_step = 0

    def get_pacing(self) -> float:
        progress = min(1.0, self.current_step / max(1, self.steps_to_max))
        self.pacing = 0.3 + progress * 0.7
        self.pacing = min(self.pacing, self.max_pacing)
        return self.pacing

    def schedule_batch(self, X: np.ndarray, y: np.ndarray,
                       difficulties: np.ndarray, batch_size: int) -> Tuple[np.ndarray, np.ndarray]:
        n = X.shape[0]
        pacing = self.get_pacing()
        n_easy = max(1, int(n * (1 - pacing)))

        sorted_indices = np.argsort(difficulties)
        easy_indices = sorted_indices[:n_easy]
        hard_indices = sorted_indices[n_easy:]

        n_batch_hard = max(1, int(batch_size * pacing))
        n_batch_easy = batch_size - n_batch_hard

        selected_easy = np.random.choice(easy_indices, size=min(n_batch_easy, len(easy_indices)), replace=False)
        if len(hard_indices) > 0 and n_batch_hard > 0:
            n_hard = min(n_batch_hard, len(hard_indices))
            selected_hard = np.random.choice(hard_indices, size=n_hard, replace=False)
            selected = np.concatenate([selected_easy, selected_hard])
        else:
            selected = selected_easy

        np.random.shuffle(selected)
        self.current_step += 1

        return X[selected], y[selected]

    def reset(self):
        self.current_step = 0
        self.pacing = 0.3


class TaskSequencer:
    """
    Sequences multiple tasks in an optimal order to maximize
    positive transfer and minimize catastrophic forgetting.
    """

    def __init__(self, strategy: str = 'interleaved'):
        self.strategy = strategy
        self.task_history: List[str] = []
        self.task_performance: Dict[str, List[float]] = {}

    def add_task_result(self, task_id: str, performance: float):
        if task_id not in self.task_performance:
            self.task_performance[task_id] = []
        self.task_performance[task_id].append(performance)

    def get_next_task(self, available_tasks: List[str],
                      task_similarities: Optional[Dict[str, Dict[str, float]]] = None) -> str:
        if self.strategy == 'interleaved':
            task_counts = {t: self.task_history.count(t) for t in available_tasks}
            next_task = min(task_counts, key=task_counts.get)
        elif self.strategy == 'worst_first':
            avg_perf = {}
            for t in available_tasks:
                perf = self.task_performance.get(t, [])
                avg_perf[t] = float(np.mean(perf)) if perf else 0.0
            next_task = min(avg_perf, key=avg_perf.get)
        elif self.strategy == 'transfer_boost' and task_similarities:
            last_task = self.task_history[-1] if self.task_history else None
            if last_task:
                sims = {t: task_similarities.get(last_task, {}).get(t, 0) for t in available_tasks if t != last_task}
                next_task = max(sims, key=sims.get) if sims else available_tasks[0]
            else:
                next_task = available_tasks[0]
        else:
            task_counts = {t: self.task_history.count(t) for t in available_tasks}
            next_task = min(task_counts, key=task_counts.get)

        self.task_history.append(next_task)
        return next_task

    def get_state(self) -> Dict[str, Any]:
        return {
            'strategy': self.strategy,
            'tasks_seen': len(set(self.task_history)),
            'total_steps': len(self.task_history),
            'task_performance': {t: float(np.mean(p)) for t, p in self.task_performance.items() if p},
        }


class CurriculumLearningManager:
    """
    Integrated manager combining difficulty scoring, curriculum
    scheduling, and task sequencing for comprehensive curriculum
    learning in continual learning scenarios.
    """

    def __init__(self,
                 difficulty_method: str = 'distance_from_mean',
                strategy: str = 'interleaved'):
        self.difficulty_scorer = DifficultyScorer(method=difficulty_method)
        self.scheduler = CurriculumScheduler()
        self.task_sequencer = TaskSequencer(strategy=strategy)

    def prepare_batch(self, X: np.ndarray, y: np.ndarray,
                      batch_size: int,
                      predictions: Optional[np.ndarray] = None,
                      scaler: Optional[Callable] = None) -> Tuple[np.ndarray, np.ndarray]:
        if scaler:
            X = scaler.transform(X) if hasattr(scaler, 'transform') else X

        difficulties = self.difficulty_scorer.score_samples(X, y, predictions)
        X_curated, y_curated = self.scheduler.schedule_batch(X, y, difficulties, batch_size)
        return X_curated, y_curated

    def sequence_tasks(self, available_tasks: List[str],
                       similarities: Optional[Dict[str, Dict[str, float]]] = None) -> str:
        return self.task_sequencer.get_next_task(available_tasks, similarities)

    def record_performance(self, task_id: str, performance: float):
        self.task_sequencer.add_task_result(task_id, performance)

    def get_state(self) -> Dict[str, Any]:
        return {
            'difficulty': self.difficulty_scorer.get_difficulty_distribution(),
            'scheduler_pacing': self.scheduler.get_pacing(),
            'task_sequencer': self.task_sequencer.get_state(),
        }


if __name__ == "__main__":
    np.random.seed(42)
    manager = CurriculumLearningManager(difficulty_method='distance_from_mean')

    X = np.random.randn(200, 5)
    y = np.sum(X[:, :3], axis=1) + np.random.randn(200) * 0.1

    for step in range(10):
        X_batch, y_batch = manager.prepare_batch(X, y, batch_size=32)

        task_id = manager.sequence_tasks(['demand_forecast', 'inventory_opt', 'supplier_eval'])
        manager.record_performance(task_id, np.random.uniform(0.7, 0.95))

        if (step + 1) % 5 == 0:
            state = manager.get_state()
            print(f"Step {step+1}: pacing={state['scheduler_pacing']:.2f}, "
                  f"task={task_id}")
