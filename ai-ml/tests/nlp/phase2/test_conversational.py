"""Phase 2 conversation tests."""

import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from nlp.conversational import instruction_llm, chatops_agent, why_what_if
from xai.integration.decision_bridge import DecisionExplanationBridge


def test_instruction_llm():
    llm = instruction_llm.InstructionLLM()
    plan = llm.generate_plan('Notify warehouse, reroute freight')
    assert plan


def test_chatops_agent():
    agent = chatops_agent.ChatOpsAgent()
    reply = agent.query('What is the status?')
    assert reply


def test_why_what_if_handler():
    bridge = DecisionExplanationBridge()
    bridge.record('approve', 'feature_0 positive')
    handler = why_what_if.WhyWhatIfHandler(bridge)
    answer = handler.answer_why('123')
    assert 'Decision' in answer
    scenario = handler.run_what_if(0.7, 0.1)
    assert abs(scenario['adjusted'] - 0.8) < 1e-6
