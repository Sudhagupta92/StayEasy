from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from services.occupancy_model import predict_owner_occupancy
from services.revenue_model import predict_owner_revenue
from services.maintenance_model import predict_maintenance_risk

router = APIRouter(prefix="/predictions", tags=["predictions"])

class OccupancyPredictionRequest(BaseModel):
    ownerId: str
    propertyId: Optional[str] = None

class RevenuePredictionRequest(BaseModel):
    ownerId: str
    propertyId: Optional[str] = None

class MaintenanceRiskRequest(BaseModel):
    ownerId: str
    propertyId: Optional[str] = None

@router.post("/occupancy")
def predict_occupancy(req: OccupancyPredictionRequest):
    result = predict_owner_occupancy(req.ownerId, req.propertyId)
    return {
        "success": True,
        "message": "Occupancy prediction calculated successfully",
        "data": result
    }

@router.post("/revenue")
def predict_revenue(req: RevenuePredictionRequest):
    result = predict_owner_revenue(req.ownerId, req.propertyId)
    return {
        "success": True,
        "message": "Revenue prediction calculated successfully",
        "data": result
    }

@router.post("/maintenance-risk")
def predict_maintenance(req: MaintenanceRiskRequest):
    result = predict_maintenance_risk(req.ownerId, req.propertyId)
    return {
        "success": True,
        "message": "Maintenance risk insights calculated successfully",
        "data": {
            "riskMatrix": result
        }
    }
