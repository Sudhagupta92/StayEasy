from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
from services.recommendation_engine import generate_property_recommendations

router = APIRouter(prefix="/recommendations", tags=["recommendations"])

class PropertyRecommendationRequest(BaseModel):
    userId: Optional[str] = None
    preferences: Optional[Dict[str, Any]] = None
    properties: Optional[List[Dict[str, Any]]] = None
    limit: Optional[int] = 10

@router.post("/property")
def get_property_recommendations(req: PropertyRecommendationRequest):
    recommendations = generate_property_recommendations(
        user_id=req.userId,
        preferences=req.preferences,
        input_properties=req.properties,
        limit=req.limit or 10
    )
    return {
        "success": True,
        "message": "Property recommendations generated successfully",
        "data": {
            "recommendations": recommendations,
            "totalMatches": len(recommendations)
        }
    }
