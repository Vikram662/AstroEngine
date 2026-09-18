from pydantic import BaseModel, Field
from typing import Optional

class MatchmakingRequest(BaseModel):
    groom_dob: str = Field(..., example="1995-10-05")
    groom_tob: str = Field(..., example="14:30")
    groom_lat: float = Field(..., example=24.5854)
    groom_lon: float = Field(..., example=73.7125)
    groom_tz: float = Field(5.5, example=5.5)

    bride_dob: str = Field(..., example="1997-12-18")
    bride_tob: str = Field(..., example="09:15")
    bride_lat: float = Field(..., example=28.6139)
    bride_lon: float = Field(..., example=77.2090)
    bride_tz: float = Field(5.5, example=5.5)

    lang: Optional[str] = Field("en", description="Language selector: en, hi, gu, mr, ta, te")
