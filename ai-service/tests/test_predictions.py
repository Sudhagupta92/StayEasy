import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.occupancy_model import predict_owner_occupancy
from services.revenue_model import predict_owner_revenue

def test_occupancy_prediction():
    res = predict_owner_occupancy("507f1f77bcf86cd799439011")
    assert "currentOccupancy" in res
    assert "predictedOccupancy" in res
    assert "confidence" in res
    assert "trend" in res
    assert "modelType" in res

def test_revenue_prediction():
    res = predict_owner_revenue("507f1f77bcf86cd799439011")
    assert "currentMonthlyRevenue" in res
    assert "predictedNextMonthRevenue" in res
    assert "predictedThreeMonthRevenue" in res
    assert "trend" in res
