from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class ProjectRequestCreate(BaseModel):
    name: str
    email: EmailStr
    project_type: str
    message: str
    timeline: Optional[str] = None
    budget: Optional[str] = None

    class Config:
        from_attributes = True

class ProjectRequestResponse(ProjectRequestCreate):
    id: int
    submitted_at: datetime

    class Config:
        from_attributes = True
