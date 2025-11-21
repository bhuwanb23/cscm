"""Phase 4 privacy tests."""

import sys
import os

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
sys.path.insert(0, os.path.join(ROOT, 'models'))

from nlp.privacy import private_deployment, pii_protection, api_guard


def test_private_deployment():
    config = private_deployment.PrivateDeploymentConfig('models/model.bin', ['alice'])
    assert config.is_allowed('alice')
    assert not config.is_allowed('bob')


def test_pii_protection():
    protector = pii_protection.PIIProtector()
    masked = protector.mask('Contact me at john@acme.com or +15551234567')
    assert '[EMAIL]' in masked and '[PHONE]' in masked


def test_api_guard():
    guard = api_guard.APIGuard(['https://internal/'])
    assert guard.validate('https://internal/model')
    assert not guard.validate('https://public/model')
