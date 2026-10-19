import sys
import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from services.feature_engineering import extract_property_features, compute_similarity
from services.recommendation_engine import generate_property_recommendations

def test_feature_extraction():
    dummy_doc = {
        "_id": "507f1f77bcf86cd799439011",
        "title": "Elite PG Hostel",
        "address": {"city": "Bengaluru"},
        "propertyType": "PG",
        "roomConfigurations": [
            {"totalBeds": 10, "availableBeds": 4, "rent": 12000}
        ],
        "ratings": {"overallAverage": 4.5, "totalReviews": 12},
        "trustScore": 90,
        "amenities": ["AC", "Wi-Fi"]
    }

    feats = extract_property_features(dummy_doc)
    assert feats["title"] == "Elite PG Hostel"
    assert feats["city"] == "Bengaluru"
    assert feats["total_beds"] == 10
    assert feats["available_beds"] == 4
    assert feats["occupancy_rate"] == 60
    assert feats["min_rent"] == 12000

def test_similarity_scoring():
    feats = {
        "min_rent": 12000,
        "city": "Bengaluru",
        "amenities": ["AC", "Wi-Fi"],
        "rating": 4.5,
        "available_beds": 4,
        "reviews_count": 12,
        "trust_score": 90
    }
    user_prefs = {
        "budgetMin": 10000,
        "budgetMax": 15000,
        "preferredLocations": ["Bengaluru"],
        "preferredAmenities": ["Wi-Fi"]
    }

    sim = compute_similarity(feats, user_prefs)
    assert sim["score"] >= 80
    assert len(sim["reasons"]) > 0

def test_recommendation_generator():
    recs = generate_property_recommendations(limit=5)
    assert isinstance(recs, list)
