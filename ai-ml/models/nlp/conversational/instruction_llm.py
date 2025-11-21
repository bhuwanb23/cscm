"""Instruction-tuned LLM wrapper."""

from __future__ import annotations

from typing import List

try:  # pragma: no cover
    from transformers import pipeline
    HAS_TRANSFORMERS = True
except ImportError:  # pragma: no cover
    HAS_TRANSFORMERS = False
    pipeline = None


class InstructionLLM:
    def __init__(self, model_name: str = "google/flan-t5-small"):
        self.model_name = model_name
        self.pipeline = None
        if HAS_TRANSFORMERS:
            try:
                self.pipeline = pipeline("text2text-generation", model=model_name)
            except Exception:
                self.pipeline = None

    def generate_plan(self, instruction: str, context: str | None = None) -> str:
        prompt = instruction if context is None else f"Instruction: {instruction}\nContext: {context}"
        if self.pipeline:
            return self.pipeline(prompt, max_length=128)[0]['generated_text']
        steps = [f"Step {i+1}: {part.strip()}" for i, part in enumerate(instruction.split(',')) if part.strip()]
        return '\n'.join(steps) or instruction

    def batch_generate(self, instructions: List[str]) -> List[str]:
        return [self.generate_plan(instr) for instr in instructions]
