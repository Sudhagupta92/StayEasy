import pandas as pd
import numpy as np

def extract_property_features(property_doc):
    """
    Extracts numerical and categorical features from a MongoDB Property document.
    """
    if not property_doc:
        return {}

    title = property_doc.get("title", "")
    city = property_doc.get("address", {}).get("city", "") if isinstance(property_doc.get("address"), dict) else ""
    room_configs = property_doc.get("roomConfigurations", [])
    
    total_beds = 0
    available_beds = 0
    rents = []

    if isinstance(room_configs, list):
        for rc in room_configs:
            if isinstance(rc, dict):
                total_beds += rc.get("totalBeds", 0)
                available_beds += rc.get("availableBeds", 0)
                if "rent" in rc:
                    rents.append(rc["rent"])

    min_rent = min(rents) if rents else property_doc.get("rentRange", {}).get("min", 0)
    max_rent = max(rents) if rents else property_doc.get("rentRange", {}).get("max", 0)
    avg_rent = np.mean(rents) if rents else min_rent

    occupied_beds = max(0, total_beds - available_beds)
    occupancy_rate = round((occupied_beds / total_beds) * 100) if total_beds > 0 else 0

    ratings = property_doc.get("ratings", {})
    overall_rating = ratings.get("overallAverage", 0) if isinstance(ratings, dict) else 0
    total_reviews = ratings.get("totalReviews", 0) if isinstance(ratings, dict) else 0
    trust_score = property_doc.get("trustScore", 88)

    amenities = property_doc.get("amenities", []) if isinstance(property_doc.get("amenities"), list) else []

    return {
        "property_id": str(property_doc.get("_id")),
        "title": title,
        "city": city,
        "property_type": property_doc.get("propertyType", "PG"),
        "total_beds": total_beds,
        "occupied_beds": occupied_beds,
        "available_beds": available_beds,
        "occupancy_rate": occupancy_rate,
        "min_rent": min_rent,
        "max_rent": max_rent,
        "avg_rent": avg_rent,
        "rating": overall_rating,
        "reviews_count": total_reviews,
        "trust_score": trust_score,
        "amenities": amenities,
    }

def compute_similarity(property_features, preferences):
    """
    Computes a hybrid match score between property features and user preferences.
    Weights:
      Price Match: 25%
      Location Match: 20%
      Amenities Match: 15%
      Rating: 15%
      Availability: 15%
      Popularity: 10%
    """
    reasons = []

    # 1. Price Match (25%)
    budget_min = preferences.get("budgetMin", 0) or 0
    budgetMax = preferences.get("budgetMax", 50000) or 50000
    prop_rent = property_features.get("min_rent", 0)

    price_score = 0
    if budget_min <= prop_rent <= budgetMax:
        price_score = 100
        reasons.append(f"Fits within your budget (₹{int(prop_rent):,}/mo)")
    elif prop_rent < budget_min:
        price_score = 80
        reasons.append("Great value below your minimum budget limit")
    else:
        diff_pct = (prop_rent - budgetMax) / budgetMax
        price_score = max(0, 100 - int(diff_pct * 100))

    # 2. Location Match (20%)
    preferred_locs = preferences.get("preferredLocations", []) or []
    prop_city = property_features.get("city", "").lower()
    
    location_score = 50
    if preferred_locs:
        matched_loc = False
        for loc in preferred_locs:
            if loc.lower() in prop_city or prop_city in loc.lower():
                matched_loc = True
                break
        if matched_loc:
            location_score = 100
            reasons.append(f"Located in your preferred area ({property_features.get('city')})")
        else:
            location_score = 40
    else:
        location_score = 80
        if property_features.get("city"):
            reasons.append(f"Located in prime area ({property_features.get('city')})")

    # 3. Amenities Match (15%)
    preferred_amenities = preferences.get("preferredAmenities", []) or []
    prop_amenities = [a.lower() for a in property_features.get("amenities", [])]
    
    amenity_score = 70
    if preferred_amenities:
        matches = [a for a in preferred_amenities if a.lower() in prop_amenities]
        match_ratio = len(matches) / len(preferred_amenities)
        amenity_score = int(match_ratio * 100)
        if matches:
            reasons.append(f"Offers preferred amenities ({', '.join(matches[:2])})")
    else:
        amenity_score = 85
        if prop_amenities:
            reasons.append("Includes high-speed WiFi & essential living amenities")

    # 4. Rating (15%)
    rating = property_features.get("rating", 0)
    rating_score = int((rating / 5.0) * 100) if rating > 0 else 75
    if rating >= 4.0:
        reasons.append(f"Highly rated by verified residents ({rating}★)")

    # 5. Availability (15%)
    avail_beds = property_features.get("available_beds", 0)
    avail_score = 100 if avail_beds > 0 else 20
    if avail_beds > 0:
        reasons.append(f"Immediate availability ({avail_beds} beds vacant)")

    # 6. Popularity (10%)
    reviews_count = property_features.get("reviews_count", 0)
    trust_score = property_features.get("trust_score", 88)
    popularity_score = min(100, int((reviews_count * 10 + trust_score) / 2))
    if trust_score >= 85:
        reasons.append(f"Verified StayEasy Trust Score ({trust_score}/100)")

    # Total Weighted Score
    total_score = int(
        0.25 * price_score +
        0.20 * location_score +
        0.15 * amenity_score +
        0.15 * rating_score +
        0.15 * avail_score +
        0.10 * popularity_score
    )

    return {
        "score": min(99, max(50, total_score)),
        "reasons": list(dict.fromkeys(reasons))[:4] # Deduplicate & return top 4
    }
