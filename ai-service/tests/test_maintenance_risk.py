import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.maintenance_model import predict_maintenance_risk

def test_maintenance_risk_scoring():
    res = predict_maintenance_risk("507f1f77bcf86cd799439011")
    assert isinstance(res, list)
    if len(res) > 0:
        item = res[0]
        assert "riskLevel" in item
        assert "riskScore" in item
        assert "factors" in item
        assert "recommendations" in item
        assert item["riskLevel"] in ["LOW", "MEDIUM", "HIGH", "CRITICAL"]
