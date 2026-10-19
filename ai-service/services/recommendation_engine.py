from database import get_db
from services.feature_engineering import extract_property_features, compute_similarity
from bson import ObjectId

def generate_property_recommendations(user_id=None, preferences=None, input_properties=None, limit=10):
    """
    Generates hybrid personalized property recommendations for tenants.
    """
    db = get_db()
    user_prefs = preferences or {}

    # If user_id provided and no preferences passed, fetch from DB
    if user_id and db is not None and not user_prefs:
        try:
            u_obj_id = ObjectId(user_id) if isinstance(user_id, str) and len(user_id) == 24 else None
            if u_obj_id:
                user_doc = db.users.find_one({"_id": u_obj_id})
                if user_doc and "preferences" in user_doc:
                    user_prefs = user_doc["preferences"]
        except Exception as e:
            print(f"[Recommendation Engine] Preferences fetch notice: {e}")

    properties = input_properties or []
    if not properties and db is not None:
        try:
            properties = list(db.properties.find({"availabilityStatus": {"$ne": "UNAVAILABLE"}}).limit(50))
        except Exception as e:
            print(f"[Recommendation Engine] Database query notice: {e}")

    recommendations = []
    for prop in properties:
        feats = extract_property_features(prop)
        sim = compute_similarity(feats, user_prefs)

        recommendations.append({
            "propertyId": feats["property_id"],
            "propertyName": feats["title"],
            "city": feats["city"],
            "propertyType": feats["property_type"],
            "score": sim["score"],
            "reasons": sim["reasons"],
            "price": feats["min_rent"],
            "rating": feats["rating"],
            "availability": f"{feats['available_beds']} beds vacant",
            "trustScore": feats["trust_score"],
            "images": prop.get("images", []),
        })

    # Sort by match score descending
    recommendations.sort(key=lambda x: x["score"], reverse=True)

    return recommendations[:limit]
