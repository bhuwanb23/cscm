"""
Unit tests for NLP components.
"""
import pytest
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..', 'models'))


class TestChatOpsAgent:
    """Tests for nlp.conversational.chatops_agent."""

    def test_query(self):
        from nlp.conversational.chatops_agent import ChatOpsAgent
        agent = ChatOpsAgent()
        response = agent.query("what is the demand forecast")
        assert response is not None
        assert isinstance(response, str)
