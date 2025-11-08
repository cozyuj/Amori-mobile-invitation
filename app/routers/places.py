import os
import requests
from fastapi import APIRouter, HTTPException, Query

router = APIRouter(prefix="/api/places", tags=["Places"])

GOOGLE_MAPS_API_KEY = os.getenv("GOOGLE_MAPS_API_KEY")
GOOGLE_PLACES_SEARCH_URL = "https://maps.googleapis.com/maps/api/place/textsearch/json"


@router.get("/search")
async def search_places(query: str = Query(..., min_length=1, max_length=100), size: int = 10):
    if not GOOGLE_MAPS_API_KEY:
        raise HTTPException(status_code=500, detail="Google Maps API key not configured")
    try:
        params = {
            "query": query,
            "key": GOOGLE_MAPS_API_KEY,
            "language": "ko",
            "region": "KR"
        }
        resp = requests.get(GOOGLE_PLACES_SEARCH_URL, params=params, timeout=10)
        
        if resp.status_code != 200:
            raise HTTPException(status_code=resp.status_code, detail="Google Places API request failed")
        
        data = resp.json()
        
        # Google Places API 응답 상태 확인
        if data.get("status") not in ["OK", "ZERO_RESULTS"]:
            error_msg = data.get("error_message", "Google Places API error")
            raise HTTPException(status_code=500, detail=error_msg)
        
        # 결과 변환
        results = []
        for place in data.get("results", [])[:size]:
            results.append({
                "id": place.get("place_id"),
                "name": place.get("name", ""),
                "address": place.get("formatted_address", ""),
                "location": place.get("geometry", {}).get("location") if place.get("geometry") else None,
            })
        
        return results
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
