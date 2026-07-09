"""
Model Governance Framework for Advanced MLOps

This module implements a governance framework for AI/ML models in the
supply chain, providing policy enforcement, compliance tracking,
bias detection, and model approval workflows.
"""

import numpy as np
import logging
from typing import Dict, Any, List, Optional, Tuple, Callable
from datetime import datetime, timedelta
import uuid

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ModelGovernanceFramework:
    """
    Provides model governance capabilities including policy enforcement,
    compliance tracking, bias audits, approval workflows, and
    risk assessment for AI models in the supply chain.
    """

    def __init__(self, framework_name: str = "cscm_governance"):
        """
        Initialize the governance framework.

        Args:
            framework_name: Name of this governance framework instance
        """
        self.framework_name = framework_name
        self.policies = {}
        self.compliance_records = {}
        self.approval_workflows = {}
        self.bias_audits = {}
        self.risk_assessments = {}
        self.audit_trail = []

    def create_policy(self,
                      policy_id: str,
                      name: str,
                      description: str,
                      rules: List[Dict[str, Any]],
                      severity: str = 'medium',
                      enabled: bool = True) -> Dict[str, Any]:
        """
        Create a governance policy with defined rules.

        Args:
            policy_id: Unique policy identifier
            name: Human-readable policy name
            description: Policy description
            rules: List of rule definitions
            severity: Policy severity ('low', 'medium', 'high', 'critical')
            enabled: Whether the policy is active

        Returns:
            Dictionary with policy details
        """
        policy = {
            'policy_id': policy_id,
            'name': name,
            'description': description,
            'rules': rules,
            'severity': severity,
            'enabled': enabled,
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat(),
            'violation_count': 0,
        }
        self.policies[policy_id] = policy

        self._log_audit('policy_created', {
            'policy_id': policy_id,
            'name': name,
            'severity': severity,
        })

        logger.info(f"Policy '{name}' created (id={policy_id}, severity={severity})")
        return policy

    def evaluate_compliance(self,
                            model_id: str,
                            model_metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a model against all enabled policies.

        Args:
            model_id: Model identifier
            model_metadata: Model metadata for compliance evaluation

        Returns:
            Dictionary with compliance evaluation results
        """
        violations = []
        warnings = []
        passed = 0
        total_policies = 0

        for policy_id, policy in self.policies.items():
            if not policy['enabled']:
                continue

            total_policies += 1
            policy_violations = []

            for rule in policy['rules']:
                result = self._evaluate_rule(rule, model_metadata)
                if result['violated']:
                    policy_violations.append(result)
                    if policy['severity'] in ['high', 'critical']:
                        violations.append({
                            'policy_id': policy_id,
                            'policy_name': policy['name'],
                            'rule': rule.get('name', 'unnamed'),
                            'severity': policy['severity'],
                            'detail': result.get('detail', ''),
                        })
                    else:
                        warnings.append({
                            'policy_id': policy_id,
                            'policy_name': policy['name'],
                            'rule': rule.get('name', 'unnamed'),
                            'severity': policy['severity'],
                            'detail': result.get('detail', ''),
                        })

            if not policy_violations:
                passed += 1

        is_compliant = len(violations) == 0
        compliance_status = 'compliant' if is_compliant else (
            'non_compliant' if violations else 'compliant_with_warnings'
        )

        result = {
            'model_id': model_id,
            'timestamp': datetime.now().isoformat(),
            'compliance_status': compliance_status,
            'is_compliant': is_compliant,
            'policies_evaluated': total_policies,
            'policies_passed': passed,
            'policies_failed': len(violations) + len(warnings),
            'violations': violations,
            'warnings': warnings,
            'summary': f"{passed}/{total_policies} policies passed, "
                       f"{len(violations)} violations, {len(warnings)} warnings",
        }

        self.compliance_records[model_id] = result
        self._log_audit('compliance_evaluated', {
            'model_id': model_id,
            'compliance_status': compliance_status,
            'violations': len(violations),
        })

        return result

    def _evaluate_rule(self, rule: Dict[str, Any], metadata: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluate a single rule against model metadata.

        Args:
            rule: Rule definition
            metadata: Model metadata

        Returns:
            Dictionary with evaluation result
        """
        rule_type = rule.get('type', '')
        field = rule.get('field', '')
        operator = rule.get('operator', 'eq')
        threshold = rule.get('threshold')
        actual_value = metadata.get(field)

        violated = False
        detail = f"Rule '{rule.get('name', '')}': field={field}, operator={operator}, threshold={threshold}"

        if actual_value is None:
            if operator == 'exists':
                violated = True
                detail += f" - field '{field}' does not exist"
        else:
            if operator == 'eq':
                violated = actual_value != threshold
            elif operator == 'neq':
                violated = actual_value == threshold
            elif operator == 'gt':
                violated = actual_value <= threshold
            elif operator == 'gte':
                violated = actual_value < threshold
            elif operator == 'lt':
                violated = actual_value >= threshold
            elif operator == 'lte':
                violated = actual_value > threshold
            elif operator == 'in':
                violated = actual_value not in (threshold or [])
            elif operator == 'between':
                if isinstance(threshold, list) and len(threshold) == 2:
                    violated = actual_value < threshold[0] or actual_value > threshold[1]
            elif operator == 'exists':
                violated = False
            elif operator == 'regex':
                import re
                violated = not bool(re.match(str(threshold or ''), str(actual_value)))
            elif operator == 'accuracy_min':
                violated = actual_value < threshold
                detail += f" (actual accuracy: {actual_value})"

        return {
            'violated': violated,
            'detail': detail,
            'rule_name': rule.get('name', ''),
        }

    def run_bias_audit(self,
                       model_id: str,
                       predictions: np.ndarray,
                       sensitive_attributes: Dict[str, np.ndarray],
                       ground_truth: Optional[np.ndarray] = None) -> Dict[str, Any]:
        """
        Run a bias audit on model predictions across sensitive attributes.

        Args:
            model_id: Model identifier
            predictions: Model predictions
            sensitive_attributes: Dictionary mapping attribute name to values
            ground_truth: Optional ground truth labels

        Returns:
            Dictionary with bias audit results
        """
        predictions = np.asarray(predictions).flatten()
        audit_results = {}
        overall_bias_score = 0.0
        num_attributes = 0

        for attr_name, attr_values in sensitive_attributes.items():
            attr_values = np.asarray(attr_values).flatten()
            unique_groups = np.unique(attr_values)

            if len(unique_groups) < 2:
                continue

            group_stats = {}
            for group in unique_groups:
                mask = attr_values == group
                group_preds = predictions[mask]
                group_stats[str(group)] = {
                    'count': int(np.sum(mask)),
                    'mean': float(np.mean(group_preds)),
                    'std': float(np.std(group_preds)) if len(group_preds) > 1 else 0.0,
                    'min': float(np.min(group_preds)),
                    'max': float(np.max(group_preds)),
                }

            means = [v['mean'] for v in group_stats.values()]
            max_diff = max(means) - min(means) if len(means) > 1 else 0.0
            std_of_means = float(np.std(means)) if len(means) > 1 else 0.0
            disparity_ratio = min(means) / max(means) if max(means) > 0 and len(means) > 1 else 1.0

            demographic_parity = 1.0 - min(1.0, max_diff / (np.std(predictions) + 1e-10))

            equal_opportunity = 1.0
            if ground_truth is not None:
                gt = np.asarray(ground_truth).flatten()
                tprs = []
                for group in unique_groups:
                    mask = attr_values == group
                    group_gt = gt[mask]
                    group_preds = predictions[mask]
                    if np.sum(group_gt > 0) > 0:
                        tpr = np.mean(group_preds[group_gt > 0] > 0.5)
                        tprs.append(tpr)
                if len(tprs) > 1:
                    equal_opportunity = 1.0 - abs(max(tprs) - min(tprs))

            attr_bias_score = 1.0 - demographic_parity

            audit_results[attr_name] = {
                'groups': group_stats,
                'max_mean_difference': float(max_diff),
                'std_of_means': float(std_of_means),
                'disparity_ratio': float(disparity_ratio),
                'demographic_parity': float(demographic_parity),
                'equal_opportunity': float(equal_opportunity),
                'bias_score': float(attr_bias_score),
                'bias_level': 'low' if attr_bias_score < 0.1 else (
                    'medium' if attr_bias_score < 0.2 else 'high'
                ),
            }

            overall_bias_score += attr_bias_score
            num_attributes += 1

        if num_attributes > 0:
            overall_bias_score /= num_attributes

        audit = {
            'model_id': model_id,
            'timestamp': datetime.now().isoformat(),
            'attributes_audited': num_attributes,
            'overall_bias_score': float(overall_bias_score),
            'overall_bias_level': 'low' if overall_bias_score < 0.1 else (
                'medium' if overall_bias_score < 0.2 else 'high'
            ),
            'attribute_results': audit_results,
            'recommendations': self._generate_bias_recommendations(audit_results),
        }

        self.bias_audits[model_id] = audit
        self._log_audit('bias_audit_completed', {
            'model_id': model_id,
            'overall_bias_score': float(overall_bias_score),
        })

        return audit

    def _generate_bias_recommendations(self, audit_results: Dict) -> List[str]:
        """Generate bias mitigation recommendations."""
        recommendations = []
        for attr, result in audit_results.items():
            if result['bias_score'] > 0.2:
                recommendations.append(
                    f"High bias detected in '{attr}': Consider rebalancing training data "
                    f"or applying fairness constraints (bias score: {result['bias_score']:.3f})"
                )
            elif result['bias_score'] > 0.1:
                recommendations.append(
                    f"Moderate bias in '{attr}': Monitor closely and consider "
                    f"post-processing calibration (bias score: {result['bias_score']:.3f})"
                )
        if not recommendations:
            recommendations.append("No significant bias detected across audited attributes")
        return recommendations

    def assess_model_risk(self,
                          model_id: str,
                          model_type: str,
                          risk_factors: Dict[str, Any]) -> Dict[str, Any]:
        """
        Assess the risk level of a model.

        Args:
            model_id: Model identifier
            model_type: Type of model
            risk_factors: Dictionary of risk factor assessments

        Returns:
            Dictionary with risk assessment
        """
        weights = {
            'data_sensitivity': 0.25,
            'decision_impact': 0.25,
            'model_complexity': 0.15,
            'data_quality': 0.15,
            'monitoring_coverage': 0.10,
            'explainability': 0.10,
        }

        weighted_score = 0.0
        max_possible = 0.0
        factor_details = {}

        for factor, weight in weights.items():
            score = risk_factors.get(factor, 0.5)
            weighted_score += weight * score
            max_possible += weight * 1.0
            factor_details[factor] = {
                'score': score,
                'weight': weight,
                'weighted_contribution': weight * score,
            }

        normalized_score = weighted_score / max_possible if max_possible > 0 else 0.5

        if normalized_score < 0.3:
            risk_level = 'low'
        elif normalized_score < 0.5:
            risk_level = 'medium'
        elif normalized_score < 0.7:
            risk_level = 'high'
        else:
            risk_level = 'critical'

        assessment = {
            'model_id': model_id,
            'model_type': model_type,
            'timestamp': datetime.now().isoformat(),
            'risk_score': float(normalized_score),
            'risk_level': risk_level,
            'factor_details': factor_details,
            'requires_approval': risk_level in ['high', 'critical'],
            'next_review_date': (datetime.now() + timedelta(days=90)).isoformat(),
            'recommendations': self._generate_risk_recommendations(risk_level, factor_details),
        }

        self.risk_assessments[model_id] = assessment
        self._log_audit('risk_assessment_completed', {
            'model_id': model_id,
            'risk_level': risk_level,
            'risk_score': float(normalized_score),
        })

        return assessment

    def _generate_risk_recommendations(self, risk_level: str,
                                        factors: Dict) -> List[str]:
        """Generate risk mitigation recommendations."""
        recommendations = []
        if risk_level in ['high', 'critical']:
            recommendations.append("Immediate senior review required before deployment")
            recommendations.append("Enhanced monitoring and alerting must be configured")
        if risk_level == 'medium':
            recommendations.append("Regular monitoring and quarterly review recommended")
        if risk_level == 'low':
            recommendations.append("Standard monitoring sufficient")

        for factor, details in factors.items():
            if details['score'] > 0.6:
                recommendations.append(
                    f"Improve {factor.replace('_', ' ')} (current score: {details['score']:.2f})"
                )

        return recommendations

    def create_approval_workflow(self,
                                  model_id: str,
                                  workflow_type: str,
                                  required_approvers: List[str]) -> Dict[str, Any]:
        """
        Create an approval workflow for model transitions.

        Args:
            model_id: Model identifier
            workflow_type: Type of workflow ('deployment', 'promotion', 'archival')
            required_approvers: List of required approvers

        Returns:
            Dictionary with workflow details
        """
        workflow_id = f"wf_{uuid.uuid4().hex[:8]}"
        workflow = {
            'workflow_id': workflow_id,
            'model_id': model_id,
            'workflow_type': workflow_type,
            'status': 'pending',
            'required_approvers': required_approvers,
            'approved_by': [],
            'rejected_by': [],
            'comments': [],
            'created_at': datetime.now().isoformat(),
            'completed_at': None,
        }

        self.approval_workflows[workflow_id] = workflow
        self._log_audit('approval_workflow_created', {
            'workflow_id': workflow_id,
            'model_id': model_id,
            'workflow_type': workflow_type,
        })

        logger.info(f"Approval workflow {workflow_id} created for {model_id}")
        return workflow

    def approve(self, workflow_id: str, approver: str,
                comment: str = "") -> Dict[str, Any]:
        """
        Approve a workflow step.

        Args:
            workflow_id: Workflow identifier
            approver: Approver name/ID
            comment: Optional approval comment

        Returns:
            Updated workflow status
        """
        if workflow_id not in self.approval_workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow = self.approval_workflows[workflow_id]
        if approver in workflow['approved_by']:
            return {'status': 'already_approved'}

        if approver in workflow['rejected_by']:
            workflow['rejected_by'].remove(approver)

        workflow['approved_by'].append(approver)
        if comment:
            workflow['comments'].append({
                'author': approver,
                'comment': comment,
                'action': 'approved',
                'timestamp': datetime.now().isoformat(),
            })

        if set(workflow['required_approvers']).issubset(set(workflow['approved_by'])):
            workflow['status'] = 'approved'
            workflow['completed_at'] = datetime.now().isoformat()
            logger.info(f"Workflow {workflow_id} fully approved")

        self._log_audit('approval_granted', {
            'workflow_id': workflow_id,
            'approver': approver,
        })

        return {'status': workflow['status'], 'approved_count': len(workflow['approved_by'])}

    def reject(self, workflow_id: str, rejecter: str,
               reason: str) -> Dict[str, Any]:
        """
        Reject a workflow.

        Args:
            workflow_id: Workflow identifier
            rejecter: Rejecter name/ID
            reason: Rejection reason

        Returns:
            Updated workflow status
        """
        if workflow_id not in self.approval_workflows:
            raise ValueError(f"Workflow {workflow_id} not found")

        workflow = self.approval_workflows[workflow_id]
        workflow['status'] = 'rejected'
        workflow['rejected_by'].append(rejecter)
        workflow['completed_at'] = datetime.now().isoformat()
        workflow['comments'].append({
            'author': rejecter,
            'comment': reason,
            'action': 'rejected',
            'timestamp': datetime.now().isoformat(),
        })

        self._log_audit('approval_rejected', {
            'workflow_id': workflow_id,
            'rejecter': rejecter,
            'reason': reason,
        })

        logger.info(f"Workflow {workflow_id} rejected by {rejecter}")
        return {'status': 'rejected', 'rejected_by': rejecter}

    def _log_audit(self, action: str, details: Dict[str, Any]):
        """Log a governance audit event."""
        self.audit_trail.append({
            'action': action,
            'details': details,
            'timestamp': datetime.now().isoformat(),
        })

    def get_audit_trail(self, model_id: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        Get the governance audit trail.

        Args:
            model_id: Optional filter by model ID

        Returns:
            List of audit events
        """
        if model_id:
            return [
                entry for entry in self.audit_trail
                if entry['details'].get('model_id') == model_id
            ]
        return self.audit_trail

    def get_governance_summary(self, model_id: str) -> Dict[str, Any]:
        """
        Get complete governance summary for a model.

        Returns:
            Dictionary with governance summary
        """
        return {
            'model_id': model_id,
            'framework': self.framework_name,
            'compliance': self.compliance_records.get(model_id),
            'bias_audit': self.bias_audits.get(model_id),
            'risk_assessment': self.risk_assessments.get(model_id),
            'active_policies': len(self.policies),
            'total_audit_events': len(self.audit_trail),
        }


if __name__ == "__main__":
    governance = ModelGovernanceFramework()

    governance.create_policy(
        policy_id="acc_threshold",
        name="Accuracy Threshold",
        description="Model accuracy must meet minimum threshold",
        rules=[
            {"name": "min_accuracy", "type": "threshold", "field": "accuracy",
             "operator": "accuracy_min", "threshold": 0.80},
            {"name": "min_samples", "type": "threshold", "field": "training_samples",
             "operator": "gte", "threshold": 100},
        ],
        severity="high"
    )

    metadata = {
        "accuracy": 0.85,
        "training_samples": 5000,
        "model_type": "forecasting",
        "features": ["demand", "price", "promotion"],
    }
    compliance = governance.evaluate_compliance("forecaster_v1", metadata)
    print(f"Compliant: {compliance['is_compliant']}, Status: {compliance['compliance_status']}")

    rng = np.random.RandomState(42)
    preds = rng.rand(1000)
    groups = rng.choice(['A', 'B'], 1000)
    audit = governance.run_bias_audit("forecaster_v1", preds, {"region": groups})
    print(f"Bias score: {audit['overall_bias_score']:.3f}, Level: {audit['overall_bias_level']}")

    risk = governance.assess_model_risk("forecaster_v1", "forecasting", {
        "data_sensitivity": 0.3,
        "decision_impact": 0.6,
        "model_complexity": 0.4,
        "data_quality": 0.2,
        "monitoring_coverage": 0.3,
        "explainability": 0.5,
    })
    print(f"Risk level: {risk['risk_level']}, Score: {risk['risk_score']:.3f}")

    wf = governance.create_approval_workflow(
        "forecaster_v1", "deployment",
        ["manager", "compliance_officer", "data_scientist"]
    )
    governance.approve(wf['workflow_id'], "manager", "Looks good")
    governance.approve(wf['workflow_id'], "compliance_officer")
    gov_approve = governance.approve(wf['workflow_id'], "data_scientist", "Approved")
    print(f"Workflow status: {gov_approve['status']}")
