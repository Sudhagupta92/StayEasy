from database import get_db
from bson import ObjectId

def predict_maintenance_risk(owner_id, property_id=None):
    """
    Computes property maintenance risk level (LOW, MEDIUM, HIGH, CRITICAL),
    risk score (0-100), risk factors, and actionable recommendations.
    """
    db = get_db()
    
    tickets = []
    properties = []

    if db is not None:
        try:
            o_obj_id = ObjectId(owner_id) if isinstance(owner_id, str) and len(owner_id) == 24 else None
            p_obj_id = ObjectId(property_id) if isinstance(property_id, str) and len(property_id) == 24 else None

            p_query = {}
            if o_obj_id: p_query["ownerId"] = o_obj_id
            if p_obj_id: p_query["_id"] = p_obj_id
            properties = list(db.properties.find(p_query))

            t_query = {}
            if o_obj_id: t_query["ownerId"] = o_obj_id
            if p_obj_id: t_query["propertyId"] = p_obj_id
            tickets = list(db.maintenancetickets.find(t_query))
        except Exception as e:
            print(f"[Maintenance Model] Query notice: {e}")

    risk_list = []

    # If properties empty, create general entry
    if not properties:
        properties = [{"_id": property_id or "default", "title": "Property Listing"}]

    for prop in properties:
        prop_id_str = str(prop.get("_id"))
        prop_tickets = [t for t in tickets if str(t.get("propertyId")) == prop_id_str] if tickets else []
        
        total_t = len(prop_tickets)
        urgent_t = len([t for t in prop_tickets if t.get("priority") == "URGENT"])
        breached_t = len([t for t in prop_tickets if t.get("responseBreached") or t.get("resolutionBreached")])
        open_t = len([t for t in prop_tickets if t.get("status") in ["OPEN", "REOPENED", "IN_PROGRESS", "ACKNOWLEDGED"]])

        # Calculate risk score 0 - 100
        score = min(100, (total_t * 10) + (urgent_t * 20) + (breached_t * 25) + (open_t * 15))
        
        if score >= 75:
            level = "CRITICAL"
        elif score >= 50:
            level = "HIGH"
        elif score >= 25:
            level = "MEDIUM"
        else:
            level = "LOW"

        factors = []
        recommendations = []

        if urgent_t > 0:
            factors.append(f"{urgent_t} urgent maintenance ticket(s) submitted")
            recommendations.append("Dispatch technician for urgent complaints immediately")

        if breached_t > 0:
            factors.append(f"{breached_t} SLA response/resolution breach(es) recorded")
            recommendations.append("Review overdue complaints to maintain StayEasy Trust Score")

        if open_t > 0:
            factors.append(f"{open_t} open maintenance issue(s) in progress")
            recommendations.append("Acknowledge open complaints and set expected ETAs")

        if not factors:
            factors.append("Zero active maintenance SLA breaches")
            recommendations.append("Maintain routine preventive inspection of facilities")

        risk_list.append({
            "propertyId": prop_id_str,
            "propertyName": prop.get("title", "Accommodation Listing"),
            "riskLevel": level,
            "riskScore": score,
            "totalTickets": total_t,
            "openTickets": open_t,
            "urgentTickets": urgent_t,
            "breachedTickets": breached_t,
            "factors": factors,
            "recommendations": recommendations,
        })

    return risk_list
